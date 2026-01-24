/**
 * Table state management store
 * Centralized state management with backend sync interface
 */

import { useState, useMemo, useCallback } from "react";
import { genColumnId, genRowId } from "../_utils/id-generator";

export type TableRow = {
  id: string;
  [key: string]: string | number | null;
};

export type Column = {
  id: string;
  name: string;
  type: "text" | "number";
};

export type CellValue = string | number | null;

export type CellsMap = {
  [tableId: string]: {
    [cellKey: string]: CellValue;
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
};

type UseTableStoreProps = {
  activeTableId: string | null;
  externalSetData?: (data: TableRow[]) => void;
  backendSync?: BackendSync;
};

export function useTableStore({ 
  activeTableId, 
  externalSetData,
  backendSync 
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
    const map = cellsMapState[activeTableId] ?? {};
    const columns = currentTableColumns;
    return data.map((row) => {
      const next: TableRow = { id: row.id };
      for (const col of columns) {
        const cellKey = `${row.id}:${col.id}`;
        next[col.id] = map[cellKey] ?? (col.type === "number" ? null : "");
      }
      return next;
    });
  }, [activeTableId, tableDataMap, cellsMapState, currentTableColumns]);

  // Helper: Sync TableRow[] data to cellsMap for a specific table
  const syncRowsToCellsMap = useCallback(
    (tableId: string, rows: TableRow[], columns: Column[]) => {
      setCellsMapState((prev) => {
        const tableMap = prev[tableId] ?? {};
        const updatedTableMap = { ...tableMap };

        // For each row and each column, write cell value to cellsMap
        for (const row of rows) {
          if (!row.id) continue;
          for (const col of columns) {
            const cellKey = `${row.id}:${col.id}`;
            const cellValue = row[col.id] ?? (col.type === "number" ? null : "");
            updatedTableMap[cellKey] = cellValue;
          }
        }

        console.log("[SYNC] syncRowsToCellsMap:", {
          tableId,
          rowCount: rows.length,
          columnCount: columns.length,
          cellsMapSize: Object.keys(updatedTableMap).length,
        });
        console.log("[cellsMap] updatedTableMap:", updatedTableMap);

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
        [activeTableId]: newData,
      }));

      // ========== SYNC: Sync rows data to cellsMap ==========
      syncRowsToCellsMap(activeTableId, newData, currentTableColumns);

      if (externalSetData) {
        externalSetData(newData);
      }

      if (backendSync?.syncData) {
        try {
          await backendSync.syncData(activeTableId, newData);
        } catch (error) {
          console.error("Failed to sync data to backend:", error);
        }
      }
    },
    [activeTableId, externalSetData, backendSync, currentTableColumns, syncRowsToCellsMap]
  );

  const addRow = useCallback(async () => {
    if (!activeTableId) return;

    const newRow: TableRow = {
      id: genRowId(),
    };
    const newData = [...currentData, newRow];

    // ========== SINGLE WRITE: setData will sync to cellsMap via syncRowsToCellsMap ==========
    // Note: newRow only has { id }, syncRowsToCellsMap will fill default values for all columns
    await setData(newData);
  }, [activeTableId, currentData, setData]);

  const updateCell = useCallback(
    async (rowId: string, columnId: string, value: string | number | null) => {
      if (!activeTableId) return;

      // ========== SINGLE WRITE: Update cellsMap (new data structure) ==========
      // Note: tableDataMap is no longer updated here. currentData derives row[col.id] from cellsMap.
      const cellKey = `${rowId}:${columnId}`;
      setCellsMapState((prev) => {
        const tableMap = prev[activeTableId] ?? {};
        const updatedTableMap = { ...tableMap, [cellKey]: value };
        const next = { ...prev, [activeTableId]: updatedTableMap };
        console.log("[SINGLE WRITE] updateCell:", {
          tableId: activeTableId,
          rowId,
          columnId,
          cellKey,
          value,
          cellsMapSize: Object.keys(updatedTableMap).length,
        });
        console.log("[cellsMap] updatedTableMap:", updatedTableMap);
        return next;
      });
    },
    [activeTableId]
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

      const updatedData = currentData.map((row) => ({
        ...row,
        [newColumnId]: defaultValue,
      }));

      // ========== SINGLE WRITE: Sync to cellsMap with newColumns (includes the new column) ==========
      // Note: We use newColumns instead of currentTableColumns because currentTableColumns
      // may not have updated yet (React state update is async). updatedData already contains [newColumnId]: defaultValue.
      syncRowsToCellsMap(activeTableId, updatedData, newColumns);

      await setData(updatedData);
    },
    [activeTableId, currentTableColumns, currentData, setColumns, setData, syncRowsToCellsMap]
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

  return {
    currentData,
    currentTableColumns,
    cellsMap,
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
