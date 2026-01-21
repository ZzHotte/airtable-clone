/**
 * This file is the entry point for your tRPC API.
 * It's used to build the `appRouter` type-safe router and export it.
 *
 * Once you add more routers, merge them here using `.merge()`.
 * For example:
 * ```ts
 * export const appRouter = createTRPCRouter({
 *   example: exampleRouter,
 *   post: postRouter,
 * });
 * ```
 */

import { createTRPCRouter } from "~/server/api/trpc";
import { workspaceRouter } from "~/server/api/routers/workspace";
import { baseRouter } from "~/server/api/routers/base";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  workspace: workspaceRouter,
  base: baseRouter,
});

// Export type router type signature, NOT the router itself.
// This is used by the client-side tRPC hooks to infer the types.
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @see https://trpc.io/docs/server/server-side-calls
 */
import { createCallerFactory } from "~/server/api/trpc";
export const createCaller = createCallerFactory(appRouter);
