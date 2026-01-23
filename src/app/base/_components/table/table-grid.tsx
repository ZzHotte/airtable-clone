"use client";

import { useState } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import type { TableRow } from "../../_hooks/use-table-data";

type TableGridProps = {
  table: Table<TableRow>;
  onAddRow: () => void;
};

type SelectedCell = {
  rowIndex: number;
  columnId: string;
} | null;

export function TableGrid({ table, onAddRow }: TableGridProps) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const [editingCell, setEditingCell] = useState<SelectedCell>(null);

  const handleCellClick = (rowIndex: number, columnId: string) => {
    setSelectedCell({ rowIndex, columnId });
    setEditingCell({ rowIndex, columnId });
  };

  const handleCellDoubleClick = (rowIndex: number, columnId: string) => {
    setEditingCell({ rowIndex, columnId });
    setSelectedCell({ rowIndex, columnId });
  };

  const moveToCell = (direction: "up" | "down" | "left" | "right", fromRowIndex: number, fromColumnId: string) => {
    const rows = table.getRowModel().rows;
    const headers = table.getHeaderGroups()[0]?.headers || [];
    const editableColumns = headers.filter(
      (h) => h.id !== "rowNumber" && h.id !== "addColumn"
    );

    if (editableColumns.length === 0) return;

    const currentColIndex = editableColumns.findIndex((h) => h.id === fromColumnId);
    if (currentColIndex === -1) return;

    let newRowIndex = fromRowIndex;
    let newColIndex = currentColIndex;

    switch (direction) {
      case "up":
        newRowIndex = Math.max(0, fromRowIndex - 1);
        break;
      case "down":
        newRowIndex = Math.min(rows.length - 1, fromRowIndex + 1);
        break;
      case "left":
        newColIndex = Math.max(0, currentColIndex - 1);
        break;
      case "right":
        newColIndex = Math.min(editableColumns.length - 1, currentColIndex + 1);
        break;
    }

    const newColumnId = editableColumns[newColIndex]?.id;
    if (newColumnId) {
      setEditingCell(null);
      setSelectedCell({ rowIndex: newRowIndex, columnId: newColumnId });
      setEditingCell({ rowIndex: newRowIndex, columnId: newColumnId });
    }
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, rowIndex: number, columnId: string) => {
    if (e.key === "Enter" && !editingCell) {
      e.preventDefault();
      setEditingCell({ rowIndex, columnId });
      setSelectedCell({ rowIndex, columnId });
      return;
    }

    const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"] as const;
    if (arrowKeys.includes(e.key as typeof arrowKeys[number]) && selectedCell) {
      e.preventDefault();
      const directionMap: Record<typeof arrowKeys[number], "up" | "down" | "left" | "right"> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      moveToCell(directionMap[e.key as typeof arrowKeys[number]], rowIndex, columnId);
    }
  };

  const handleStopEditing = () => {
    setEditingCell(null);
    setSelectedCell(null);
  };

  return (
    <div className="flex-1 overflow-auto" style={{ backgroundColor: "#F6F8FC" }}>
      <div className="inline-block bg-white">
        <table className="border-collapse" style={{ tableLayout: "fixed", width: "auto" }}>
        <thead className="bg-white sticky top-0 z-20">
              {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-gray-200">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="relative px-2 py-1 text-left select-none border-r border-gray-200"
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`absolute top-0 right-0 w-1 h-full cursor-col-resize select-none touch-none group ${
                        header.column.getIsResizing()
                          ? "bg-blue-400/30"
                          : "bg-transparent hover:bg-blue-200/20"
                      } transition-colors`}
                      style={{
                        userSelect: "none",
                        touchAction: "none",
                      }}
                    >
                      <div className={`absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-px h-8 bg-gray-300 rounded-full ${
                        header.column.getIsResizing() 
                          ? "opacity-100 bg-blue-400" 
                          : "opacity-0 group-hover:opacity-100"
                      } transition-opacity`} />
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50/50 border-b border-gray-200"
            >
              {row.getVisibleCells().map((cell) => {
                const isSelected =
                  selectedCell?.rowIndex === row.index &&
                  selectedCell?.columnId === cell.column.id;
                const isEditing =
                  editingCell?.rowIndex === row.index &&
                  editingCell?.columnId === cell.column.id;
                const shouldShowBlueBorder = isSelected || isEditing;

                return (
                  <td
                    key={cell.id}
                    className={`px-2 py-1 border-r border-gray-200 relative ${
                      shouldShowBlueBorder ? "ring-2 ring-blue-500" : ""
                    }`}
                    style={{
                      width: cell.column.getSize(),
                      ...(shouldShowBlueBorder && {
                        boxShadow: "inset 0 0 0 2px rgb(59 130 246)",
                      }),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(row.index, cell.column.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleCellDoubleClick(row.index, cell.column.id);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      handleCellKeyDown(e, row.index, cell.column.id);
                    }}
                    tabIndex={0}
                  >
                    {flexRender(cell.column.columnDef.cell, {
                      ...cell.getContext(),
                      isEditing,
                      onStopEditing: handleStopEditing,
                      onArrowKey: (direction: "up" | "down" | "left" | "right") => {
                        moveToCell(direction, row.index, cell.column.id);
                      },
                    })}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="border-b border-gray-200">
            <td className="px-2 py-1 border-r border-gray-200">
              <button
                type="button"
                onClick={onAddRow}
                className="w-5 h-5 flex items-center justify-center hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600 transition-colors"
                title="Add new row"
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
            </td>
            {table.getHeaderGroups()[0]?.headers.slice(1).map((header) => (
              <td key={header.id} className="px-2 py-1 border-r border-gray-200"></td>
            ))}
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
}
