"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { TableRow } from "../../_store/use-table-store";
import { AddColumnButton } from "./add-column-button";
import type { ColumnType } from "./add-column-modal";

type TableGridProps = {
  table: Table<TableRow>;
  onAddRow: () => void;
  onAddColumn?: (data: { name: string; type: ColumnType; defaultValue?: string }) => void;
  tableId?: string;
  totalCount: number;
  loadedCount: number;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoadingRows: boolean;
};

type SelectedCell = {
  rowIndex: number;
  columnId: string;
} | null;

export function TableGrid({ 
  table, 
  onAddRow, 
  onAddColumn, 
  tableId,
  totalCount,
  loadedCount,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoadingRows,
}: TableGridProps) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const [editingCell, setEditingCell] = useState<SelectedCell>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  // Use virtualization for large datasets (> 100 rows)
  // For small datasets, use regular rendering for better performance and simplicity
  const rowCount = table.getRowModel().rows.length;
  const shouldUseVirtualization = totalCount > 100; // Use virtualization for large datasets
  
  // Use totalCount from props (single source of truth)
  const totalRowCount = totalCount;

  // Create a virtual row model for the visible rows (only for large datasets)
  const rowVirtualizer = useVirtualizer({
    count: shouldUseVirtualization ? totalRowCount : 0,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 24, // Row height
    overscan: 10, // Render 10 extra rows above and below
    enabled: shouldUseVirtualization,
  });

  // Load more when scrolling near the end (using props from parent)
  useEffect(() => {
    if (!shouldUseVirtualization) return;
    
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;
    
    // Trigger load when scrolling within 5 rows of the loaded data
    if (
      lastItem.index >= loadedCount - 5 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    shouldUseVirtualization,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    loadedCount,
    rowVirtualizer.getVirtualItems(),
  ]);

  const handleCellClick = (rowIndex: number, columnId: string) => {
    const isSameCell = 
      editingCell?.rowIndex === rowIndex && 
      editingCell?.columnId === columnId;
    
    if (!isSameCell) {
      setEditingCell(null);
      setSelectedCell({ rowIndex, columnId });
      setEditingCell({ rowIndex, columnId });
    }
  };

  const handleCellDoubleClick = (rowIndex: number, columnId: string) => {
    setEditingCell({ rowIndex, columnId });
    setSelectedCell({ rowIndex, columnId });
  };

  const moveToCell = (direction: "up" | "down" | "left" | "right", fromRowIndex: number, fromColumnId: string) => {
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
        newRowIndex = Math.min(totalRowCount - 1, fromRowIndex + 1);
        // Load more if needed (using props from parent)
        if (newRowIndex >= loadedCount - 5 && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
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
      
      // Scroll to the new cell
      rowVirtualizer.scrollToIndex(newRowIndex, { align: "center" });
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

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isCell = target.closest("td");
    const isHeader = target.closest("th");
    
    if (!isCell && !isHeader) {
      setEditingCell(null);
      setSelectedCell(null);
    }
  };

  // Get virtual rows (only if virtualization is enabled)
  const virtualRows = shouldUseVirtualization ? rowVirtualizer.getVirtualItems() : [];
  const totalSize = shouldUseVirtualization ? rowVirtualizer.getTotalSize() : 0;

  // Calculate padding for virtual scrolling
  const paddingTop = shouldUseVirtualization && virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
  const paddingBottom =
    shouldUseVirtualization && virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;

  // All rows come from table prop (single source of truth from parent)
  // No need to compute allLoadedRows separately

  // Get headers for column rendering
  const headers = table.getHeaderGroups()[0]?.headers || [];
  
  // Get rows to render - use virtual rows if virtualization is enabled, otherwise use all table rows
  const rowsToRender = shouldUseVirtualization 
    ? virtualRows.map((vr) => ({ index: vr.index, size: vr.size }))
    : table.getRowModel().rows.map((row, idx) => ({ index: idx, size: 24 }));

  return (
    <div 
      ref={tableContainerRef}
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
          <tbody ref={tbodyRef} className="bg-white">
            {shouldUseVirtualization && paddingTop > 0 && (
              <tr>
                <td colSpan={headers.length} style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {rowsToRender.length === 0 && rowCount === 0 ? (
              // Show placeholder when no data is loaded yet
              <tr>
                <td colSpan={headers.length} className="px-2 py-4 text-center text-gray-400 text-xs">
                  No data yet
                </td>
              </tr>
            ) : (
              rowsToRender.map((rowInfo) => {
                const rowIndex = rowInfo.index;
                const tableRow = table.getRowModel().rows[rowIndex];
                
                // If row doesn't exist yet (still loading), show placeholder
                if (!tableRow) {
                  return (
                    <tr key={`loading-${rowIndex}`} style={{ height: `${rowInfo.size}px` }}>
                      {headers.map((header) => (
                        <td
                          key={header.id}
                          className="px-2 py-1 border-r border-gray-200"
                          style={{ width: header.getSize() }}
                        >
                          <div className="animate-pulse bg-gray-100 h-4 w-full rounded" />
                        </td>
                      ))}
                    </tr>
                  );
                }

              // Use the table row's cells directly - they already have the correct context
              const cells = tableRow.getVisibleCells();

              return (
                <tr
                  key={tableRow.id}
                  style={{ height: `${rowInfo.size}px` }}
                  className="hover:bg-gray-100/70 border-b border-gray-200 cursor-pointer"
                >
                  {cells.map((cell) => {
                    const isSelected =
                      selectedCell?.rowIndex === rowIndex &&
                      selectedCell?.columnId === cell.column.id;
                    const isEditing =
                      editingCell?.rowIndex === rowIndex &&
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
                          handleCellClick(rowIndex, cell.column.id);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleCellDoubleClick(rowIndex, cell.column.id);
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          handleCellKeyDown(e, rowIndex, cell.column.id);
                        }}
                        tabIndex={0}
                      >
                        {flexRender(cell.column.columnDef.cell, {
                          ...cell.getContext(),
                          isEditing,
                          onStopEditing: handleStopEditing,
                          onArrowKey: (direction: "up" | "down" | "left" | "right") => {
                            moveToCell(direction, rowIndex, cell.column.id);
                          },
                        })}
                      </td>
                    );
                  })}
                </tr>
              );
              })
            )}
            {shouldUseVirtualization && paddingBottom > 0 && (
              <tr>
                <td colSpan={headers.length} style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
            {!shouldUseVirtualization && (
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
                {headers.slice(1).map((header) => (
                  <td
                    key={header.id}
                    className="px-2 py-1 border-r border-gray-200 cursor-pointer"
                  ></td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
        {onAddColumn && <AddColumnButton onCreate={onAddColumn} />}
      </div>
    </div>
  );
}
