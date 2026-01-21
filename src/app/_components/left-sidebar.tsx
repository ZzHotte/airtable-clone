"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { generateWorkspaceId } from "../../utils/id-generator";
import { useWorkspaces } from "~/hooks/use-workspace";
import { isValidWorkspaceId } from "~/utils/workspace-id-validator";
import { api } from "~/trpc/react";

export function LeftSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isWorkspacesExpanded, setIsWorkspacesExpanded] = useState(true);
  const [isStarredExpanded, setIsStarredExpanded] = useState(false);
  const [temporaryWorkspaces, setTemporaryWorkspaces] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const { data: workspaces = [], isLoading } = useWorkspaces();
  const utils = api.useUtils();

  // Prefetch workspace data on hover for smooth transitions
  const handleWorkspaceHover = (workspaceId: string) => {
    if (isValidWorkspaceId(workspaceId)) {
      void utils.workspace.getById.prefetch({ id: workspaceId });
    }
  };

  const isHome = pathname === "/dashboard";
  const isWorkspaces = pathname === "/workspaces";
  
  // Extract workspace ID from pathname (e.g., /workspaces/abc123...)
  const currentWorkspaceId = pathname?.startsWith("/workspaces/")
    ? pathname.split("/workspaces/")[1]?.split("?")[0]
    : null;

  // Check if current workspace ID is valid
  const isValidCurrentWorkspace = currentWorkspaceId
    ? isValidWorkspaceId(currentWorkspaceId)
    : false;

  // Create stable references for workspace IDs
  const workspaceIds = useMemo(() => new Set(workspaces.map((w) => w.id)), [workspaces]);
  const workspaceNameMap = useMemo(
    () => new Map(workspaces.map((w) => [w.id, w.name])),
    [workspaces]
  );

  // Track if we've already added the current workspace as temporary
  const addedWorkspaceRef = useRef<Set<string>>(new Set());

  // Listen for workspace creation to add temporary workspace
  useEffect(() => {
    if (isValidCurrentWorkspace && currentWorkspaceId) {
      // Check if this workspace is already in the list
      const existsInWorkspaces = workspaceIds.has(currentWorkspaceId);
      const alreadyAdded = addedWorkspaceRef.current.has(currentWorkspaceId);

      if (!existsInWorkspaces && !alreadyAdded) {
        // Mark as added
        addedWorkspaceRef.current.add(currentWorkspaceId);
        // Add as temporary workspace
        setTemporaryWorkspaces((prev) => {
          // Double check to avoid duplicates
          if (prev.some((w) => w.id === currentWorkspaceId)) {
            return prev;
          }
          return [
            ...prev,
            { id: currentWorkspaceId, name: "Workspace 2" }, // Default name
          ];
        });
      }
    }
  }, [currentWorkspaceId, isValidCurrentWorkspace, workspaceIds]);

  // Update temporary workspace name when workspace is saved, or remove if it's in the list
  useEffect(() => {
    setTemporaryWorkspaces((prev) => {
      let hasChanges = false;
      const updated = prev
        .map((temp) => {
          // If workspace is now in the list, update its name
          const savedName = workspaceNameMap.get(temp.id);
          if (savedName && savedName !== temp.name) {
            hasChanges = true;
            return { ...temp, name: savedName };
          }
          return temp;
        })
        .filter((temp) => {
          // Remove temporary workspaces that are now saved (unless we're currently viewing them)
          const isSaved = workspaceIds.has(temp.id);
          const isCurrent = temp.id === currentWorkspaceId;
          // Keep if not saved, or if it's the current workspace (for smooth transition)
          const shouldKeep = !isSaved || isCurrent;
          if (!shouldKeep) {
            hasChanges = true;
            // Remove from ref tracking
            addedWorkspaceRef.current.delete(temp.id);
          }
          return shouldKeep;
        });

      // Only update if there are actual changes
      return hasChanges ? updated : prev;
    });
  }, [workspaceIds, workspaceNameMap, currentWorkspaceId]);

  // Listen for workspace name updates via custom event (from workspace page)
  useEffect(() => {
    const handleWorkspaceNameUpdate = (event: CustomEvent<{ id: string; name: string }>) => {
      setTemporaryWorkspaces((prev) =>
        prev.map((w) => (w.id === event.detail.id ? { ...w, name: event.detail.name } : w))
      );
    };

    window.addEventListener(
      "workspace-name-updated",
      handleWorkspaceNameUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "workspace-name-updated",
        handleWorkspaceNameUpdate as EventListener
      );
    };
  }, []);

  // Combine workspaces and temporary workspaces
  type WorkspaceItem =
    | (typeof workspaces)[number] & { isTemporary: false }
    | { id: string; name: string; isTemporary: true; createdAt: Date };

  const allWorkspaces: WorkspaceItem[] = [
    ...workspaces.map((w) => ({ ...w, isTemporary: false as const })),
    ...temporaryWorkspaces
      .filter((temp) => !workspaces.some((w) => w.id === temp.id))
      .map((w) => ({ ...w, isTemporary: true as const, createdAt: new Date() })),
  ].sort((a, b) => {
    // Sort by updatedAt or createdAt, most recent first
    const dateA = a.isTemporary
      ? a.createdAt
      : a.updatedAt
        ? new Date(a.updatedAt)
        : a.createdAt
          ? new Date(a.createdAt)
          : new Date(0);
    const dateB = b.isTemporary
      ? b.createdAt
      : b.updatedAt
        ? new Date(b.updatedAt)
        : b.createdAt
          ? new Date(b.createdAt)
          : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const handleCreateWorkspace = () => {
    const newId = generateWorkspaceId();
    router.push(`/workspaces/${newId}`);
  };

  return (
    <div className="w-64 h-full bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Main Navigation */}
      <div className="flex-1 py-2">
        {/* Home */}
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className={`px-3 py-1.5 mx-2 my-1 rounded-md flex items-center gap-2 cursor-pointer text-left w-[calc(100%-16px)] ${
            isHome ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 1l6 5v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6l6-5z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path d="M6 14V9h4v5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
          <span
            className="text-sm font-medium text-[#011435]"
            style={{
              fontFamily:
                '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            }}
          >
            Home
          </span>
        </button>

        {/* Starred - Collapsible */}
        <div>
          <div
            onClick={() => setIsStarredExpanded(!isStarredExpanded)}
            className="px-3 py-1.5 mx-2 my-1 flex items-center justify-between cursor-pointer hover:bg-gray-100 rounded-md transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 1l2 4 4.5.5-3.5 3.5 1 4.5L8 11.5 4 13.5l1-4.5L1.5 5.5 6 5l2-4z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
              <span
                className="text-sm text-[#011435]"
                style={{
                  fontFamily:
                    '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                }}
              >
                Starred
              </span>
            </div>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform ${isStarredExpanded ? "rotate-180" : ""}`}
            >
              <path
                d="M3 4.5l3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {/* Starred empty state - only show when expanded */}
          {isStarredExpanded && (
            <div className="mx-2 mt-1 mb-2 px-3 py-4 bg-gray-100 rounded-md border border-gray-200">
              <p className="text-xs text-gray-500 leading-relaxed">
                Your starred bases, interfaces, and workspaces will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Shared */}
        <div className="px-3 py-1.5 mx-2 my-1 flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-md transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM3 8a5 5 0 0 1 5-5m0 10a5 5 0 0 1-5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span
            className="text-sm text-[#011435]"
            style={{
              fontFamily:
                '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            }}
          >
            Shared
          </span>
        </div>

        {/* Workspaces */}
        <div>
          <div
            className={`px-3 py-1.5 mx-2 my-1 flex items-center justify-between rounded-md transition-colors text-left w-[calc(100%-16px)] ${
              isWorkspaces || isValidCurrentWorkspace
                ? "bg-gray-200"
                : ""
            }`}
          >
            <div 
              onClick={() => {
                router.push("/workspaces");
              }}
              className="flex items-center gap-2 flex-1 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -mx-1 -my-0.5"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.5 6.5c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5S3.2 5 4 5s1.5.7 1.5 1.5zM11.5 6.5c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5S9.2 5 10 5s1.5.7 1.5 1.5z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  fill="none"
                />
                <path
                  d="M2 10.5c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5M8 10.5c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              <span
                className="text-sm text-[#011435]"
                style={{
                  fontFamily:
                    '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                }}
              >
                Workspaces
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateWorkspace();
                }}
                className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded"
                aria-label="Add workspace"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 2v8M2 6h8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsWorkspacesExpanded(!isWorkspacesExpanded);
                }}
                className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded"
                aria-label={isWorkspacesExpanded ? "Collapse" : "Expand"}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform ${isWorkspacesExpanded ? "rotate-90" : ""}`}
                >
                  <path
                    d="M4.5 2l3 4-3 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Workspaces List */}
          {isWorkspacesExpanded && (
            <div className="mx-2 mt-1 mb-2">
              {isLoading ? (
                <div className="px-3 py-2 text-xs text-gray-500">Loading...</div>
              ) : allWorkspaces.length > 0 ? (
                allWorkspaces.map((workspace) => {
                  const isActive = workspace.id === currentWorkspaceId;
                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      onMouseEnter={() => handleWorkspaceHover(workspace.id)}
                      onClick={() => router.push(`/workspaces/${workspace.id}`)}
                      className={`w-full px-3 py-1.5 flex items-center gap-2 rounded-md transition-colors text-left ${
                        isActive
                          ? "bg-gray-200"
                          : "hover:bg-gray-100"
                      } ${workspace.isTemporary ? "opacity-75" : ""}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5.5 6.5c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5S3.2 5 4 5s1.5.7 1.5 1.5zM11.5 6.5c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5S9.2 5 10 5s1.5.7 1.5 1.5z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          fill="none"
                        />
                        <path
                          d="M2 10.5c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5M8 10.5c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span
                        className={`text-sm flex-1 truncate ${
                          isActive ? "font-medium text-[#011435]" : "text-[#011435]"
                        }`}
                        style={{
                          fontFamily:
                            '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                        }}
                      >
                        {workspace.name}
                      </span>
                    </button>
                  );
                })
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 mx-2"></div>

      {/* Bottom Actions */}
      <div className="py-2">
        {/* Templates and apps */}
        <div className="px-3 py-1.5 mx-2 my-1 flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-md transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 2h8v12H4V2zM2 4h12M6 7h4M6 10h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span
            className="text-sm text-[#011435]"
            style={{
              fontFamily:
                '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            }}
          >
            Templates and apps
          </span>
        </div>

        {/* Marketplace */}
        <div className="px-3 py-1.5 mx-2 my-1 flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-md transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 4h8l-1 6H5l-1-6zM4 4L2 2M12 4l2-2M6 10h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="text-sm text-[#011435]"
            style={{
              fontFamily:
                '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            }}
          >
            Marketplace
          </span>
        </div>

        {/* Import */}
        <div className="px-3 py-1.5 mx-2 my-1 flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-md transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 2v12M4 6l4-4 4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="text-sm text-[#011435]"
            style={{
              fontFamily:
                '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            }}
          >
            Import
          </span>
        </div>

        {/* + Create Button */}
        <button
          type="button"
          onClick={handleCreateWorkspace}
          className="w-full mx-2 mt-2 px-3 py-2 bg-[rgb(27,97,201)] text-white text-sm font-medium rounded-md hover:bg-[rgb(13,82,172)] transition-colors"
          style={{
            fontFamily:
              '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          }}
        >
          + Create
        </button>
      </div>
    </div>
  );
}
