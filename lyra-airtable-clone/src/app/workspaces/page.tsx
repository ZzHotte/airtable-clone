"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TopBar } from "../_components/top-bar";
import { LeftSidebar } from "../_components/left-sidebar";

export default function WorkspacesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <h1
              className="text-2xl font-semibold text-[#011435]"
              style={{
                fontFamily:
                  '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
              }}
            >
              All Workspaces
            </h1>
          </div>

          {/* Empty State Content */}
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
        </div>
      </div>
    </div>
  );
}

