/**
 * Table state management store
 * Centralized state management with backend sync interface
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { genColumnId, genRowId } from "../_utils/id-generator";

// TableRow type: optimized to only store row skeleton (id)
// Cell values are read directly from cellsMap in render
export type TableRow = {
  id: string;
  // Note: Cell values are no longer stored here to avoid O(rows×cols) recalculation
  // Access cell values via getCellValue(rowId, colId) or cellsMap[rowId][colId]
};

export type Column = {
  id: string;
  name: string;
  type: "text" | "number";
};

export type CellValue = string | number | null;

// Optimized nested structure: tableId -> rowId -> colId -> value
// This allows O(1) updates per cell without copying entire table
export type CellsMap = {
  [tableId: string]: {
    [rowId: string]: {
      [colId: string]: CellValue;
    };
  };
};

type SelectedCell = {
  rowIndex: number;
  columnId: string;
} | null;

type BackendSync = {
  syncData?: (tableId: string, data: TableRow[]) => Promise<void>;
  syncColumns?: (tableId: string, columns: Column[]) => Promise<void>;
  loadData?: (tableId: string) => Promise<TableRow[]>;
  loadColumns?: (tableId: string) => Promise<Column[]>;
  syncCell?: (tableId: string, rowId: string, columnId: string, value: string | number | null) => Promise<void>;
};

type UseTableStoreProps = {
  activeTableId: string | null;
  externalSetData?: (data: TableRow[]) => void;
  backendSync?: BackendSync;
  // Optional: Preloaded data from React Query cache for instant rendering
  initialData?: { columns: Column[]; rows: TableRow[] } | null;
};

export function useTableStore({ 
  activeTableId, 
  externalSetData,
  backendSync,
  initialData,
}: UseTableStoreProps) {
  const [tableDataMap, setTableDataMap] = useState<Record<string, TableRow[]>>({});
  const [tableColumnsMap, setTableColumnsMap] = useState<Record<string, Column[]>>({});
  const [cellsMapState, setCellsMapState] = useState<CellsMap>({});
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const [editingCell, setEditingCell] = useState<SelectedCell>(null);

  // CRITICAL OPTIMIZATION: getCellValue reads directly from cellsMapState
  // This prevents cellsMap reference changes from triggering column re-creation
  // Cell updates only affect the specific cell, not the entire column definition
  const getCellValue = useCallback(
    (rowId: string, colId: string, colType: "text" | "number"): CellValue => {
      if (!activeTableId) return colType === "number" ? null : "";
      const tableMap = cellsMapState[activeTableId];
      if (!tableMap) return colType === "number" ? null : "";
      const rowMap = tableMap[rowId];
      if (!rowMap) return colType === "number" ? null : "";
      const value = rowMap[colId];
      return value ?? (colType === "number" ? null : "");
    },
    [activeTableId, cellsMapState]
  );

  // Get cells map for current table (nested structure: rowId -> colId -> value)
  // This is only used for backward compatibility, getCellValue should be preferred
  const cellsMap = useMemo(
    () => (activeTableId ? cellsMapState[activeTableId] ?? {} : {}),
    [activeTableId, cellsMapState]
  );

  const getDefaultColumns = useCallback((): Column[] => {
    return [
      { id: genColumnId(), name: "Name", type: "text" },
      { id: genColumnId(), name: "Number", type: "number" },
    ];
  }, []);

  const currentTableColumns = useMemo((): Column[] => {
    if (activeTableId) {
      const columns = tableColumnsMap[activeTableId];
      if (columns && columns.length > 0) {
        return columns;
      }
      return getDefaultColumns();
    }
    return getDefaultColumns();
  }, [activeTableId, tableColumnsMap, getDefaultColumns]);

  // Optimized: data only stores row skeletons, cells are read on-demand
  // This prevents O(rows×cols) recalculation on every cell update
  const currentData = useMemo(() => {
    if (!activeTableId) return [];
    const data = tableDataMap[activeTableId];
    if (!data?.length) return [];
    // Return row skeletons only - cell values are read directly from cellsMap in render
    return data.map((row) => ({ id: row.id }));
  }, [activeTableId, tableDataMap]);

  // Helper: Sync TableRow[] data to cellsMap (nested structure)
  // Only used for initial load or bulk updates (not on every cell edit)
  // rows can be either TableRow[] (skeleton) or full data with cell values
  const syncRowsToCellsMap = useCallback(
    (tableId: string, rows: (TableRow | { id: string; [key: string]: string | number | null })[], columns: Column[]) => {
      if (columns.length === 0) return;
      
      setCellsMapState((prev) => {
        const tableMap = prev[tableId] ?? {};
        const updatedTableMap: { [rowId: string]: { [colId: string]: CellValue } } = { ...tableMap };

        // Build nested structure: rowId -> colId -> value
        for (const row of rows) {
          if (!row.id) continue;
          const rowMap = updatedTableMap[row.id] ?? {};
          const updatedRowMap = { ...rowMap };
          
          for (const col of columns) {
            // Support both TableRow (skeleton) and full data objects
            const cellValue = (row as any)[col.id] ?? (col.type === "number" ? null : "");
            updatedRowMap[col.id] = cellValue;
          }
          
          updatedTableMap[row.id] = updatedRowMap;
        }

        return { ...prev, [tableId]: updatedTableMap };
      });
    },
    []
  );

  const setData = useCallback(
    async (newData: TableRow[]) => {
      if (!activeTableId) return;

      // Only update row list - don't rebuild cellsMap (cells are managed separately)
      setTableDataMap((prev) => ({
        ...prev,
        [activeTableId]: newData.map((row) => ({ id: row.id })),
      }));

      if (externalSetData) {
        externalSetData(newData);
      }

      if (backendSync?.syncData) {
        try {
          // Build full data for backend sync (include cell values from cellsMap)
          const fullData = newData.map((row) => {
            const rowMap = cellsMapState[activeTableId]?.[row.id] ?? {};
            const rowData: { id: string; [key: string]: string | number | null } = { id: row.id };
            for (const col of currentTableColumns) {
              rowData[col.id] = rowMap[col.id] ?? (col.type === "number" ? null : "");
            }
            return rowData;
          });
          await backendSync.syncData(activeTableId, fullData);
        } catch (error) {
          console.error("Failed to sync data to backend:", error);
        }
      }
    },
    [activeTableId, externalSetData, backendSync, currentTableColumns, cellsMapState]
  );

  const addRow = useCallback(async () => {
    if (!activeTableId) return;

    const newRowId = genRowId();
    const newRow: TableRow = { id: newRowId };
    const newData = [...currentData, newRow];

    // Initialize cells for new row first (before updating row list)
    const newRowMap: { [colId: string]: CellValue } = {};
    for (const col of currentTableColumns) {
      newRowMap[col.id] = col.type === "number" ? null : "";
    }

    // Update both row list and cells map
    setTableDataMap((prev) => ({
      ...prev,
      [activeTableId]: newData,
    }));

    setCellsMapState((prev) => {
      const tableMap = prev[activeTableId] ?? {};
      return {
        ...prev,
        [activeTableId]: {
          ...tableMap,
          [newRowId]: newRowMap,
        },
      };
    });

    if (backendSync?.syncData) {
      try {
        // Build data for backend sync using the new row map we just created
        const fullData = newData.map((row) => {
          // Use the newRowMap for the new row, otherwise get from state
          const rowMap = row.id === newRowId 
            ? newRowMap 
            : (cellsMapState[activeTableId]?.[row.id] ?? {});
          const rowData: { id: string; [key: string]: string | number | null } = { id: row.id };
          for (const col of currentTableColumns) {
            rowData[col.id] = rowMap[col.id] ?? (col.type === "number" ? null : "");
          }
          return rowData;
        });
        await backendSync.syncData(activeTableId, fullData);
      } catch (error) {
        console.error("Failed to sync new row to backend:", error);
        // Don't revert on error - keep the row in UI even if sync fails
      }
    }
  }, [activeTableId, currentData, currentTableColumns, cellsMapState, backendSync]);

  // Debounce timer refs for cell sync (per cell key)
  const syncTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      syncTimersRef.current.forEach((timer) => clearTimeout(timer));
      syncTimersRef.current.clear();
    };
  }, []);

  const updateCell = useCallback(
    async (rowId: string, columnId: string, value: string | number | null) => {
      if (!activeTableId) return;

      // Optimized: Only update the specific cell in nested structure (O(1) update)
      setCellsMapState((prev) => {
        const tableMap = prev[activeTableId] ?? {};
        const rowMap = tableMap[rowId] ?? {};
        
        // Skip if value unchanged
        if (rowMap[columnId] === value) return prev;
        
        // Only copy the affected row, not entire table
        const updatedRowMap = { ...rowMap, [columnId]: value };
        const updatedTableMap = { ...tableMap, [rowId]: updatedRowMap };
        
        return { ...prev, [activeTableId]: updatedTableMap };
      });

      // Debounce backend sync to avoid blocking input
      // Clear existing timer for this cell
      const cellKey = `${activeTableId}:${rowId}:${columnId}`;
      const existingTimer = syncTimersRef.current.get(cellKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer for debounced sync (500ms delay)
      const timer = setTimeout(async () => {
        syncTimersRef.current.delete(cellKey);
        if (backendSync?.syncCell) {
          try {
            await backendSync.syncCell(activeTableId, rowId, columnId, value);
          } catch (error) {
            console.error("Failed to sync cell to backend:", error);
          }
        }
      }, 500);
      
      syncTimersRef.current.set(cellKey, timer);
    },
    [activeTableId, backendSync]
  );

  const setColumns = useCallback(
    async (columns: Column[]) => {
      if (!activeTableId) return;

      setTableColumnsMap((prev) => ({
        ...prev,
        [activeTableId]: columns,
      }));

      if (backendSync?.syncColumns) {
        try {
          await backendSync.syncColumns(activeTableId, columns);
        } catch (error) {
          console.error("Failed to sync columns to backend:", error);
        }
      }
    },
    [activeTableId, backendSync]
  );

  const addColumn = useCallback(
    async (data: { name: string; type: "text" | "number"; defaultValue?: string }) => {
      if (!activeTableId) return;

      const newColumnId = genColumnId();
      const newColumn: Column = {
        id: newColumnId,
        name: data.name || `Column ${currentTableColumns.length + 1}`,
        type: data.type,
      };

      const newColumns = [...currentTableColumns, newColumn];
      await setColumns(newColumns);

      const defaultValue = data.type === "number" 
        ? (data.defaultValue ? parseFloat(data.defaultValue) || null : null)
        : (data.defaultValue || "");

      // Only update cells for new column (not entire table rebuild)
      setCellsMapState((prev) => {
        const tableMap = prev[activeTableId] ?? {};
        const updatedTableMap: typeof tableMap = {};
        
        // For each row, add the new column's default value
        for (const row of currentData) {
          const rowMap = tableMap[row.id] ?? {};
          updatedTableMap[row.id] = {
            ...rowMap,
            [newColumnId]: defaultValue,
          };
        }
        
        return {
          ...prev,
          [activeTableId]: {
            ...tableMap,
            ...updatedTableMap,
          },
        };
      });

      if (backendSync?.syncData) {
        try {
          // Build full data for backend sync
          const fullData = currentData.map((row) => {
            const rowMap = cellsMapState[activeTableId]?.[row.id] ?? {};
            const rowData: { id: string; [key: string]: string | number | null } = { id: row.id };
            for (const col of newColumns) {
              rowData[col.id] = rowMap[col.id] ?? (col.type === "number" ? null : "");
            }
            return rowData;
          });
          await backendSync.syncData(activeTableId, fullData);
        } catch (error) {
          console.error("Failed to sync new column to backend:", error);
        }
      }
    },
    [activeTableId, currentTableColumns, currentData, setColumns, cellsMapState, backendSync]
  );

  const setSelected = useCallback((cell: SelectedCell) => {
    setSelectedCell(cell);
  }, []);

  const setEditing = useCallback((cell: SelectedCell) => {
    setEditingCell(cell);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCell(null);
    setEditingCell(null);
  }, []);

  // Load table data from backend when activeTableId changes
  // Use refs to track state and prevent infinite loops
  const lastLoadedTableIdRef = useRef<string | null>(null);
  const loadDataRef = useRef(backendSync?.loadData);
  const loadColumnsRef = useRef(backendSync?.loadColumns);
  
  // Update refs when backendSync functions change (but don't trigger load effect)
  useEffect(() => {
    loadDataRef.current = backendSync?.loadData;
    loadColumnsRef.current = backendSync?.loadColumns;
  }, [backendSync?.loadData, backendSync?.loadColumns]);
  
  // Handle initial data from React Query cache (instant loading)
  useEffect(() => {
    if (initialData && activeTableId) {
      const { rows, columns } = initialData;
      // Only set if we don't already have this data (avoid overwriting with stale cache)
      const hasData = (tableDataMap[activeTableId]?.length ?? 0) > 0;
      const hasColumns = (tableColumnsMap[activeTableId]?.length ?? 0) > 0;
      
      if (!hasData && rows && rows.length > 0) {
        setTableDataMap((prev) => ({ ...prev, [activeTableId]: rows }));
      }
      if (!hasColumns && columns && columns.length > 0) {
        setTableColumnsMap((prev) => ({ ...prev, [activeTableId]: columns }));
      }
      if (columns && columns.length > 0 && rows && rows.length > 0) {
        syncRowsToCellsMap(activeTableId, rows, columns);
        lastLoadedTableIdRef.current = activeTableId;
      }
    }
  }, [initialData, activeTableId, syncRowsToCellsMap, tableDataMap, tableColumnsMap]);
  
  // Fallback: Load from backend if no initial data and not already loaded
  useEffect(() => {
    if (!activeTableId || !loadDataRef.current || !loadColumnsRef.current) {
      lastLoadedTableIdRef.current = null;
      return;
    }
    
    // Skip if we've already loaded this table (data is in state)
    if (lastLoadedTableIdRef.current === activeTableId) {
      const hasData = (tableDataMap[activeTableId]?.length ?? 0) > 0;
      const hasColumns = (tableColumnsMap[activeTableId]?.length ?? 0) > 0;
      if (hasData || hasColumns) return;
    }

    // Skip if we have initial data (it will be handled by the effect above)
    if (initialData && initialData.rows && initialData.columns) return;

    let cancelled = false;
    void (async () => {
      try {
        const [rows, columns] = await Promise.all([
          loadDataRef.current!(activeTableId),
          loadColumnsRef.current!(activeTableId),
        ]);
        if (cancelled) return;
        
        lastLoadedTableIdRef.current = activeTableId;
        
        setTableDataMap((prev) => ({ ...prev, [activeTableId]: rows }));
        setTableColumnsMap((prev) => ({ ...prev, [activeTableId]: columns }));
        
        if (columns.length > 0) {
          syncRowsToCellsMap(activeTableId, rows, columns);
        }
      } catch (error) {
        if (!cancelled) console.error("Failed to load table data from backend:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTableId, syncRowsToCellsMap, tableDataMap, tableColumnsMap, initialData]);

  return {
    currentData,
    currentTableColumns,
    cellsMap,
    getCellValue, // Expose helper for reading cell values
    setData,
    addRow,
    updateCell,
    setColumns,
    addColumn,
    selectedCell,
    editingCell,
    setSelected,
    setEditing,
    clearSelection,
  };
}
