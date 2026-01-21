import { api } from "~/trpc/react";
import { isValidWorkspaceId } from "~/utils/workspace-id-validator";

/**
 * Custom hook for workspace CRUD operations
 * This hook encapsulates all workspace-related data operations
 */
export function useWorkspace() {
  const utils = api.useUtils();

  const create = api.workspace.create.useMutation({
    onSuccess: () => {
      // Invalidate workspace queries to refetch data
      void utils.workspace.getById.invalidate();
      void utils.workspace.getAll.invalidate();
    },
  });

  const update = api.workspace.update.useMutation({
    onSuccess: () => {
      void utils.workspace.getById.invalidate();
      void utils.workspace.getAll.invalidate();
    },
  });

  const remove = api.workspace.delete.useMutation({
    onSuccess: () => {
      void utils.workspace.getById.invalidate();
      void utils.workspace.getAll.invalidate();
    },
  });

  return {
    create: {
      mutate: create.mutate,
      mutateAsync: create.mutateAsync,
      isLoading: create.isPending,
      isError: create.isError,
      error: create.error,
      isSuccess: create.isSuccess,
    },
    update: {
      mutate: update.mutate,
      mutateAsync: update.mutateAsync,
      isLoading: update.isPending,
      isError: update.isError,
      error: update.error,
      isSuccess: update.isSuccess,
    },
    delete: {
      mutate: remove.mutate,
      mutateAsync: remove.mutateAsync,
      isLoading: remove.isPending,
      isError: remove.isError,
      error: remove.error,
      isSuccess: remove.isSuccess,
    },
  };
}

/**
 * Hook to fetch a single workspace by ID
 * Returns null if workspace doesn't exist (allows creating new workspaces)
 * Only queries if ID is valid format
 * Uses placeholderData to keep previous data during navigation for smooth transitions
 */
export function useWorkspaceById(id: string | undefined) {
  const isValid = id ? isValidWorkspaceId(id) : false;
  const utils = api.useUtils();
  
  return api.workspace.getById.useQuery(
    { id: id ?? "" },
    {
      enabled: isValid, // Only query if ID is valid
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes (formerly cacheTime)
      retry: false, // Don't retry on 404, treat as "workspace doesn't exist"
      // Keep previous data while loading new workspace for smooth transitions
      placeholderData: (previousData) => {
        // If we have previous data, keep it (React Query will handle the transition)
        if (previousData) {
          return previousData;
        }
        // Try to get cached data for this workspace from query cache
        const cached = utils.workspace.getById.getData({ id: id ?? "" });
        return cached ?? undefined;
      },
      // Use structural sharing to prevent unnecessary re-renders
      structuralSharing: true,
    }
  );
}

/**
 * Hook to fetch all workspaces for the current user
 */
export function useWorkspaces() {
  return api.workspace.getAll.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
