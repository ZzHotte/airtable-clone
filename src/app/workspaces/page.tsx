"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { TopBar } from "../_components/top-bar";
import { LeftSidebar } from "../_components/left-sidebar";
import { generateWorkspaceId } from "../../utils/id-generator";
import { useWorkspaces, useWorkspace } from "~/hooks/use-workspace";

export default function WorkspacesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useWorkspaces();
  const { delete: deleteWorkspace } = useWorkspace();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleDeleteWorkspace = (workspaceId: string, workspaceName: string) => {
    if (confirm(`Are you sure you want to delete "${workspaceName}"? This action cannot be undone.`)) {
      deleteWorkspace.mutate(
        { id: workspaceId },
        {
          onSuccess: () => {
            setOpenMenuId(null);
            // If we're currently viewing this workspace, redirect to /workspaces
            const currentPath = window.location.pathname;
            if (currentPath === `/workspaces/${workspaceId}`) {
              router.push("/workspaces");
            }
          },
        }
      );
    }
  };

  if (status === "loading" || isLoadingWorkspaces) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const hasWorkspaces = workspaces.length > 0;

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <TopBar />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Content Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h1
              className="text-2xl font-semibold text-[#011435]"
              style={{
                fontFamily:
                  '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
              }}
            >
              All Workspaces
            </h1>
            {hasWorkspaces && (
              <button
                type="button"
                onClick={() => {
                  const newId = generateWorkspaceId();
                  router.push(`/workspaces/${newId}`);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-[rgb(27,97,201)] rounded-md hover:bg-[rgb(13,82,172)] transition-colors"
                style={{
                  fontFamily:
                    '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                }}
              >
                Create a workspace
              </button>
            )}
          </div>

          {hasWorkspaces ? (
            /* Workspaces List View */
            <div className="flex-1 overflow-auto">
              <div className="px-6 py-4">
                {/* Filter/Sort Options */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    <span
                      style={{
                        fontFamily:
                          '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                      }}
                    >
                      Created time
                    </span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
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
                  <div className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    <span
                      style={{
                        fontFamily:
                          '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                      }}
                    >
                      All organizations and plans
                    </span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
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
                </div>

                {/* Workspace Cards */}
                <div className="space-y-3">
                  {workspaces.map((workspace) => (
                    <div
                      key={workspace.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3
                              className="text-lg font-semibold text-[#011435]"
                              style={{
                                fontFamily:
                                  '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                              }}
                            >
                              {workspace.name}
                            </h3>
                            <span
                              className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded"
                              style={{
                                fontFamily:
                                  '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                              }}
                            >
                              FREE PLAN
                            </span>
                            <span className="text-gray-400">·</span>
                            <button
                              type="button"
                              className="text-xs font-medium text-[rgb(27,97,201)] hover:underline"
                              style={{
                                fontFamily:
                                  '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                              }}
                            >
                              UPGRADE
                            </button>
                            <button
                              type="button"
                              className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label="Star workspace"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M8 2l1.8 3.6L14 6.5l-2.8 2.7.7 4L8 11.2l-3.9 2 .7-4L2 6.5l4.2-.9L8 2z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  fill="none"
                                />
                              </svg>
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push(`/workspaces/${workspace.id}`)}
                            className="text-sm text-[rgb(27,97,201)] hover:underline flex items-center gap-1"
                            style={{
                              fontFamily:
                                '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                            }}
                          >
                            View workspace
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
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
                        <div className="flex items-center gap-2 ml-4 relative">
                          <button
                            type="button"
                            className="px-3 py-1.5 text-sm font-medium text-[#011435] border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            style={{
                              fontFamily:
                                '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                            }}
                          >
                            Share
                          </button>
                          <div className="relative" ref={(el) => (menuRefs.current[workspace.id] = el)}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === workspace.id ? null : workspace.id);
                              }}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                              aria-label="More options"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle cx="8" cy="4" r="1" fill="currentColor" />
                                <circle cx="8" cy="8" r="1" fill="currentColor" />
                                <circle cx="8" cy="12" r="1" fill="currentColor" />
                              </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {openMenuId === workspace.id && (
                              <div className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px]">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    // TODO: Implement rename functionality
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-[#011435] hover:bg-gray-50 flex items-center gap-3"
                                  style={{
                                    fontFamily:
                                      '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                                  }}
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M11.5 2.5l2 2M10 4l2-2 2 2M2 5v9h9M2 5h9v9H2V5z"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <span>Rename workspace</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    // TODO: Implement edit description functionality
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-[#011435] hover:bg-gray-50 flex items-center gap-3"
                                  style={{
                                    fontFamily:
                                      '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                                  }}
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                                    <path
                                      d="M8 5v3M8 11h.01"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  <span>Edit description</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    // TODO: Implement workspace settings functionality
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-[#011435] hover:bg-gray-50 flex items-center gap-3"
                                  style={{
                                    fontFamily:
                                      '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                                  }}
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                                    <path
                                      d="M8 2v2M8 12v2M2 8h2M12 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  <span>Workspace settings</span>
                                </button>
                                <div className="border-t border-gray-200 my-1" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteWorkspace(workspace.id, workspace.name);
                                  }}
                                  disabled={deleteWorkspace.isLoading}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    fontFamily:
                                      '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                                  }}
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1m1 0v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8zM6 7v4M10 7v4"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <span>Delete workspace</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State Content */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <p
                  className="text-lg font-medium text-[#011435] mb-2"
                  style={{
                    fontFamily:
                      '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                  }}
                >
                  You don't have any workspaces
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const newId = generateWorkspaceId();
                    router.push(`/workspaces/${newId}`);
                  }}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[rgb(27,97,201)] rounded-md hover:bg-[rgb(13,82,172)] transition-colors"
                  style={{
                    fontFamily:
                      '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                  }}
                >
                  Create a workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

