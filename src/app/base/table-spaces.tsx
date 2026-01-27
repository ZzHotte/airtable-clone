"use client";

import { useMemo, useState } from "react";
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

  // ✅ Infinite rows source (pagination / lazy loading)
  // Load this first to get totalCount before deciding whether to disable full load
  const PAGE_SIZE = 200;

  const {
    data: infiniteData,
    isLoading: isLoadingRows,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = api.tableData.loadInfinite.useInfiniteQuery(
    { tableId: currentTableId, limit: PAGE_SIZE },
    {
      enabled: !!currentTableId,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      // 你也可以先关掉 refetchOnWindowFocus，避免录 demo 时抖动
      refetchOnWindowFocus: false,
    }
  );

  // ✅ total row count for UI display (and virtualizer count)
  const totalCount = infiniteData?.pages?.[0]?.totalCount ?? 0;

  // ✅ Determine if this is a large table (to disable full load in useTableStore)
  // For large tables, we skip loadData() and rely on loadInfinite() instead
  const isLargeTable = totalCount > LARGE_TABLE_THRESHOLD;

  // 使用统一的 TableStore 管理所有状态
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

  // ✅ Only the loaded rows are used as table data
  const flatRows = useMemo(() => {
    return infiniteData?.pages.flatMap((p) => p.rows) ?? [];
  }, [infiniteData]);

  // ✅ Get columns from infinite query (preferred) or fallback to store
  const tableColumns = useMemo(() => {
    const infiniteColumns = infiniteData?.pages?.[0]?.columns;
    if (infiniteColumns && infiniteColumns.length > 0) {
      return infiniteColumns;
    }
    return currentTableColumns;
  }, [infiniteData?.pages, currentTableColumns]);

  // 包装 async setData 为同步函数，以兼容 createTableColumns 的接口
  // createTableColumns 期望 onSetData: (data: TableRow[]) => void
  const handleSetData = useMemo(() => {
    return (newData: TableRow[]) => {
      // 忽略 Promise，保持同步接口
      storeSetData(newData).catch((error) => {
        console.error("Failed to set data:", error);
      });
    };
  }, [storeSetData]);

  // 包装 async addRow 为同步函数
  const handleAddRow = useMemo(() => {
    return () => {
      storeAddRow().catch((error) => {
        console.error("Failed to add row:", error);
      });
    };
  }, [storeAddRow]);

  // 包装 async addColumn 为同步函数
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

  // ✅ Create a getCellValue that reads from flatRows (infinite query data) first, then cellsMap
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
            loadedCount={flatRows.length}
            fetchNextPage={fetchNextPage}
            hasNextPage={!!hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoadingRows={isLoadingRows}
          />

          <TableBottomBar recordCount={totalCount || flatRows.length} onAddRow={handleAddRow} />
          </div>
      </div>
    </div>
  );
}
