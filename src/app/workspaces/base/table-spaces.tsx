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
import { TableSkeleton } from "./_components/table/table-skeleton";

type TableSpacesProps = {
  baseId?: string;
  tableId?: string;
  table?: Table<TableRow>;
  data?: TableRow[];
  setData?: (data: TableRow[]) => void;
};

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

  // Use React Query to load data with caching for instant loading
  // This leverages React Query's cache - subsequent visits will be instant
  const { data: tableData, isLoading: isLoadingTableData } = api.tableData.load.useQuery(
    { tableId: currentTableId },
    {
      enabled: !!currentTableId,
      staleTime: 30 * 1000, // Consider data fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      // Use cached data immediately if available, then revalidate in background
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch if data is in cache
    }
  );

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
    // Pass preloaded data to store for instant rendering
    initialData: tableData,
  });

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

  // CRITICAL OPTIMIZATION: columns should NOT depend on cellsMap
  // Cell values are read on-demand via getCellValue during render
  // This prevents column re-creation on every cell update
  const columns = useMemo(
    () =>
      createTableColumns({
        currentData,
        cellsMap: {}, // Not used when getCellValue is provided
        getCellValue,
        onSetData: handleSetData,
        onUpdateCell: handleUpdateCell,
        columns: currentTableColumns,
      }),
    [currentData, getCellValue, handleSetData, handleUpdateCell, currentTableColumns]
  );

  const table = useReactTable({
    data: currentData,
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

          {isLoadingTableData && !tableData ? (
            <TableSkeleton />
          ) : (
            <TableGrid key={currentTableId} table={table} onAddRow={handleAddRow} onAddColumn={handleAddColumn} />
          )}

          <TableBottomBar recordCount={currentData.length} onAddRow={handleAddRow} />
        </div>
      </div>
    </div>
  );
}
