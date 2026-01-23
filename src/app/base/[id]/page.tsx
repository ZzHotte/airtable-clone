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

  const createBase = api.base.create.useMutation();
  const createTable = api.table.create.useMutation();
  const [hasCreatedBase, setHasCreatedBase] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [hasCreatedDefaultTable, setHasCreatedDefaultTable] = useState(false);

  const { data: baseData, isLoading: isLoadingBase, refetch: refetchBase } = api.base.getById.useQuery(
    { id: baseId },
    { enabled: status === "authenticated" && !!baseId }
  );

  const baseTables = baseData?.dataTables ?? [];
  const isLoadingTables = isLoadingBase;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

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

  useEffect(() => {
    if (
      status === "authenticated" &&
      baseId &&
      hasCreatedBase &&
      !hasRedirected &&
      !isLoadingTables &&
      !createTable.isPending
    ) {
      const initializeBase = async () => {
        if (baseTables.length > 0) {
          const firstTableId = baseTables[0]?.id;
          if (firstTableId) {
            setHasRedirected(true);
            router.replace(`/base/${baseId}/${firstTableId}`);
          }
        } else if (!hasCreatedDefaultTable) {
          try {
            const newTableId = generateTableId();
            await createTable.mutateAsync({
              id: newTableId,
              baseId: baseId,
              name: "Table 1",
            });
            setHasCreatedDefaultTable(true);
            await refetchBase();
            setHasRedirected(true);
            router.replace(`/base/${baseId}/${newTableId}`);
          } catch (error) {
            console.error("Error creating default table:", error);
            setHasCreatedDefaultTable(true);
          }
        }
      };

      void initializeBase();
    }
  }, [
    status,
    baseId,
    hasCreatedBase,
    hasRedirected,
    router,
    isLoadingTables,
    baseTables,
    hasCreatedDefaultTable,
    createTable,
    refetchBase,
  ]);

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

  return null;
}
