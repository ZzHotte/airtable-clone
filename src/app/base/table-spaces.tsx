"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  type Table,
} from "@tanstack/react-table";
import { keepPreviousData } from "@tanstack/react-query";
import { api } from "~/trpc/react";
import { useTableStore, type TableRow } from "./_store/use-table-store";
import { useTableCreation } from "./_hooks/use-table-creation";
import { useAvailableTables } from "./_hooks/use-available-tables";
import { useTableBackendSync } from "./_hooks/use-table-backend-sync";
import { createTableColumns } from "./_components/table/table-columns";
import { TableTabBar } from "./_components/tab/table-tab-bar";
import { TableSidebar } from "./_components/table/table-sidebar";
import { TableToolbar } from "./_components/table/table-toolbar";
import { TableGrid } from "./_components/table/table-grid";
import { TableBottomBar } from "./_components/table/table-bottom-bar";

type TableSpacesProps = {
  baseId?: string;
  tableId?: string;
  table?: Table<TableRow>;
  data?: TableRow[];
  setData?: (data: TableRow[]) => void;
};

const LARGE_TABLE_THRESHOLD = 500;

export function TableSpaces({ baseId, tableId, table: externalTable, data: externalData, setData: externalSetData }: TableSpacesProps) {
  const params = useParams();
  const currentBaseId = baseId || (params?.id as string);
  const currentTableId = tableId || (params?.tableId as string);

  const { data: baseData, isLoading: isLoadingBase } = api.base.getById.useQuery(
    { id: currentBaseId },
    { enabled: !!currentBaseId }
  );

  const baseTables = baseData?.dataTables ?? [];
  const isLoadingTables = isLoadingBase;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const availableTables = useAvailableTables({
    baseTables,
    activeTableId: currentTableId,
  });

  const { handleAddNewTab, handleTabChange } = useTableCreation({
    baseId: currentBaseId,
    baseTables,
  });

  const backendSync = useTableBackendSync();

  const PAGE_SIZE = 200;

  // 当前窗口起始 offset（只对大表有意义，小表固定为 0）
  const [windowOffset, setWindowOffset] = useState(0);
  // 大表：index → 已加载行。不整页替换，只合并，保证 data identity 稳定。
  const [rowBuffer, setRowBuffer] = useState<Record<number, TableRow & { [k: string]: string | number | null }>>({});
  // 大表首次拿到的 columns，避免随 window 切换丢失
  const [largeTableColumns, setLargeTableColumns] = useState<{ id: string; name: string; type: "text" | "number" }[] | null>(null);

  // 大表本 session 新增的行，点击 add 后立即展示，不依赖 refetch
  const [appendedRows, setAppendedRows] = useState<(TableRow & { [k: string]: string | number | null })[]>([]);
  const [scrollToRowIndex, setScrollToRowIndex] = useState<number | null>(null);

  // 当切换表时重置窗口、buffer、appended 与 scroll
  useEffect(() => {
    setWindowOffset(0);
    setRowBuffer({});
    setLargeTableColumns(null);
    setAppendedRows([]);
    setScrollToRowIndex(null);
  }, [currentTableId]);

  // 使用 loadInfinite 作为“按 offset 取一页窗口”的 API
  const {
    data: windowPage,
    isLoading: isLoadingRows,
    isFetching,
  } = api.tableData.loadInfinite.useQuery(
    { tableId: currentTableId, limit: PAGE_SIZE, cursor: windowOffset },
    {
      enabled: !!currentTableId,
      refetchOnWindowFocus: false,
      placeholderData: keepPreviousData,
    }
  );

  const totalCount = windowPage?.totalCount ?? 0;

  const isLargeTable = totalCount > LARGE_TABLE_THRESHOLD;

  // 大表：仅当非占位数据时合并到 buffer（fetch 完成后的真实响应），避免把 keepPreviousData 合并到错误 offset
  useEffect(() => {
    if (!isLargeTable || !windowPage?.rows?.length || isFetching) return;
    const offset = windowOffset;
    setRowBuffer((prev) => {
      const next = { ...prev };
      windowPage.rows.forEach((row, i) => {
        next[offset + i] = row as TableRow & { [k: string]: string | number | null };
      });
      return next;
    });
  }, [isLargeTable, windowPage?.rows, windowOffset, isFetching]);

  useEffect(() => {
    if (!isLargeTable || !windowPage?.columns?.length || isFetching) return;
    setLargeTableColumns(windowPage.columns);
  }, [isLargeTable, windowPage?.columns, isFetching]);

  const {
    currentData,
    currentTableColumns,
    cellsMap,
    getCellValue,
    setData: storeSetData,
    addRow: storeAddRow,
    addColumn: storeAddColumn,
    updateCell: storeUpdateCell,
  } = useTableStore({
    activeTableId: currentTableId,
    externalSetData,
    backendSync,
    disableRowLoad: isLargeTable,
  });

  // 小表：currentData；大表：buffer/placeholder(0..totalCount-1) + appendedRows（add-row 不参与 virtualizer，见 sticky 条）
  const flatRows = useMemo(() => {
    if (!isLargeTable) return currentData;
    const data: (TableRow & { __placeholder?: true; [k: string]: string | number | null | true | undefined })[] = Array.from(
      { length: totalCount },
      (_, i) => {
        const row = rowBuffer[i];
        if (row) return row;
        return { id: `placeholder-${i}`, __placeholder: true as const };
      }
    );
    for (const r of appendedRows) data.push(r);
    return data;
  }, [isLargeTable, currentData, totalCount, rowBuffer, appendedRows]);

  const tableColumns = useMemo(() => {
    if (!isLargeTable) return currentTableColumns;

    const base = largeTableColumns ?? [];
    if (base.length === 0) return currentTableColumns;

    const baseIds = new Set(base.map((c) => c.id));
    const extra = currentTableColumns.filter((c) => !baseIds.has(c.id));
    const merged = [...base, ...extra];

    // 大表：如果已经有其他真实列，则隐藏默认的 "Name" / "Number" 列
    if (merged.length > 2) {
      const filtered = merged.filter(
        (c) => c.name !== "Name" && c.name !== "Number"
      );
      if (filtered.length > 0) {
        return filtered;
      }
    }

    return merged;
  }, [isLargeTable, largeTableColumns, currentTableColumns]);

  const handleSetData = useMemo(() => {
    return (newData: TableRow[]) => {
      storeSetData(newData).catch((error) => {
        console.error("Failed to set data:", error);
      });
    };
  }, [storeSetData]);

  const onScrollToRowHandled = useCallback(() => setScrollToRowIndex(null), []);

  const handleAddRow = useMemo(() => {
    return async () => {
      try {
        const res = await storeAddRow();
        if (!res) return;
        if (isLargeTable) {
          const row: TableRow & { [k: string]: string | number | null } = {
            id: res.newRowId,
            ...res.cellValues,
          };
          const newIndex = totalCount + appendedRows.length;
          setAppendedRows((prev) => [...prev, row]);
          setScrollToRowIndex(newIndex);
        }
      } catch (error) {
        console.error("Failed to add row:", error);
      }
    };
  }, [storeAddRow, isLargeTable, totalCount, appendedRows.length]);

  const handleAddColumn = useMemo(() => {
    return (data: { name: string; type: "text" | "number"; defaultValue?: string }) => {
      storeAddColumn(data).catch((error) => {
        console.error("Failed to add column:", error);
      });
    };
  }, [storeAddColumn]);

  const handleUpdateCell = useMemo(() => {
    return (rowId: string, columnId: string, value: string | number | null) => {
      storeUpdateCell(rowId, columnId, value).catch((error) => {
        console.error("Failed to update cell:", error);
      });
    };
  }, [storeUpdateCell]);

  const getCellValueFromRows = useMemo(() => {
    return (rowId: string, colId: string, colType: "text" | "number") => {
      const rowMap = cellsMap[rowId];
      if (rowMap && colId in rowMap) {
        const v = rowMap[colId];
        return v ?? (colType === "number" ? null : "");
      }
      const row = flatRows.find((r) => r.id === rowId) as { id: string; [key: string]: string | number | null } | undefined;
      if (row && colId in row) {
        const value = row[colId];
        return value ?? (colType === "number" ? null : "");
      }
      return colType === "number" ? null : "";
    };
  }, [flatRows, cellsMap]);

  const columns = useMemo(
    () =>
      createTableColumns({
        currentData: flatRows,
        cellsMap,
        getCellValue: getCellValueFromRows,
        onSetData: handleSetData,
        onUpdateCell: handleUpdateCell,
        columns: tableColumns,
      }),
    [flatRows, cellsMap, getCellValueFromRows, handleSetData, handleUpdateCell, tableColumns]
  );

  const table = useReactTable({
    data: flatRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Removed getPaginationRowModel - we want to show all rows (virtualization handles performance)
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    defaultColumn: {
      size: 120,
      minSize: 60,
      maxSize: 800,
    },
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "#F6F8FC" }}>
      <TableTabBar
        isLoading={isLoadingTables}
        activeTableId={currentTableId}
        availableTables={availableTables}
        onTabChange={handleTabChange}
        onAddNewTab={handleAddNewTab}
      />

      <div className="flex-1 flex overflow-hidden">
        <TableSidebar isOpen={isSidebarOpen} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TableToolbar 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            activeTable={availableTables.find((t) => t.id === currentTableId) || null}
          />

          <TableGrid 
            key={currentTableId} 
            table={table} 
            onAddRow={handleAddRow} 
            onAddColumn={handleAddColumn} 
            tableId={currentTableId}
            totalCount={totalCount}
            effectiveTotalCount={isLargeTable ? totalCount + appendedRows.length : undefined}
            isLargeTable={isLargeTable}
            windowOffset={windowOffset}
            pageSize={PAGE_SIZE}
            onWindowOffsetChange={setWindowOffset}
            scrollToRowIndex={scrollToRowIndex}
            onScrollToRowHandled={onScrollToRowHandled}
          />

          <TableBottomBar recordCount={isLargeTable ? totalCount + appendedRows.length : (totalCount || flatRows.length)} onAddRow={handleAddRow} />
          </div>
      </div>
    </div>
  );
}
