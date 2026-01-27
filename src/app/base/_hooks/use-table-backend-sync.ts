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
  appendRow: (tableId: string, rowId: string) => Promise<void>;
  prefetchData?: (tableId: string) => void;
};

export function useTableBackendSync(): BackendSync {
  const utils = api.useUtils();
  const syncDataMut = api.tableData.syncData.useMutation();
  const syncColumnsMut = api.tableData.syncColumns.useMutation();
  const syncCellMut = api.tableData.syncCell.useMutation();
  const appendRowMut = api.tableData.appendRow.useMutation();

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

  const appendRow = useCallback(
    async (tableId: string, rowId: string): Promise<void> => {
      await appendRowMut.mutateAsync({ tableId, rowId });
      await utils.tableData.loadInfinite.invalidate({ tableId });
    },
    [appendRowMut, utils.tableData.loadInfinite]
  );

  const prefetchData = useCallback(
    (tableId: string) => {
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
      appendRow,
      prefetchData,
    }),
    [loadData, loadColumns, syncData, syncColumns, syncCell, appendRow, prefetchData]
  );
}
