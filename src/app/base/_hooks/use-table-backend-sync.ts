/**
 * Backend sync hook: implements BackendSync for useTableStore.
 * Loads/saves table rows, columns, and cells via tRPC tableData router.
 * Kept in a separate module for backend connection concerns.
 */

"use client";

import { useCallback, useMemo } from "react";
import { api } from "~/trpc/react";
import type { TableRow, Column } from "../_store/use-table-store";

export type BackendSync = {
  loadData: (tableId: string) => Promise<TableRow[]>;
  loadColumns: (tableId: string) => Promise<Column[]>;
  syncData: (tableId: string, data: TableRow[]) => Promise<void>;
  syncColumns: (tableId: string, columns: Column[]) => Promise<void>;
  syncCell: (tableId: string, rowId: string, columnId: string, value: string | number | null) => Promise<void>;
  prefetchData?: (tableId: string) => void; // Optional: prefetch for hover optimization
};

export function useTableBackendSync(): BackendSync {
  const utils = api.useUtils();
  const syncDataMut = api.tableData.syncData.useMutation();
  const syncColumnsMut = api.tableData.syncColumns.useMutation();
  const syncCellMut = api.tableData.syncCell.useMutation();

  const loadData = useCallback(
    async (tableId: string): Promise<TableRow[]> => {
      const res = await utils.tableData.load.fetch({ tableId });
      return res.rows;
    },
    [utils.tableData.load]
  );

  const loadColumns = useCallback(
    async (tableId: string): Promise<Column[]> => {
      const res = await utils.tableData.load.fetch({ tableId });
      return res.columns;
    },
    [utils.tableData.load]
  );

  const syncData = useCallback(
    async (tableId: string, data: TableRow[]): Promise<void> => {
      await syncDataMut.mutateAsync({ tableId, data });
    },
    [syncDataMut]
  );

  const syncColumns = useCallback(
    async (tableId: string, columns: Column[]): Promise<void> => {
      await syncColumnsMut.mutateAsync({ tableId, columns });
    },
    [syncColumnsMut]
  );

  const syncCell = useCallback(
    async (
      tableId: string,
      rowId: string,
      columnId: string,
      value: string | number | null
    ): Promise<void> => {
      await syncCellMut.mutateAsync({ tableId, rowId, columnId, value });
    },
    [syncCellMut]
  );

  // Prefetch data on hover for instant loading (optional optimization)
  const prefetchData = useCallback(
    (tableId: string) => {
      // Prefetch without awaiting - fire and forget for hover optimization
      void utils.tableData.load.prefetch({ tableId });
    },
    [utils.tableData.load]
  );

  return useMemo(
    () => ({
      loadData,
      loadColumns,
      syncData,
      syncColumns,
      syncCell,
      prefetchData,
    }),
    [loadData, loadColumns, syncData, syncColumns, syncCell, prefetchData]
  );
}
