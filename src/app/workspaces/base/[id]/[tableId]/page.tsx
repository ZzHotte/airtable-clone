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

  const createBase = api.base.create.useMutation();
  const [hasCreatedBase, setHasCreatedBase] = useState(false);

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
          if (tableId) {
            router.replace(`/base/${baseId}/${tableId}`);
          } else {
            router.replace(`/base/${baseId}`);
          }
        } catch (error) {
          console.error("Error creating base:", error);
          setHasCreatedBase(true);
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
      <LeftBar />

      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <BaseTopBar />

          <TableSpaces 
            baseId={baseId}
            tableId={tableId}
          />
        </div>
      </div>
    </div>
  );
}
