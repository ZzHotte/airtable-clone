"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { TableRow, CellValue } from "../../_store/use-table-store";
import { genColumnId } from "../../_utils/id-generator";
import { EditableCell } from "./editable-cell";

export type ColumnSchema = {
  id: string;
  name: string;
  type: "text" | "number";
};

export type TableColumnConfig = ColumnSchema;

type TableColumnsProps = {
  currentData: TableRow[];
  cellsMap: { [rowId: string]: { [colId: string]: CellValue } }; // Nested structure
  getCellValue?: (rowId: string, colId: string, colType: "text" | "number") => CellValue;
  onSetData?: (data: TableRow[]) => void; // Deprecated: No longer used, kept for backward compatibility
  onUpdateCell?: (rowId: string, columnId: string, value: string | number | null) => void;
  columns?: ColumnSchema[];
};

function getDefaultColumns(): ColumnSchema[] {
  return [
    { id: genColumnId(), name: "Name", type: "text" },
    { id: genColumnId(), name: "Number", type: "number" },
  ];
}

export function createTableColumns({
  currentData,
  cellsMap,
  getCellValue,
  onSetData,
  onUpdateCell,
  columns,
}: TableColumnsProps): ColumnDef<TableRow>[] {
  const finalColumns = columns || getDefaultColumns();
  const dataColumns: ColumnDef<TableRow>[] = finalColumns.map((col) => ({
    accessorKey: col.id,
    header: () => (
      <div 
        className="flex items-center gap-1"
        style={{
          height: "24px",
          lineHeight: "1.5",
        }}
      >
        <span className="text-xs opacity-70">
          {col.type === "text" ? "A" : "#"}
        </span>
        <span className="text-xs text-gray-900 font-medium">{col.name}</span>
      </div>
    ),
      cell: (info) => {
        const rowIndex = info.row.index;
        const row = info.row.original;
        const rowId = row.id;
        const isEditing = (info as any).isEditing ?? false;
        const onStopEditing = (info as any).onStopEditing;
        const onArrowKey = (info as any).onArrowKey;
        
        // Optimized: Read cell value directly from nested structure or use helper
        const cellValue = getCellValue 
          ? getCellValue(rowId, col.id, col.type)
          : (cellsMap?.[rowId]?.[col.id] ?? (col.type === "number" ? null : ""));

        return (
          <EditableCell
            value={cellValue}
            columnType={col.type}
            onChange={(newValue) => {
              let typedValue: string | number | null;
              if (col.type === "number") {
                if (newValue === "" || newValue === null) {
                  typedValue = null;
                } else {
                  const numValue = typeof newValue === "number" ? newValue : parseFloat(String(newValue));
                  typedValue = isNaN(numValue) ? null : numValue;
                }
              } else {
                typedValue = newValue === null ? "" : String(newValue);
              }
              
              // ========== SINGLE WRITE: Update cellsMap (new data structure) ==========
              // Note: tableDataMap is no longer updated here. currentData derives row[col.id] from cellsMap.
              if (onUpdateCell && rowId) {
                onUpdateCell(rowId, col.id, typedValue);
              }
            }}
            isEditing={isEditing}
            onStopEditing={onStopEditing}
            onArrowKey={onArrowKey}
            className="w-full"
          />
        );
      },
    size: 150,
    minSize: 100,
  }));

  return [
    {
      id: "rowNumber",
      header: () => (
        <div 
          className="flex items-center justify-center"
          style={{
            height: "24px",
            lineHeight: "1.5",
          }}
        >
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            name="select-all"
            id="select-all-checkbox"
          />
        </div>
      ),
      cell: (info) => {
        const rowIndex = info.row.index;
        return (
          <div className="text-xs text-gray-500 font-medium flex items-center justify-center">
            {rowIndex + 1}
          </div>
        );
      },
      size: 50,
      enableResizing: false,
    },
    ...dataColumns,
  ];
}
