"use client";

import { usePathname, useRouter } from "next/navigation";

export function LeftSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const isHome = pathname === "/dashboard";
  const isWorkspaces = pathname === "/workspaces";

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
          <div className="px-3 py-1.5 mx-2 my-1 flex items-center justify-between cursor-pointer hover:bg-gray-100 rounded-md transition-colors">
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
          {/* Starred empty state */}
          <div className="mx-2 mt-1 mb-2 px-3 py-4 bg-gray-100 rounded-md border border-gray-200">
            <p className="text-xs text-gray-500 leading-relaxed">
              Your starred bases, interfaces, and workspaces will appear here.
            </p>
          </div>
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
        <div
          onClick={() => router.push("/workspaces")}
          className={`px-3 py-1.5 mx-2 my-1 flex items-center justify-between cursor-pointer rounded-md transition-colors text-left w-[calc(100%-16px)] ${
            isWorkspaces ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="5" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" />
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
                // Add workspace functionality will be implemented later
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
          </div>
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
