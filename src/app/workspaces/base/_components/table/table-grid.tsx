"use client";

import { useState, useRef, useCallback } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import type { TableRow } from "../../_store/use-table-store";
import { AddColumnButton } from "./add-column-button";
import type { ColumnType } from "./add-column-modal";

type TableGridProps = {
  table: Table<TableRow>;
  onAddRow: () => void;
  onAddColumn?: (data: { name: string; type: ColumnType; defaultValue?: string }) => void;
};

type SelectedCell = {
  rowIndex: number;
  columnId: string;
} | null;

export function TableGrid({ table, onAddRow, onAddColumn }: TableGridProps) {
  // CRITICAL OPTIMIZATION: Use refs for navigation state to avoid blocking keyboard events
  // Only use state for UI updates (focus/editing visual feedback)
  const selectedCellRef = useRef<SelectedCell>(null);
  const editingCellRef = useRef<SelectedCell>(null);
  
  // Lightweight state for triggering UI updates only when needed
  // This is a counter that increments on navigation, causing minimal re-render
  const [navigationKey, setNavigationKey] = useState(0);
  
  // Helper to update navigation state without blocking
  const updateNavigation = useCallback((selected: SelectedCell, editing: SelectedCell) => {
    selectedCellRef.current = selected;
    editingCellRef.current = editing;
    // Trigger minimal re-render for UI updates
    setNavigationKey((prev) => prev + 1);
  }, []);
  
  // Sync refs to state for components that need reactive updates
  const selectedCell = selectedCellRef.current;
  const editingCell = editingCellRef.current;

  const handleCellClick = (rowIndex: number, columnId: string) => {
    const isSameCell = 
      editingCellRef.current?.rowIndex === rowIndex && 
      editingCellRef.current?.columnId === columnId;
    
    if (!isSameCell) {
      updateNavigation({ rowIndex, columnId }, { rowIndex, columnId });
    }
  };

  const handleCellDoubleClick = (rowIndex: number, columnId: string) => {
    updateNavigation({ rowIndex, columnId }, { rowIndex, columnId });
  };

  const moveToCell = useCallback((direction: "up" | "down" | "left" | "right", fromRowIndex: number, fromColumnId: string) => {
    const rows = table.getRowModel().rows;
    const headers = table.getHeaderGroups()[0]?.headers || [];
    const editableColumns = headers.filter(
      (h) => h.id !== "rowNumber"
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
      // CRITICAL: Update refs immediately (non-blocking) for keyboard navigation
      // Use requestAnimationFrame only for UI updates to ensure smooth transition
      const newCell = { rowIndex: newRowIndex, columnId: newColumnId };
      selectedCellRef.current = newCell;
      editingCellRef.current = null; // Clear editing first
      
      // Defer UI update to next frame to avoid blocking keyboard events
      requestAnimationFrame(() => {
        editingCellRef.current = newCell;
        updateNavigation(newCell, newCell);
      });
    }
  }, [updateNavigation, table]);

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, columnId: string) => {
    if (e.key === "Enter" && !editingCellRef.current) {
      e.preventDefault();
      const newCell = { rowIndex, columnId };
      updateNavigation(newCell, newCell);
      return;
    }

    const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"] as const;
    if (arrowKeys.includes(e.key as typeof arrowKeys[number]) && selectedCellRef.current) {
      e.preventDefault();
      const directionMap: Record<typeof arrowKeys[number], "up" | "down" | "left" | "right"> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      moveToCell(directionMap[e.key as typeof arrowKeys[number]], rowIndex, columnId);
    }
  }, [updateNavigation]);

  const handleStopEditing = useCallback(() => {
    editingCellRef.current = null;
    updateNavigation(selectedCellRef.current, null);
  }, [updateNavigation]);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isCell = target.closest("td");
    const isHeader = target.closest("th");
    
    if (!isCell && !isHeader) {
      updateNavigation(null, null);
    }
  }, [updateNavigation]);

  return (
    <div 
      className="flex-1 overflow-auto" 
      style={{ backgroundColor: "#F6F8FC" }}
      onClick={handleContainerClick}
    >
      <div className="inline-block relative">
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
              className="hover:bg-gray-100/70 border-b border-gray-200 cursor-pointer"
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
                    className={`px-2 py-1 border-r border-gray-200 relative cursor-pointer ${
                      shouldShowBlueBorder ? "ring-2 ring-blue-500" : ""
                    }`}
                    style={{
                      width: cell.column.getSize(),
                      ...(shouldShowBlueBorder && {
                        boxShadow: "inset 0 0 0 2px rgb(59 130 246)",
                      }),
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (editingCell) {
                        const activeElement = document.activeElement;
                        if (activeElement && (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement)) {
                          activeElement.blur();
                        }
                      }
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
          <tr className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer">
            <td className="px-2 py-1 border-r border-gray-200 cursor-pointer">
              <button
                type="button"
                onClick={onAddRow}
                className="w-full min-h-[1.5rem] flex items-center justify-center text-gray-400 transition-colors cursor-pointer"
                title="Add new row"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 2v12M2 8h12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </td>
            {table
              .getHeaderGroups()[0]
              ?.headers.slice(1)
              .map((header) => (
                <td
                  key={header.id}
                  className="px-2 py-1 border-r border-gray-200 cursor-pointer"
                ></td>
              ))}
          </tr>
        </tbody>
      </table>
      {onAddColumn && <AddColumnButton onCreate={onAddColumn} />}
      </div>
    </div>
  );
}
