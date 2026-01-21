import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { WORKSPACE_ID_PATTERN, WORKSPACE_ID_ERROR_MESSAGE } from "~/utils/workspace-id-validator";

// Workspace ID validation schema
const workspaceIdSchema = z
  .string()
  .length(16, WORKSPACE_ID_ERROR_MESSAGE)
  .regex(WORKSPACE_ID_PATTERN, WORKSPACE_ID_ERROR_MESSAGE);

export const workspaceRouter = createTRPCRouter({
  /**
   * Get all workspaces for the current user
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const workspaces = await ctx.db.workspace.findMany({
      where: {
        ownerId: userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return workspaces;
  }),

  /**
   * Get a single workspace by ID
   * Returns null if workspace doesn't exist (instead of throwing error)
   * This allows the UI to distinguish between "loading" and "not found"
   */
  getById: protectedProcedure
    .input(
      z.object({
        id: workspaceIdSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const workspace = await ctx.db.workspace.findFirst({
        where: {
          id: input.id,
          ownerId: userId,
        },
        include: {
          bases: {
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
      });

      // Return null if not found instead of throwing error
      // This allows the UI to handle "new workspace" vs "existing workspace" cases
      return workspace ?? null;
    }),

  /**
   * Create a new workspace or update if it already exists
   */
  create: protectedProcedure
    .input(
      z.object({
        id: workspaceIdSchema,
        name: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if workspace already exists
      const existingWorkspace = await ctx.db.workspace.findUnique({
        where: { id: input.id },
      });

      if (existingWorkspace) {
        // If it exists and belongs to the user, update it
        if (existingWorkspace.ownerId === userId) {
          return await ctx.db.workspace.update({
            where: { id: input.id },
            data: { name: input.name },
          });
        } else {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Workspace already exists and belongs to another user",
          });
        }
      }

      // Create new workspace
      const workspace = await ctx.db.workspace.create({
        data: {
          id: input.id,
          name: input.name,
          ownerId: userId,
        },
      });

      return workspace;
    }),

  /**
   * Update an existing workspace
   */
  update: protectedProcedure
    .input(
      z.object({
        id: workspaceIdSchema,
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify that the workspace belongs to the user
      const existingWorkspace = await ctx.db.workspace.findFirst({
        where: {
          id: input.id,
          ownerId: userId,
        },
      });

      if (!existingWorkspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found or you don't have permission",
        });
      }

      const workspace = await ctx.db.workspace.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          description: input.description ?? null,
        },
      });

      return workspace;
    }),

  /**
   * Delete a workspace
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: workspaceIdSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify that the workspace belongs to the user
      const existingWorkspace = await ctx.db.workspace.findFirst({
        where: {
          id: input.id,
          ownerId: userId,
        },
      });

      if (!existingWorkspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found or you don't have permission",
        });
      }

      await ctx.db.workspace.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),
});
