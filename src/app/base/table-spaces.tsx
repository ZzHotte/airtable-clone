"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type Table,
} from "@tanstack/react-table";
import { api } from "~/trpc/react";
import { useTableStore, type TableRow } from "./_store/use-table-store";
import { useTableCreation } from "./_hooks/use-table-creation";
import { useAvailableTables } from "./_hooks/use-available-tables";
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

  // 使用统一的 TableStore 管理所有状态
  const {
    currentData,
    currentTableColumns,
    cellsMap,
    setData: storeSetData,
    addRow: storeAddRow,
    addColumn: storeAddColumn,
    updateCell: storeUpdateCell,
  } = useTableStore({
    activeTableId: currentTableId,
    externalSetData,
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

  const columns = useMemo(
    () =>
      createTableColumns({
        currentData,
        cellsMap,
        onSetData: handleSetData,
        onUpdateCell: handleUpdateCell,
        columns: currentTableColumns,
      }),
    [currentData, cellsMap, handleSetData, handleUpdateCell, currentTableColumns]
  );

  const table = useReactTable({
    data: currentData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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

          <TableGrid key={currentTableId} table={table} onAddRow={handleAddRow} onAddColumn={handleAddColumn} />

          <TableBottomBar recordCount={currentData.length} onAddRow={handleAddRow} />
        </div>
      </div>
    </div>
  );
}
