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
  const [cellsMap, setCellsMap] = useState<Record<string, CellValue>>({});
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const [editingCell, setEditingCell] = useState<SelectedCell>(null);

  const currentData = useMemo(() => {
    if (activeTableId) {
      const data = tableDataMap[activeTableId];
      if (data && data.length > 0) {
        return data;
      }
      return [];
    }
    return [];
  }, [activeTableId, tableDataMap]);

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

  const setData = useCallback(
    async (newData: TableRow[]) => {
      if (!activeTableId) return;

      setTableDataMap((prev) => ({
        ...prev,
        [activeTableId]: newData,
      }));

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
    [activeTableId, externalSetData, backendSync]
  );

  const addRow = useCallback(async () => {
    if (!activeTableId) return;

    const newRow: TableRow = {
      id: genRowId(),
    };
    const newData = [...currentData, newRow];
    await setData(newData);
  }, [activeTableId, currentData, setData]);

  const updateCell = useCallback(
    async (rowId: string, columnId: string, value: string | number | null) => {
      if (!activeTableId) return;

      // ========== DUAL WRITE: Update cellsMap (new data structure) ==========
      // Note: The existing data structure (tableDataMap) is updated via onSetData in table-columns.tsx
      // This function only handles the cellsMap update for the new data structure
      const cellKey = `${rowId}:${columnId}`;
      setCellsMap((prev) => {
        const updated = {
          ...prev,
          [cellKey]: value,
        };
        console.log("[DUAL WRITE] updateCell:", {
          tableId: activeTableId,
          rowId,
          columnId,
          cellKey,
          value,
          cellsMapSize: Object.keys(updated).length,
        });
        return updated;
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
      await setData(updatedData);
    },
    [activeTableId, currentTableColumns, currentData, setColumns, setData]
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
