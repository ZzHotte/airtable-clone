"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { TableRow } from "../../_hooks/use-table-data";
import { EditableCell } from "./editable-cell";

/**
 * ColumnSchema: 列的 Schema 定义，一旦创建后不可变
 * - id: 列的稳定标识符
 * - name: 列的显示名称
 * - type: 列的类型，创建后固定，不允许修改
 */
export type ColumnSchema = {
  id: string;
  name: string;
  type: "text" | "number";
};

// 为了向后兼容，保留 TableColumnConfig 作为别名
export type TableColumnConfig = ColumnSchema;

type TableColumnsProps = {
  currentData: TableRow[];
  onSetData: (data: TableRow[]) => void;
  columns?: ColumnSchema[];
};

const defaultColumns: ColumnSchema[] = [
  { id: "name", name: "Name", type: "text" },
  { id: "number", name: "Number", type: "number" },
];

export function createTableColumns({
  currentData,
  onSetData,
  columns = defaultColumns,
}: TableColumnsProps): ColumnDef<TableRow>[] {
  const dataColumns: ColumnDef<TableRow>[] = columns.map((col) => ({
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
        const isEditing = (info as any).isEditing ?? false;
        const onStopEditing = (info as any).onStopEditing;
        const onArrowKey = (info as any).onArrowKey;
        const cellValue = row?.[col.id] ?? (col.type === "number" ? null : "");

        return (
          <EditableCell
            value={cellValue}
            columnType={col.type}
            onChange={(newValue) => {
              const newData = [...currentData];
              if (newData[rowIndex]) {
                // 根据列类型进行类型转换
                let typedValue: string | number | null;
                if (col.type === "number") {
                  // number 列：存储 number 或 null
                  if (newValue === "" || newValue === null) {
                    typedValue = null;
                  } else {
                    const numValue = typeof newValue === "number" ? newValue : parseFloat(String(newValue));
                    typedValue = isNaN(numValue) ? null : numValue;
                  }
                } else {
                  // text 列：存储 string
                  typedValue = newValue === null ? "" : String(newValue);
                }
                
                newData[rowIndex] = {
                  ...newData[rowIndex],
                  [col.id]: typedValue,
                };
                onSetData(newData);
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
