"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { TopBar } from "../../_components/top-bar";
import { LeftSidebar } from "../../_components/left-sidebar";
import { useWorkspaceForm } from "~/hooks/use-workspace-form";
import { useWorkspaceById, useWorkspace } from "~/hooks/use-workspace";
import { isValidWorkspaceId } from "~/utils/workspace-id-validator";

export default function WorkspacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.id as string;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const { update: updateWorkspace, delete: deleteWorkspace } = useWorkspace();

  // Validate workspace ID format
  useEffect(() => {
    if (workspaceId && !isValidWorkspaceId(workspaceId)) {
      // Redirect to workspaces page if ID is invalid
      router.replace("/workspaces");
    }
  }, [workspaceId, router]);

  // Don't render if ID is invalid
  if (workspaceId && !isValidWorkspaceId(workspaceId)) {
    return null;
  }

  // Fetch workspace data if it exists
  const { data: workspace, isLoading: isLoadingWorkspace, isFetching } = useWorkspaceById(workspaceId);

  // Determine if this is a new workspace (no data and not loading)
  // We only treat it as new if we've finished loading and there's no workspace
  const isNewWorkspace = !isLoadingWorkspace && !workspace;
  const workspaceExists = !!workspace;

  // Use workspace name from data, or fallback to default
  // This ensures smooth transitions - we keep showing the name even while fetching
  const displayName = workspace?.name ?? (isLoadingWorkspace ? undefined : "Workspace 2");

  // Update description when workspace loads
  useEffect(() => {
    if (workspace) {
      setDescription(workspace.description ?? "");
    }
  }, [workspace]);

  // Form management hook
  const form = useWorkspaceForm({
    workspaceId,
    initialName: displayName ?? "Workspace 2",
    workspaceExists: workspaceExists, // If workspace exists, don't start in edit mode
    onSuccess: () => {
      console.log("Workspace saved successfully");
    },
    onError: (error) => {
      console.error("Failed to save workspace:", error);
    },
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isMenuOpen]);

  // Auto-focus description input when editing
  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
      descriptionInputRef.current.select();
    }
  }, [isEditingDescription]);

  const handleRenameWorkspace = () => {
    setIsMenuOpen(false);
    form.setIsEditing(true);
  };

  const handleEditDescription = () => {
    setIsMenuOpen(false);
    setIsEditingDescription(true);
  };

  const handleSaveDescription = () => {
    if (!workspace) return;
    
    updateWorkspace.mutate(
      {
        id: workspaceId,
        name: workspace.name,
        description: description.trim(),
      },
      {
        onSuccess: () => {
          setIsEditingDescription(false);
        },
      }
    );
  };

  const handleDeleteWorkspace = () => {
    if (!workspace) return;
    
    if (confirm(`Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`)) {
      deleteWorkspace.mutate(
        { id: workspaceId },
        {
          onSuccess: () => {
            router.push("/workspaces");
          },
        }
      );
    }
    setIsMenuOpen(false);
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Only show full loading screen on initial auth check
  if (status === "loading") {
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

  const userInitial =
    session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase() ?? "W";

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
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              {/* Title and Description Section */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  {/* Editable Workspace Name */}
                  {isLoadingWorkspace ? (
                    // Show placeholder while loading to prevent flickering
                    <h1
                      className="text-2xl font-semibold text-[#011435] rounded px-2 py-1 opacity-50"
                      style={{
                        fontFamily:
                          '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                      }}
                    >
                      {(workspace as { name?: string } | null | undefined)?.name ?? "Workspace 2"}
                    </h1>
                  ) : form.isEditing ? (
                    <input
                      ref={form.inputRef}
                      type="text"
                      value={form.workspaceName}
                      onChange={(e) => form.setWorkspaceName(e.target.value)}
                      onBlur={form.handleBlur}
                      onKeyDown={form.handleKeyDown}
                      disabled={form.isLoading}
                      className="text-2xl font-semibold text-[#011435] border-2 border-[rgb(27,97,201)] rounded px-2 py-1 outline-none disabled:opacity-50"
                      style={{
                        fontFamily:
                          '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                      }}
                    />
                  ) : (
                    <h1
                      className={`text-2xl font-semibold text-[#011435] rounded px-2 py-1 transition-opacity ${
                        isFetching ? "opacity-60" : ""
                      }`}
                      style={{
                        fontFamily:
                          '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                      }}
                    >
                      {form.workspaceName || "Workspace 2"}
                    </h1>
                  )}

                  {/* Last opened dropdown */}
                  <div className="flex items-center gap-1 text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    <span
                      style={{
                        fontFamily:
                          '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                      }}
                    >
                      Last opened
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

                {/* Description Section - Below Title */}
                {workspaceExists && (
                  <div className="ml-2">
                    {isEditingDescription ? (
                      <div className="space-y-2">
                        <textarea
                          ref={descriptionInputRef}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          onBlur={handleSaveDescription}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              handleSaveDescription();
                            }
                            if (e.key === "Escape") {
                              setDescription(workspace?.description ?? "");
                              setIsEditingDescription(false);
                            }
                          }}
                          disabled={updateWorkspace.isLoading}
                          placeholder="Add a description..."
                          className="w-full max-w-2xl px-3 py-2 text-sm text-gray-600 border-2 border-[rgb(27,97,201)] rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(27,97,201)] focus:border-transparent disabled:opacity-50 resize-none"
                          rows={2}
                          style={{
                            fontFamily:
                              '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                          }}
                        />
                        <p className="text-xs text-gray-500">
                          Press Cmd/Ctrl + Enter to save, Esc to cancel
                        </p>
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsEditingDescription(true)}
                        className="text-sm text-gray-600 cursor-text hover:bg-gray-50 rounded px-3 py-1.5 max-w-2xl"
                        style={{
                          fontFamily:
                            '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                        }}
                      >
                        {workspace?.description || (
                          <span className="text-gray-400 italic">Add a description...</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              {/* Top right icons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                  aria-label="Menu"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 4h14M1 8h14M1 12h14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                  aria-label="Grid view"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="2" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="9" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="2" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="9" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>

              {/* Share button */}
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

              {/* Ellipsis button with dropdown menu */}
              {workspaceExists && (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(!isMenuOpen);
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
                  {isMenuOpen && (
                    <div className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameWorkspace();
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
                          handleEditDescription();
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
                          setIsMenuOpen(false);
                          // TODO: Implement workspace settings
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
                          handleDeleteWorkspace();
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
              )}
            </div>
          </div>
        </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
              {/* Empty Workspace Message */}
              <div className="text-center py-16">
                <p
                  className="text-lg font-semibold text-[#011435] mb-2"
                  style={{
                    fontFamily:
                      '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                  }}
                >
                  This workspace is empty
                </p>
                <p
                  className="text-sm text-gray-600 mb-6"
                  style={{
                    fontFamily:
                      '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                  }}
                >
                  Apps in this workspace will appear here.
                </p>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-[rgb(27,97,201)] rounded-md hover:bg-[rgb(13,82,172)] transition-colors"
                  style={{
                    fontFamily:
                      '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                  }}
                >
                  Create
                </button>
              </div>

              {/* Workspace Collaborators Section */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3
                  className="text-sm font-medium text-[#011435] mb-4"
                  style={{
                    fontFamily:
                      '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                  }}
                >
                  Workspace collaborators
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">
                    {userInitial}
                  </div>
                  <div>
                    <p
                      className="text-sm text-[#011435]"
                      style={{
                        fontFamily:
                          '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                      }}
                    >
                      {session?.user?.name || userInitial} You (owner)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
