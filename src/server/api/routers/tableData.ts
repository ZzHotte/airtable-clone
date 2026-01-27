/**
 * Table data router: load/sync rows, columns, cells.
 * Used by frontend BackendSync to persist table state.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type ColumnType } from "../../../../generated/prisma";
import { randomBytes } from "crypto";
import { faker } from "@faker-js/faker";

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

// Helper function to generate row IDs (server-side)
function genRowId(): string {
  const randomPart = randomBytes(12).toString("base64url").slice(0, 21);
  return `row_${randomPart}`;
}

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

  /**
   * Append a single row at the end of the table.
   * Used by "large table" mode to avoid full-table syncs.
   */
  appendRow: protectedProcedure
    .input(
      z.object({
        tableId: tableIdSchema,
        rowId: z.string().min(1),
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

      // Find current max order to append after it
      const maxOrderRow = await ctx.db.tableRow.findFirst({
        where: { tableId: input.tableId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const nextOrder = maxOrderRow ? maxOrderRow.order + BigInt(1000) : BigInt(1000);

      await ctx.db.tableRow.create({
        data: {
          id: input.rowId,
          tableId: input.tableId,
          order: nextOrder,
        },
      });

      return { ok: true };
    }),

  /**
   * Add 100k rows to a table (bulk insert)
   */
  addBulkRows: protectedProcedure
    .input(
      z.object({
        tableId: tableIdSchema,
        count: z.number().int().min(1).max(1000000).default(100000),
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

      if (dbColumns.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Table has no columns",
        });
      }

      // Get the current max order to continue from there
      const maxOrderRow = await ctx.db.tableRow.findFirst({
        where: { tableId: input.tableId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const startOrder = maxOrderRow ? Number(maxOrderRow.order) + 1000 : 1000;

      // Batch insert rows (1000 at a time for performance)
      const batchSize = 1000;
      const totalBatches = Math.ceil(input.count / batchSize);

      for (let batch = 0; batch < totalBatches; batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, input.count);
        const batchCount = batchEnd - batchStart;

        // Generate rows for this batch
        const rows = Array.from({ length: batchCount }, (_, i) => {
          const order = BigInt(startOrder + (batchStart + i) * 1000);
          return {
            id: genRowId(),
            tableId: input.tableId,
            order,
          };
        });

        // Insert rows
        await ctx.db.tableRow.createMany({
          data: rows,
        });

        // Insert cells for all rows in this batch, using faker to generate fake values
        const cellInserts = [];
        for (const row of rows) {
          for (const col of dbColumns) {
            const valueType = col.type as ColumnType;

            let valueText: string | null = null;
            let valueNumber: number | null = null;

            if (valueType === "text") {
              const key = col.key.toLowerCase();

              if (key.includes("name")) {
                valueText = faker.person.fullName();
              } else if (key.includes("email")) {
                valueText = faker.internet.email();
              } else if (key.includes("city")) {
                valueText = faker.location.city();
              } else if (key.includes("country")) {
                valueText = faker.location.country();
              } else if (key.includes("company")) {
                valueText = faker.company.name();
              } else {
                // Fallback: short lorem text
                valueText = faker.lorem.words({ min: 1, max: 4 });
              }
            } else if (valueType === "number") {
              // Reasonable numeric range for demo/testing
              valueNumber = faker.number.int({ min: 0, max: 10000 });
            }

            cellInserts.push({
              tableId: input.tableId,
              rowId: row.id,
              columnId: col.id,
              valueType,
              valueText,
              valueNumber,
            });
          }
        }

        // Insert cells in batches of 5000
        const cellBatchSize = 5000;
        for (let i = 0; i < cellInserts.length; i += cellBatchSize) {
          await ctx.db.tableCell.createMany({
            data: cellInserts.slice(i, i + cellBatchSize),
          });
        }
      }

      return { ok: true, rowsAdded: input.count };
    }),

  /**
   * Infinite query for paginated row loading
   */
  loadInfinite: protectedProcedure
    .input(
      z.object({
        tableId: tableIdSchema,
        limit: z.number().int().min(1).max(1000).default(100),
        cursor: z.number().int().min(0).optional(),
      })
    )
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

      const [columns, totalCount] = await Promise.all([
        ctx.db.tableColumn.findMany({
          where: { tableId: input.tableId },
          orderBy: { order: "asc" },
        }),
        ctx.db.tableRow.count({
          where: { tableId: input.tableId },
        }),
      ]);

      const colList = columns.map((c) => ({
        id: c.key,
        name: c.name,
        type: c.type as "text" | "number",
      }));

      const offset = input.cursor ?? 0;
      const rows = await ctx.db.tableRow.findMany({
        where: { tableId: input.tableId },
        orderBy: { order: "asc" },
        skip: offset,
        take: input.limit + 1, // Fetch one extra to determine if there's more
      });

      const hasMore = rows.length > input.limit;
      const actualRows = hasMore ? rows.slice(0, input.limit) : rows;

      // Fetch cells for these rows
      const rowIds = actualRows.map((r) => r.id);
      const cells = await ctx.db.tableCell.findMany({
        where: {
          tableId: input.tableId,
          rowId: { in: rowIds },
        },
      });

      // Build maps for column lookup
      const columnIdToKey = new Map(columns.map((c) => [c.id, c.key]));
      const columnKeyToId = new Map(columns.map((c) => [c.key, c.id]));

      // Build cell map
      const cellByKey = new Map<string, { valueText: string | null; valueNumber: number | null; valueType: string }>();
      for (const c of cells) {
        const cellKey = `${c.rowId}:${c.columnId}`;
        cellByKey.set(cellKey, c);
        
        if (columnKeyToId.has(c.columnId)) {
          const actualId = columnKeyToId.get(c.columnId)!;
          if (actualId !== c.columnId) {
            cellByKey.set(`${c.rowId}:${actualId}`, c);
          }
        }
        if (columnIdToKey.has(c.columnId)) {
          const key = columnIdToKey.get(c.columnId)!;
          if (key !== c.columnId) {
            cellByKey.set(`${c.rowId}:${key}`, c);
          }
        }
      }

      const rowsOut = actualRows.map((r) => {
        const row: Record<string, string | number | null> = { id: r.id };
        for (const col of columns) {
          const key = col.key;
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

      return {
        columns: colList,
        rows: rowsOut,
        totalCount,
        nextCursor: hasMore ? offset + input.limit : undefined,
      };
    }),
});
