"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { generateTableId } from "~/utils/table-id-generator";

export default function BasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const baseId = params?.id as string;
  const workspaceId = searchParams?.get("workspaceId") as string | null;

  // Create base mutation
  const createBase = api.base.create.useMutation();
  const [hasCreatedBase, setHasCreatedBase] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Query base's tables
  const { data: baseData, isLoading: isLoadingBase } = api.base.getById.useQuery(
    { id: baseId },
    { enabled: status === "authenticated" && !!baseId }
  );

  const baseTables = baseData?.dataTables ?? [];
  const isLoadingTables = isLoadingBase;

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
        } catch (error) {
          // Base might already exist, which is fine
          console.error("Error creating base:", error);
          setHasCreatedBase(true);
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
  }, [status, baseId, workspaceId, createBase, hasCreatedBase]);

  // Redirect to first table or create new table
  useEffect(() => {
    if (
      status === "authenticated" &&
      baseId &&
      hasCreatedBase &&
      !hasRedirected &&
      !isLoadingTables
    ) {
      // If base already has tables, redirect to the first one
      if (baseTables.length > 0) {
        const firstTableId = baseTables[0]?.id;
        if (firstTableId) {
          setHasRedirected(true);
          router.replace(`/base/${baseId}/${firstTableId}`);
        }
      } else {
        // Only create a new table if base has no tables
        const newTableId = generateTableId();
        setHasRedirected(true);
        router.replace(`/base/${baseId}/${newTableId}`);
      }
    }
  }, [status, baseId, hasCreatedBase, hasRedirected, router, isLoadingTables, baseTables]);

  if (status === "loading" || !hasRedirected) {
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

  return null; // This page just redirects
}
