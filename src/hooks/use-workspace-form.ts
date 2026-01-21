import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useWorkspace } from "./use-workspace";

interface UseWorkspaceFormOptions {
  workspaceId: string;
  initialName?: string;
  workspaceExists?: boolean; // Whether the workspace already exists in the database
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for managing workspace form state and interactions
 * Handles editing, saving, and form validation
 */
export function useWorkspaceForm({
  workspaceId,
  initialName = "Workspace 2",
  workspaceExists = false, // Default to false (new workspace, should be editable)
  onSuccess,
  onError,
}: UseWorkspaceFormOptions) {
  // Use refs to track previous values and detect changes
  const prevWorkspaceIdRef = useRef<string>(workspaceId);
  const prevInitialNameRef = useRef<string>(initialName);
  const prevWorkspaceExistsRef = useRef<boolean>(workspaceExists);
  
  const [workspaceName, setWorkspaceName] = useState(initialName);
  // If workspace exists, start in non-editing mode; otherwise, start in editing mode
  const [isEditing, setIsEditing] = useState(!workspaceExists);
  const [isCreated, setIsCreated] = useState(workspaceExists);
  const inputRef = useRef<HTMLInputElement>(null);

  const { create } = useWorkspace();

  // Update form when workspace ID changes or initial data changes
  useEffect(() => {
    const workspaceIdChanged = prevWorkspaceIdRef.current !== workspaceId;
    const initialNameChanged = prevInitialNameRef.current !== initialName;
    const workspaceExistsChanged = prevWorkspaceExistsRef.current !== workspaceExists;

    // If workspace ID changed, reset form state for new workspace
    if (workspaceIdChanged) {
      setWorkspaceName(initialName);
      // Only set editing mode if workspace doesn't exist (new workspace)
      // If workspace exists, we should never start in edit mode
      setIsEditing(!workspaceExists);
      setIsCreated(workspaceExists);
      prevWorkspaceIdRef.current = workspaceId;
      prevInitialNameRef.current = initialName;
      prevWorkspaceExistsRef.current = workspaceExists;
      return;
    }

    // Update name when it changes from server (but not if user is currently editing)
    if (initialNameChanged && !isEditing) {
      setWorkspaceName(initialName);
      prevInitialNameRef.current = initialName;
    }

    // Update editing state when workspace existence changes
    // This is important: if workspace exists, we should never be in edit mode
    if (workspaceExistsChanged) {
      if (workspaceExists) {
        // Workspace exists, ensure we're not in edit mode
        setIsEditing(false);
        setIsCreated(true);
      } else if (!workspaceExists && prevWorkspaceExistsRef.current) {
        // Workspace was deleted or doesn't exist, allow editing for new workspace
        setIsEditing(true);
        setIsCreated(false);
      }
      prevWorkspaceExistsRef.current = workspaceExists;
    }
  }, [workspaceId, initialName, workspaceExists, isEditing]);

  // Auto-focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle saving workspace
  const handleSave = useCallback(() => {
    if (!workspaceName.trim() || !workspaceId) {
      return;
    }

    create.mutate(
      {
        id: workspaceId,
        name: workspaceName.trim(),
      },
      {
        onSuccess: () => {
          setIsCreated(true);
          setIsEditing(false);
          
          // Dispatch custom event to update sidebar
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("workspace-name-updated", {
                detail: { id: workspaceId, name: workspaceName.trim() },
              })
            );
          }
          
          onSuccess?.();
        },
        onError: (error) => {
          console.error("Failed to save workspace:", error);
          // Convert TRPCClientError to Error for onError callback
          const errorObj = error instanceof Error ? error : new Error(error.message ?? "Unknown error");
          onError?.(errorObj);
        },
      }
    );
  }, [workspaceName, workspaceId, create, onSuccess, onError]);

  // Handle input blur (save on blur)
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    handleSave();
  }, [handleSave]);

  // Handle input click (start editing)
  const handleInputClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        inputRef.current?.blur();
      }
      if (e.key === "Escape") {
        setWorkspaceName(initialName);
        inputRef.current?.blur();
      }
    },
    [initialName]
  );

  return {
    // State
    workspaceName,
    isEditing,
    isCreated,
    isLoading: create.isLoading,
    isError: create.isError,
    error: create.error,

    // Refs
    inputRef,

    // Actions
    setWorkspaceName,
    setIsEditing,
    handleBlur,
    handleInputClick,
    handleKeyDown,
    handleSave,
  };
}
