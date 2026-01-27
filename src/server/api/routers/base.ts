import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const baseIdSchema = z
  .string()
  .regex(/^app[a-zA-Z0-9]{16}$/, "Base ID must start with 'app' followed by 16 alphanumeric characters");

export const baseRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(
      z.object({
        id: baseIdSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const base = await ctx.db.base.findFirst({
        where: {
          id: input.id,
          workspace: {
            ownerId: userId,
          },
        },
        include: {
          workspace: true,
          dataTables: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      return base ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        id: baseIdSchema,
        workspaceId: z.string().length(16).regex(/^[a-zA-Z0-9]{16}$/),
        name: z.string().min(1).optional().default("Untitled Base"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const workspace = await ctx.db.workspace.findFirst({
        where: {
          id: input.workspaceId,
          ownerId: userId,
        },
      });

      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found or you don't have permission",
        });
      }

      const existingBase = await ctx.db.base.findUnique({
        where: { id: input.id },
      });

      if (existingBase) {
        // If it exists and belongs to the user's workspace, return it
        if (existingBase.workspaceId === input.workspaceId) {
          return existingBase;
        } else {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Base already exists in another workspace",
          });
        }
      }

      try {
        const base = await ctx.db.base.create({
          data: {
            id: input.id,
            name: input.name,
            workspaceId: input.workspaceId,
          },
        });

        return base;
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code?: string }).code === "P2002"
          ) {
          const conflictedBase = await ctx.db.base.findUnique({
            where: { id: input.id },
          });

          if (conflictedBase) {
            if (conflictedBase.workspaceId === input.workspaceId) {
              return conflictedBase;
            }

            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Base already exists in another workspace",
            });
          }
        }

        throw error;
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: baseIdSchema,
        name: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existingBase = await ctx.db.base.findFirst({
        where: {
          id: input.id,
          workspace: {
            ownerId: userId,
          },
        },
      });

      if (!existingBase) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Base not found or you don't have permission",
        });
      }

      const base = await ctx.db.base.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
        },
      });

      return base;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: baseIdSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existingBase = await ctx.db.base.findFirst({
        where: {
          id: input.id,
          workspace: {
            ownerId: userId,
          },
        },
      });

      if (!existingBase) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Base not found or you don't have permission",
        });
      }

      await ctx.db.base.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),
});
