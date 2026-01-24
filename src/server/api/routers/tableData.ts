/**
 * Table data router: load/sync rows, columns, cells.
 * Used by frontend BackendSync to persist table state.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type ColumnType } from "../../../../generated/prisma";

const tableIdSchema = z
  .string()
  .regex(/^tbl[a-zA-Z0-9]{16}$/, "Table ID must be tbl + 16 alphanumeric");

const columnSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  type: z.enum(["text", "number"]),
});

const tableRowSchema = z.object({
  id: z.string().min(1),
}).catchall(z.union([z.string(), z.number(), z.null()]));

export const tableDataRouter = createTRPCRouter({
  /**
   * Load full table state: columns, rows, cells.
   * Returns { columns, rows } in frontend store format.
   */
  load: protectedProcedure
    .input(z.object({ tableId: tableIdSchema }))
    .query(async ({ ctx, input }) => {
      const owned = await ctx.db.dataTable.findFirst({
        where: {
          id: input.tableId,
          base: { workspace: { ownerId: ctx.session.user.id } },
        },
      });
      if (!owned) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found or you don't have permission",
        });
      }

      const [columns, rows, cells] = await Promise.all([
        ctx.db.tableColumn.findMany({
          where: { tableId: input.tableId },
          orderBy: { order: "asc" },
        }),
        ctx.db.tableRow.findMany({
          where: { tableId: input.tableId },
          orderBy: { order: "asc" },
        }),
        ctx.db.tableCell.findMany({
          where: { tableId: input.tableId },
        }),
      ]);

      const colList = columns.map((c) => ({
        id: c.key,
        name: c.name,
        type: c.type as "text" | "number",
      }));

      // Build maps for column lookup
      const columnIdToKey = new Map(columns.map((c) => [c.id, c.key]));
      const columnKeyToId = new Map(columns.map((c) => [c.key, c.id]));

      // Build cell map: support both columnId (TableColumn.id) and key (TableColumn.key) lookups
      // This handles cases where TableCell.columnId might be stored as either TableColumn.id or TableColumn.key
      const cellByKey = new Map<string, { valueText: string | null; valueNumber: number | null; valueType: string }>();
      for (const c of cells) {
        const cellKey = `${c.rowId}:${c.columnId}`;
        cellByKey.set(cellKey, c);
        
        // If columnId is actually a key (col_xxx), also store by actual id for lookup
        if (columnKeyToId.has(c.columnId)) {
          const actualId = columnKeyToId.get(c.columnId)!;
          if (actualId !== c.columnId) {
            cellByKey.set(`${c.rowId}:${actualId}`, c);
          }
        }
        // If columnId is an id, also store by key for lookup
        if (columnIdToKey.has(c.columnId)) {
          const key = columnIdToKey.get(c.columnId)!;
          if (key !== c.columnId) {
            cellByKey.set(`${c.rowId}:${key}`, c);
          }
        }
      }

      // Check for orphaned cells
      const columnIds = new Set(columns.map((c) => c.id));
      const columnKeys = new Set(columns.map((c) => c.key));
      const orphanedCells = cells.filter((c) => !columnIds.has(c.columnId) && !columnKeys.has(c.columnId));
      if (orphanedCells.length > 0) {
        console.warn("[tableData.load] Found orphaned cells:", {
          count: orphanedCells.length,
          sample: orphanedCells.slice(0, 3).map((c) => ({
            rowId: c.rowId,
            columnId: c.columnId,
          })),
          availableColumnIds: Array.from(columnIds),
          availableColumnKeys: Array.from(columnKeys),
        });
      }

      const rowsOut = rows.map((r) => {
        const row: Record<string, string | number | null> = { id: r.id };
        for (const col of columns) {
          const key = col.key;
          // Try multiple lookup strategies to handle data inconsistencies
          let cell = cellByKey.get(`${r.id}:${col.id}`) || 
                     cellByKey.get(`${r.id}:${col.key}`);
          
          if (cell) {
            row[key] = cell.valueType === "number" ? (cell.valueNumber ?? null) : (cell.valueText ?? "");
          } else {
            row[key] = col.type === "number" ? null : "";
          }
        }
        return row as { id: string; [k: string]: string | number | null };
      });

      // Debug logging (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log("[tableData.load] Debug:", {
          tableId: input.tableId,
          columnsCount: columns.length,
          rowsCount: rows.length,
          cellsCount: cells.length,
          orphanedCellsCount: orphanedCells.length,
          columnMapping: columns.map((c) => ({ id: c.id, key: c.key, name: c.name })),
          cellSample: cells.slice(0, 3).map((c) => ({
            rowId: c.rowId,
            columnId: c.columnId,
            valueText: c.valueText,
            valueNumber: c.valueNumber,
            valueType: c.valueType,
            matched: columnIds.has(c.columnId),
          })),
          rowsOutSample: rowsOut.slice(0, 2),
        });
      }

      return { columns: colList, rows: rowsOut };
    }),

  syncColumns: protectedProcedure
    .input(
      z.object({
        tableId: tableIdSchema,
        columns: z.array(columnSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const owned = await ctx.db.dataTable.findFirst({
        where: {
          id: input.tableId,
          base: { workspace: { ownerId: ctx.session.user.id } },
        },
      });
      if (!owned) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found or you don't have permission",
        });
      }

      for (let i = 0; i < input.columns.length; i++) {
        const c = input.columns[i]!;
        await ctx.db.tableColumn.upsert({
          where: {
            tableId_key: { tableId: input.tableId, key: c.id },
          },
          create: {
            id: c.id,
            tableId: input.tableId,
            key: c.id,
            name: c.name,
            type: c.type as ColumnType,
            order: i,
          },
          update: {
            name: c.name,
            type: c.type as ColumnType,
            order: i,
          },
        });
      }

      return { ok: true };
    }),

  syncData: protectedProcedure
    .input(
      z.object({
        tableId: tableIdSchema,
        data: z.array(tableRowSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const owned = await ctx.db.dataTable.findFirst({
        where: {
          id: input.tableId,
          base: { workspace: { ownerId: ctx.session.user.id } },
        },
      });
      if (!owned) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found or you don't have permission",
        });
      }

      const dbColumns = await ctx.db.tableColumn.findMany({
        where: { tableId: input.tableId },
        orderBy: { order: "asc" },
        select: { id: true, key: true, type: true },
      });

      for (let i = 0; i < input.data.length; i++) {
        const row = input.data[i] as { id: string; [k: string]: string | number | null };
        const order = BigInt((i + 1) * 1000);
        await ctx.db.tableRow.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            tableId: input.tableId,
            order,
          },
          update: { order },
        });
      }

      for (const row of input.data as { id: string; [k: string]: string | number | null }[]) {
        for (const col of dbColumns) {
          const val = row[col.key];
          const valueType = col.type as ColumnType;
          const valueText = valueType === "text" ? (val == null ? "" : String(val)) : null;
          const valueNumber = valueType === "number" ? (typeof val === "number" ? val : val === null || val === "" ? null : Number(val)) : null;

          await ctx.db.tableCell.upsert({
            where: {
              rowId_columnId: { rowId: row.id, columnId: col.id },
            },
            create: {
              tableId: input.tableId,
              rowId: row.id,
              columnId: col.id,
              valueType,
              valueText,
              valueNumber,
            },
            update: {
              valueType,
              valueText,
              valueNumber,
            },
          });
        }
      }

      return { ok: true };
    }),

  syncCell: protectedProcedure
    .input(
      z.object({
        tableId: tableIdSchema,
        rowId: z.string().min(1),
        columnId: z.string().min(1),
        value: z.union([z.string(), z.number(), z.null()]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const owned = await ctx.db.dataTable.findFirst({
        where: {
          id: input.tableId,
          base: { workspace: { ownerId: ctx.session.user.id } },
        },
      });
      if (!owned) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found or you don't have permission",
        });
      }

      const col = await ctx.db.tableColumn.findFirst({
        where: {
          tableId: input.tableId,
          key: input.columnId,
        },
      });
      if (!col) return { ok: true };
      const columnId = col.id;
      const valueType = col.type as ColumnType;
      const valueText = valueType === "text" ? (input.value == null ? "" : String(input.value)) : null;
      const valueNumber = valueType === "number" ? (typeof input.value === "number" ? input.value : input.value === null || input.value === "" ? null : Number(input.value)) : null;

      await ctx.db.tableCell.upsert({
        where: {
          rowId_columnId: { rowId: input.rowId, columnId },
        },
        create: {
          tableId: input.tableId,
          rowId: input.rowId,
          columnId,
          valueType,
          valueText,
          valueNumber,
        },
        update: {
          valueType,
          valueText,
          valueNumber,
        },
      });

      return { ok: true };
    }),
});
