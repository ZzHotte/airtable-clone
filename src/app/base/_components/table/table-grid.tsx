"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { TableRow } from "../../_store/use-table-store";
import { AddColumnButton } from "./add-column-button";
import { AddNewRow } from "./add-new-row";
import type { ColumnType } from "./add-column-modal";

type TableRowOrPlaceholder = TableRow & { __placeholder?: true };

type TableGridProps = {
  table: Table<TableRowOrPlaceholder>;
  onAddRow: () => void;
  onAddColumn?: (data: { name: string; type: ColumnType; defaultValue?: string }) => void;
  tableId?: string;
  totalCount: number;
  effectiveTotalCount?: number;
  isLargeTable?: boolean;
  windowOffset?: number;
  pageSize?: number;
  onWindowOffsetChange?: (offset: number) => void;
  scrollToRowIndex?: number | null;
  onScrollToRowHandled?: () => void;
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
  effectiveTotalCount,
  isLargeTable,
  windowOffset = 0,
  pageSize = 200,
  onWindowOffsetChange,
  scrollToRowIndex,
  onScrollToRowHandled,
}: TableGridProps) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const [editingCell, setEditingCell] = useState<SelectedCell>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  const rowCount = table.getRowModel().rows.length;
  const shouldUseVirtualization = totalCount > 100;
  const totalRowCount = effectiveTotalCount ?? totalCount;

  const rowVirtualizer = useVirtualizer({
    count: shouldUseVirtualization ? totalRowCount : 0,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 24,
    overscan: 10,
    enabled: shouldUseVirtualization,

    onChange: (instance) => {
      if (!shouldUseVirtualization || !isLargeTable || !onWindowOffsetChange) return;

      const items = instance.getVirtualItems();
      if (!items.length) return;

      const firstIndex = items[0]!.index;
      const lastIndex = items[items.length - 1]!.index;
      const centerIndex = Math.floor((firstIndex + lastIndex) / 2);

      const minLoaded = windowOffset;
      const maxLoaded = windowOffset + pageSize - 1;
      const preloadThreshold = 50;

      if (
        centerIndex < minLoaded + preloadThreshold ||
        centerIndex > maxLoaded - preloadThreshold
      ) {
        const halfPage = Math.floor(pageSize / 2);
        let nextStart = Math.max(0, centerIndex - halfPage);
        if (totalCount > 0) {
          nextStart = Math.min(nextStart, Math.max(0, totalCount - pageSize));
        }

        if (nextStart !== windowOffset) {
          onWindowOffsetChange(nextStart);
        }
      }
    },
  });

  useEffect(() => {
    if (scrollToRowIndex == null || !shouldUseVirtualization) return;
    rowVirtualizer.scrollToIndex(scrollToRowIndex, { align: "end" });
    onScrollToRowHandled?.();
  }, [scrollToRowIndex, shouldUseVirtualization, rowVirtualizer, onScrollToRowHandled]);

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

  const lastVirtualIndex = virtualRows.length ? virtualRows[virtualRows.length - 1]!.index : -1;
  const isAtBottom =
    shouldUseVirtualization &&
    isLargeTable &&
    totalRowCount > 0 &&
    lastVirtualIndex >= totalRowCount - 1;

  return (
      <div 
        ref={tableContainerRef}
        className="flex-1 overflow-auto" 
        style={{ backgroundColor: "#F6F8FC", scrollbarGutter: "stable" }}
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
                const raw = tableRow?.original as TableRowOrPlaceholder | undefined;
                const isPlaceholder = raw?.__placeholder;

                if (!tableRow || isPlaceholder) {
                  return (
                    <tr key={tableRow ? tableRow.id : `loading-${rowIndex}`} style={{ height: `${rowInfo.size}px` }}>
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
                  <AddNewRow onAddRow={onAddRow} variant="inline" />
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
      {isAtBottom && shouldUseVirtualization && isLargeTable && onAddRow && (
        <AddNewRow
          onAddRow={onAddRow}
          variant="sticky"
          cellWidth={headers[0]?.getSize()}
        />
      )}
    </div>
  );
}
