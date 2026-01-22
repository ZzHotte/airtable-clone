"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { TableRow } from "../../_hooks/use-table-data";
import { EditableCell } from "./editable-cell";

type TableColumnsProps = {
  currentData: TableRow[];
  onSetData: (data: TableRow[]) => void;
};

export function createTableColumns({ currentData, onSetData }: TableColumnsProps): ColumnDef<TableRow>[] {
  return [
    {
      id: "rowNumber",
      header: () => (
        <div className="flex items-center justify-center">
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
    {
      accessorKey: "name",
      header: () => (
        <span className="text-xs text-gray-900 font-medium">A Name</span>
      ),
      cell: (info) => {
        const rowIndex = info.row.index;
        const row = info.row.original;
        const isEditing = (info as any).isEditing ?? false;
        const onStopEditing = (info as any).onStopEditing;
        return (
          <EditableCell
            value={row?.name ?? ""}
            onChange={(newValue) => {
              const newData = [...currentData];
              if (newData[rowIndex]) {
                newData[rowIndex] = {
                  ...newData[rowIndex],
                  name: newValue,
                };
                onSetData(newData);
              }
            }}
            isEditing={isEditing}
            onStopEditing={onStopEditing}
            className="w-full"
          />
        );
      },
      size: 150,
      minSize: 100,
    },
    {
      accessorKey: "number",
      header: () => (
        <span className="text-xs text-gray-900 font-medium"># Number</span>
      ),
      cell: (info) => {
        const rowIndex = info.row.index;
        const row = info.row.original;
        const isEditing = (info as any).isEditing ?? false;
        const onStopEditing = (info as any).onStopEditing;
        return (
          <EditableCell
            value={row?.number ?? ""}
            onChange={(newValue) => {
              const newData = [...currentData];
              if (newData[rowIndex]) {
                newData[rowIndex] = {
                  ...newData[rowIndex],
                  number: newValue,
                };
                onSetData(newData);
              }
            }}
            isEditing={isEditing}
            onStopEditing={onStopEditing}
            className="w-full"
          />
        );
      },
      size: 150,
      minSize: 100,
    },
    {
      id: "addColumn",
      header: () => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            className="w-5 h-5 flex items-center justify-center hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600 transition-colors"
            title="Add column"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2v12M2 8h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ),
      cell: () => null,
      size: 50,
      enableResizing: false,
    },
  ];
}
