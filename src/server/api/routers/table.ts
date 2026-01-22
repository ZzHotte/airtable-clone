import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Table ID validation schema (format: "tbl" + 16 alphanumeric characters)
const tableIdSchema = z
  .string()
  .regex(/^tbl[a-zA-Z0-9]{16}$/, "Table ID must start with 'tbl' followed by 16 alphanumeric characters");

// Base ID validation schema (format: "app" + 16 alphanumeric characters)
const baseIdSchema = z
  .string()
  .regex(/^app[a-zA-Z0-9]{16}$/, "Base ID must start with 'app' followed by 16 alphanumeric characters");

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
