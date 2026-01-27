"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  type Table,
} from "@tanstack/react-table";
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

  // 当切换表时重置窗口到顶部
  useEffect(() => {
    setWindowOffset(0);
  }, [currentTableId]);

  // 使用 loadInfinite 作为“按 offset 取一页窗口”的 API
  const {
    data: windowPage,
    isLoading: isLoadingRows,
  } = api.tableData.loadInfinite.useQuery(
    { tableId: currentTableId, limit: PAGE_SIZE, cursor: windowOffset },
    {
      enabled: !!currentTableId,
      refetchOnWindowFocus: false,
    }
  );

  const totalCount = windowPage?.totalCount ?? 0;

  const isLargeTable = totalCount > LARGE_TABLE_THRESHOLD;

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

  const flatRows = useMemo(() => {
    if (isLargeTable) {
      return windowPage?.rows ?? [];
    }
    return currentData;
  }, [windowPage, currentData, isLargeTable]);

  const tableColumns = useMemo(() => {
    const windowColumns = windowPage?.columns;

    if (isLargeTable && windowColumns && windowColumns.length > 0) {
      return windowColumns;
    }

    return currentTableColumns;
  }, [windowPage, currentTableColumns, isLargeTable]);

  const handleSetData = useMemo(() => {
    return (newData: TableRow[]) => {
      storeSetData(newData).catch((error) => {
        console.error("Failed to set data:", error);
      });
    };
  }, [storeSetData]);

  const handleAddRow = useMemo(() => {
    return () => {
      storeAddRow().catch((error) => {
        console.error("Failed to add row:", error);
      });
    };
  }, [storeAddRow]);

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
      // First try to get from flatRows (infinite query data)
      const row = flatRows.find((r) => r.id === rowId) as { id: string; [key: string]: string | number | null } | undefined;
      if (row && colId in row) {
        const value = row[colId];
        return value ?? (colType === "number" ? null : "");
      }
      // Fallback to cellsMap (for edited cells)
      return getCellValue(rowId, colId, colType);
    };
  }, [flatRows, getCellValue]);

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
            isLargeTable={isLargeTable}
            windowOffset={windowOffset}
            pageSize={PAGE_SIZE}
            onWindowOffsetChange={setWindowOffset}
          />

          <TableBottomBar recordCount={totalCount || flatRows.length} onAddRow={handleAddRow} />
          </div>
      </div>
    </div>
  );
}
