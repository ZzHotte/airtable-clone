"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LeftBar } from "../../left-bar";
import { BaseTopBar } from "../../top-bar";
import { TableSpaces } from "../../table-spaces";
import { api } from "~/trpc/react";

export default function BaseTablePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const baseId = params?.id as string;
  const tableId = params?.tableId as string;
  const workspaceId = searchParams?.get("workspaceId") as string | null;

  // Create base mutation
  const createBase = api.base.create.useMutation();
  const [hasCreatedBase, setHasCreatedBase] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Auto-create base when page loads (only once)
  useEffect(() => {
    if (
      status === "authenticated" &&
      baseId &&
      workspaceId &&
      !createBase.isPending &&
      !hasCreatedBase
    ) {
      const checkAndCreateBase = async () => {
        try {
          await createBase.mutateAsync({
            id: baseId,
            workspaceId: workspaceId,
            name: "Untitled Base",
          });
          setHasCreatedBase(true);
          // Remove workspaceId from URL after base is created
          if (tableId) {
            router.replace(`/base/${baseId}/${tableId}`);
          } else {
            router.replace(`/base/${baseId}`);
          }
        } catch (error) {
          // Base might already exist, which is fine
          console.error("Error creating base:", error);
          setHasCreatedBase(true);
          // Still remove workspaceId from URL even if base already exists
          if (tableId) {
            router.replace(`/base/${baseId}/${tableId}`);
          } else {
            router.replace(`/base/${baseId}`);
          }
        }
      };

      void checkAndCreateBase();
    } else if (
      status === "authenticated" &&
      baseId &&
      !workspaceId &&
      !hasCreatedBase
    ) {
      setHasCreatedBase(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, baseId, workspaceId, hasCreatedBase]);

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
    <div className="h-screen w-full bg-white flex overflow-hidden">
      {/* Far Left Vertical Bar */}
      <LeftBar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Base Page Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Base Header */}
          <BaseTopBar />

          {/* Table View */}
          <TableSpaces 
            baseId={baseId}
            tableId={tableId}
          />
        </div>
      </div>
    </div>
  );
}
