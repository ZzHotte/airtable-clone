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
import { useTableData, type TableRow } from "./_hooks/use-table-data";
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
    tableId: currentTableId,
    baseTables,
    isLoadingTables,
  });

  const { currentData, handleSetData, handleAddRow } = useTableData({
    activeTableId: currentTableId,
    externalSetData,
  });

  const [tableColumns, setTableColumns] = useState<
    Array<{ key: string; name: string; type: "text" | "number" }>
  >([
    { key: "name", name: "A Name", type: "text" },
    { key: "number", name: "# Number", type: "number" },
  ]);

  const handleAddColumn = () => {
    const newColumnKey = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newColumn = {
      key: newColumnKey,
      name: `Column ${tableColumns.length + 1}`,
      type: "text" as const,
    };
    setTableColumns([...tableColumns, newColumn]);
    
    // 为所有现有行添加新列的字段
    const updatedData = currentData.map((row) => ({
      ...row,
      [newColumnKey]: "",
    }));
    handleSetData(updatedData);
  };

  const columns = useMemo(
    () =>
      createTableColumns({
        currentData,
        onSetData: handleSetData,
        columns: tableColumns,
        onAddColumn: handleAddColumn,
      }),
    [currentData, handleSetData, tableColumns, handleAddColumn]
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
          <TableToolbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

          <TableGrid table={table} onAddRow={handleAddRow} />

          <TableBottomBar recordCount={currentData.length} onAddRow={handleAddRow} />
        </div>
      </div>
    </div>
  );
}
