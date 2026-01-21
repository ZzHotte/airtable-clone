"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { LeftBar } from "../left-bar";
import { BaseTopBar } from "../top-bar";
import { TableSpaces } from "../table-spaces";
import { api } from "~/trpc/react";

// Define data type for table rows
type TableRow = {
  id: string;
  name: string;
  number: string;
};

export default function BasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const baseId = params?.id as string;
  const workspaceId = searchParams?.get("workspaceId") as string | null;
  const [data, setData] = useState<TableRow[]>([
    { id: "1", name: "", number: "" },
    { id: "2", name: "", number: "" },
    { id: "3", name: "", number: "" },
  ]);

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
        } catch (error) {
          // Base might already exist, which is fine
          console.error("Error creating base:", error);
          setHasCreatedBase(true); // Mark as attempted even on error
        }
      };

      void checkAndCreateBase();
    }
  }, [status, baseId, workspaceId, createBase, hasCreatedBase]);

  // Define columns
  const columns = useMemo<ColumnDef<TableRow>[]>(
    () => [
      {
        id: "rowNumber",
        header: () => <input type="checkbox" className="w-4 h-4" />,
        cell: (info) => {
          const rowIndex = info.row.index;
          return (
            <div className="px-2 py-1 text-sm text-gray-600">
              {rowIndex + 1}
            </div>
          );
        },
        size: 50,
      },
      {
        accessorKey: "name",
        header: "A Name",
        cell: (info) => {
          const rowIndex = info.row.index;
          const currentRow = data[rowIndex];
          return (
            <input
              type="text"
              className="w-full px-2 py-1 border-none outline-none bg-transparent"
              placeholder=""
              value={currentRow?.name ?? ""}
              onChange={(e) => {
                const newData = [...data];
                if (newData[rowIndex]) {
                  newData[rowIndex] = {
                    ...newData[rowIndex],
                    name: e.target.value,
                  };
                  setData(newData);
                }
              }}
            />
          );
        },
      },
      {
        accessorKey: "number",
        header: "# Number",
        cell: (info) => {
          const rowIndex = info.row.index;
          const currentRow = data[rowIndex];
          return (
            <input
              type="text"
              className="w-full px-2 py-1 border-none outline-none bg-transparent"
              placeholder=""
              value={currentRow?.number ?? ""}
              onChange={(e) => {
                const newData = [...data];
                if (newData[rowIndex]) {
                  newData[rowIndex] = {
                    ...newData[rowIndex],
                    number: e.target.value,
                  };
                  setData(newData);
                }
              }}
            />
          );
        },
      },
      {
        id: "addColumn",
        header: () => (
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2v12M2 8h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ),
        cell: () => null,
        size: 50,
      },
    ],
    [data]
  );

  // Initialize table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    defaultColumn: {
      size: 150,
      minSize: 100,
      maxSize: 500,
    },
  });

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
          <TableSpaces table={table} data={data} setData={setData} />
        </div>
      </div>
    </div>
  );
}
