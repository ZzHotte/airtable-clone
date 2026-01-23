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
    baseTables,
  });

  const { currentData, handleSetData, handleAddRow } = useTableData({
    activeTableId: currentTableId,
    externalSetData,
  });

  const [tableColumnsMap, setTableColumnsMap] = useState<
    Record<string, Array<{ id: string; name: string; type: "text" | "number" }>>
  >({});

  const currentTableColumns = useMemo((): Array<{ id: string; name: string; type: "text" | "number" }> => {
    if (currentTableId) {
      return tableColumnsMap[currentTableId] || [
        { id: "name", name: "Name", type: "text" as const },
        { id: "number", name: "Number", type: "number" as const },
      ];
    }
    return [
      { id: "name", name: "Name", type: "text" as const },
      { id: "number", name: "Number", type: "number" as const },
    ];
  }, [currentTableId, tableColumnsMap]);

  const handleAddColumn = (data: { name: string; type: "text" | "number"; defaultValue?: string }) => {
    if (!currentTableId) return;
    
    const newColumnId = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newColumn: { id: string; name: string; type: "text" | "number" } = {
      id: newColumnId,
      name: data.name || `Column ${currentTableColumns.length + 1}`,
      type: data.type,
    };
    
    setTableColumnsMap((prev) => {
      const updated = {
        ...prev,
        [currentTableId]: [...currentTableColumns, newColumn],
      } as Record<string, Array<{ id: string; name: string; type: "text" | "number" }>>;
      return updated;
    });
    
    // 根据列类型设置默认值
    const defaultValue = data.type === "number" 
      ? (data.defaultValue ? parseFloat(data.defaultValue) || null : null)
      : (data.defaultValue || "");
    
    const updatedData = currentData.map((row) => ({
      ...row,
      [newColumnId]: defaultValue,
    }));
    handleSetData(updatedData);
  };

  const columns = useMemo(
    () =>
      createTableColumns({
        currentData,
        onSetData: handleSetData,
        columns: currentTableColumns,
      }),
    [currentData, handleSetData, currentTableColumns]
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
