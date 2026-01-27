import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { genColumnId, genRowId } from "../_utils/id-generator";

export type TableRow = {
  id: string;
};

export type Column = {
  id: string;
  name: string;
  type: "text" | "number";
};

export type CellValue = string | number | null;
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
  appendRow?: (tableId: string, rowId: string) => Promise<void>;
};

type UseTableStoreProps = {
  activeTableId: string | null;
  externalSetData?: (data: TableRow[]) => void;
  backendSync?: BackendSync;
  disableRowLoad?: boolean; 
};

export function useTableStore({ 
  activeTableId, 
  externalSetData,
  backendSync,
  disableRowLoad = false,
}: UseTableStoreProps) {
  const [tableDataMap, setTableDataMap] = useState<Record<string, TableRow[]>>({});
  const [tableColumnsMap, setTableColumnsMap] = useState<Record<string, Column[]>>({});
  const [cellsMapState, setCellsMapState] = useState<CellsMap>({});
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const [editingCell, setEditingCell] = useState<SelectedCell>(null);

  const cellsMap = useMemo(
    () => (activeTableId ? cellsMapState[activeTableId] ?? {} : {}),
    [activeTableId, cellsMapState]
  );

  const getCellValue = useCallback(
    (rowId: string, colId: string, colType: "text" | "number"): CellValue => {
      if (!activeTableId) return colType === "number" ? null : "";
      const rowMap = cellsMap[rowId];
      if (!rowMap) return colType === "number" ? null : "";
      const value = rowMap[colId];
      return value ?? (colType === "number" ? null : "");
    },
    [activeTableId, cellsMap]
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

  const currentData = useMemo(() => {
    if (!activeTableId) return [];
    const data = tableDataMap[activeTableId];
    if (!data?.length) return [];
    // Return row skeletons only - cell values are read directly from cellsMap in render
    return data.map((row) => ({ id: row.id }));
  }, [activeTableId, tableDataMap]);

  const syncRowsToCellsMap = useCallback(
    (tableId: string, rows: (TableRow | { id: string; [key: string]: string | number | null })[], columns: Column[]) => {
      if (columns.length === 0) return;
      setCellsMapState((prev) => {
        const tableMap = prev[tableId] ?? {};
        const updatedTableMap: { [rowId: string]: { [colId: string]: CellValue } } = { ...tableMap };

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

      setTableDataMap((prev) => ({
        ...prev,
        [activeTableId]: newData.map((row) => ({ id: row.id })),
      }));

      if (externalSetData) {
        externalSetData(newData);
      }

      // Sync strategy:
      // - Small tables: allow full-table sync (syncData) for simplicity
      // - Large tables (disableRowLoad=true): forbid full-table sync, rely on per-cell sync instead
      if (!disableRowLoad && backendSync?.syncData) {
        try {
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
    [activeTableId, externalSetData, backendSync, currentTableColumns, cellsMapState, disableRowLoad]
  );

  const addRow = useCallback(async () => {
    if (!activeTableId) return;

    const newRowId = genRowId();
    const newRow: TableRow = { id: newRowId };
    const newData = [...currentData, newRow];

    const newRowMap: { [colId: string]: CellValue } = {};
    for (const col of currentTableColumns) {
      newRowMap[col.id] = col.type === "number" ? null : "";
    }

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

    if (!disableRowLoad && backendSync?.syncData) {
      try {
        const fullData = newData.map((row) => {
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
      }
    } else if (disableRowLoad && backendSync?.appendRow) {
      try {
        await backendSync.appendRow(activeTableId, newRowId);
      } catch (error) {
        console.error("Failed to append new row to backend (large table mode):", error);
      }
    }
  }, [activeTableId, currentData, currentTableColumns, cellsMapState, backendSync, disableRowLoad]);

  const updateCell = useCallback(
    async (rowId: string, columnId: string, value: string | number | null) => {
      if (!activeTableId) return;

      setCellsMapState((prev) => {
        const tableMap = prev[activeTableId] ?? {};
        const rowMap = tableMap[rowId] ?? {};
        
        if (rowMap[columnId] === value) return prev;
        
        const updatedRowMap = { ...rowMap, [columnId]: value };
        const updatedTableMap = { ...tableMap, [rowId]: updatedRowMap };
        
        return { ...prev, [activeTableId]: updatedTableMap };
      });

      if (backendSync?.syncCell) {
        try {
          await backendSync.syncCell(activeTableId, rowId, columnId, value);
        } catch (error) {
          console.error("Failed to sync cell to backend:", error);
        }
      }
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

      setCellsMapState((prev) => {
        const tableMap = prev[activeTableId] ?? {};
        const updatedTableMap: typeof tableMap = {};
        
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

      if (!disableRowLoad && backendSync?.syncData) {
        try {
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
    [activeTableId, currentTableColumns, currentData, setColumns, cellsMapState, backendSync, disableRowLoad]
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

  const lastLoadedTableIdRef = useRef<string | null>(null);
  const loadDataRef = useRef(backendSync?.loadData);
  const loadColumnsRef = useRef(backendSync?.loadColumns);
  
  useEffect(() => {
    loadDataRef.current = backendSync?.loadData;
    loadColumnsRef.current = backendSync?.loadColumns;
  }, [backendSync?.loadData, backendSync?.loadColumns]);
  
  useEffect(() => {
    if (!activeTableId || !loadDataRef.current || !loadColumnsRef.current) {
      lastLoadedTableIdRef.current = null;
      return;
    }
    
    if (lastLoadedTableIdRef.current === activeTableId) return;

    let cancelled = false;
    void (async () => {
      try {
        let rows: TableRow[] = [];
        const columns = await loadColumnsRef.current!(activeTableId);
        
        if (!disableRowLoad && loadDataRef.current) {
          rows = await loadDataRef.current(activeTableId);
        }

        if (cancelled) return;
        
        lastLoadedTableIdRef.current = activeTableId;
        
        setTableColumnsMap((prev) => ({ ...prev, [activeTableId]: columns }));
        
        if (!disableRowLoad && rows.length > 0) {
          setTableDataMap((prev) => ({ ...prev, [activeTableId]: rows }));
          if (columns.length > 0) {
            syncRowsToCellsMap(activeTableId, rows, columns);
          }
        } else if (disableRowLoad) {
          setTableDataMap((prev) => ({ ...prev, [activeTableId]: [] }));
        }
      } catch (error) {
        if (!cancelled) console.error("Failed to load table data from backend:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTableId, disableRowLoad, syncRowsToCellsMap]);

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
