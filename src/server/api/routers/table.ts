import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { faker } from "@faker-js/faker";
import { type ColumnType } from "../../../../generated/prisma";
import { randomBytes } from "crypto";

// Table ID validation schema (format: "tbl" + 16 alphanumeric characters)
const tableIdSchema = z
  .string()
  .regex(/^tbl[a-zA-Z0-9]{16}$/, "Table ID must start with 'tbl' followed by 16 alphanumeric characters");

// Base ID validation schema (format: "app" + 16 alphanumeric characters)
const baseIdSchema = z
  .string()
  .regex(/^app[a-zA-Z0-9]{16}$/, "Base ID must start with 'app' followed by 16 alphanumeric characters");

// Helper functions to generate IDs (similar to client-side generators)
function genColumnId(): string {
  const randomPart = randomBytes(12).toString("base64url").slice(0, 21);
  return `col_${randomPart}`;
}

function genRowId(): string {
  const randomPart = randomBytes(12).toString("base64url").slice(0, 21);
  return `row_${randomPart}`;
}

export const tableRouter = createTRPCRouter({
  /**
   * Get a single table by ID
   * Returns null if table doesn't exist
   */
  getById: protectedProcedure
    .input(
      z.object({
        id: tableIdSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const table = await ctx.db.dataTable.findFirst({
        where: {
          id: input.id,
          base: {
            workspace: {
              ownerId: userId,
            },
          },
        },
        include: {
          base: true,
          columns: {
            orderBy: {
              order: "asc",
            },
          },
          rows: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      return table ?? null;
    }),

  /**
   * Create a new table
   */
  create: protectedProcedure
    .input(
      z.object({
        id: tableIdSchema,
        baseId: baseIdSchema,
        name: z.string().min(1).optional().default("Table 1"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify that the base exists and belongs to the user
      const base = await ctx.db.base.findFirst({
        where: {
          id: input.baseId,
          workspace: {
            ownerId: userId,
          },
        },
      });

      if (!base) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Base not found or you don't have permission",
        });
      }

      // Check if table already exists
      const existingTable = await ctx.db.dataTable.findUnique({
        where: { id: input.id },
      });

      if (existingTable) {
        // If it exists and belongs to the user's base, return it
        if (existingTable.baseId === input.baseId) {
          return existingTable;
        } else {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Table already exists in another base",
          });
        }
      }

      // Create new table
      const table = await ctx.db.dataTable.create({
        data: {
          id: input.id,
          name: input.name,
          baseId: input.baseId,
        },
      });

      // Create default columns with fake data
      const defaultColumns = [
        { id: genColumnId(), name: "Name", type: "text" as ColumnType },
        { id: genColumnId(), name: "Email", type: "text" as ColumnType },
        { id: genColumnId(), name: "Age", type: "number" as ColumnType },
        { id: genColumnId(), name: "City", type: "text" as ColumnType },
        { id: genColumnId(), name: "Salary", type: "number" as ColumnType },
      ];

      // Create columns
      const createdColumns = await Promise.all(
        defaultColumns.map((col, index) =>
          ctx.db.tableColumn.create({
            data: {
              id: col.id,
              tableId: table.id,
              key: col.id, // key should be the same as id (as per syncColumns pattern)
              name: col.name,
              type: col.type,
              order: index,
            },
          })
        )
      );

      // Create default rows (5 rows) with fake data
      const numberOfRows = 5;
      const createdRows = await Promise.all(
        Array.from({ length: numberOfRows }, (_, index) =>
          ctx.db.tableRow.create({
            data: {
              id: genRowId(),
              tableId: table.id,
              order: BigInt((index + 1) * 1000),
            },
          })
        )
      );

      // Create cells with fake data
      const cellsToCreate = [];
      for (const row of createdRows) {
        for (const col of createdColumns) {
          let valueText: string | null = null;
          let valueNumber: number | null = null;

          if (col.type === "text") {
            switch (col.name) {
              case "Name":
                valueText = faker.person.fullName();
                break;
              case "Email":
                valueText = faker.internet.email();
                break;
              case "City":
                valueText = faker.location.city();
                break;
              default:
                valueText = faker.lorem.word();
            }
          } else if (col.type === "number") {
            switch (col.name) {
              case "Age":
                valueNumber = faker.number.int({ min: 18, max: 80 });
                break;
              case "Salary":
                valueNumber = faker.number.int({ min: 30000, max: 150000 });
                break;
              default:
                valueNumber = faker.number.int({ min: 0, max: 1000 });
            }
          }

          cellsToCreate.push(
            ctx.db.tableCell.create({
              data: {
                tableId: table.id,
                rowId: row.id,
                columnId: col.id,
                valueType: col.type,
                valueText,
                valueNumber,
              },
            })
          );
        }
      }

      await Promise.all(cellsToCreate);

      return table;
    }),

  /**
   * Update an existing table
   */
  update: protectedProcedure
    .input(
      z.object({
        id: tableIdSchema,
        name: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify that the table belongs to a base owned by the user
      const existingTable = await ctx.db.dataTable.findFirst({
        where: {
          id: input.id,
          base: {
            workspace: {
              ownerId: userId,
            },
          },
        },
      });

      if (!existingTable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found or you don't have permission",
        });
      }

      const updateData: { name?: string } = {};
      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      const table = await ctx.db.dataTable.update({
        where: {
          id: input.id,
        },
        data: updateData,
      });

      return table;
    }),

  /**
   * Delete a table
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: tableIdSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify that the table belongs to a base owned by the user
      const existingTable = await ctx.db.dataTable.findFirst({
        where: {
          id: input.id,
          base: {
            workspace: {
              ownerId: userId,
            },
          },
        },
      });

      if (!existingTable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found or you don't have permission",
        });
      }

      await ctx.db.dataTable.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),
});
