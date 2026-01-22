import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { generateTableId } from "~/utils/table-id-generator";

type UseTableCreationProps = {
  baseId: string;
  tableId: string | null;
  baseTables: Array<{ id: string }>;
  isLoadingTables: boolean;
};

export function useTableCreation({ baseId, tableId, baseTables, isLoadingTables }: UseTableCreationProps) {
  const router = useRouter();
  const params = useParams();
  const utils = api.useUtils();

  const createTable = api.table.create.useMutation({
    onSuccess: () => {
      void utils.base.getById.invalidate({ id: baseId });
    },
  });

  const [hasCreatedTable, setHasCreatedTable] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (
      baseId &&
      tableId &&
      !isLoadingTables &&
      !createTable.isPending &&
      !hasCreatedTable[tableId]
    ) {
      const tableExists = baseTables.some((t) => t.id === tableId);

      if (!tableExists) {
        const createNewTable = async () => {
          try {
            await createTable.mutateAsync({
              id: tableId,
              baseId: baseId,
              name: `Table ${baseTables.length + 1}`,
            });
            setHasCreatedTable((prev) => ({ ...prev, [tableId]: true }));
          } catch (error) {
            console.error("Error creating table:", error);
            setHasCreatedTable((prev) => ({ ...prev, [tableId]: true }));
          }
        };

        void createNewTable();
      } else {
        setHasCreatedTable((prev) => ({ ...prev, [tableId]: true }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseId, tableId, isLoadingTables, baseTables, hasCreatedTable]);

  useEffect(() => {
    if (!isLoadingTables && baseTables.length === 0 && baseId && !tableId) {
      const newTableId = generateTableId();
      router.replace(`/base/${baseId}/${newTableId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingTables, baseTables.length, baseId, tableId, router]);

  const handleAddNewTab = () => {
    if (!baseId) {
      console.warn("Cannot add new tab: baseId is missing", { baseId, params: params?.id });
      return;
    }
    const newTableId = generateTableId();
    console.log("Adding new tab:", { baseId, newTableId });
    router.push(`/base/${baseId}/${newTableId}`);
  };

  const handleTabChange = (tabId: string) => {
    if (!baseId) return;
    router.push(`/base/${baseId}/${tabId}`);
  };

  return {
    handleAddNewTab,
    handleTabChange,
  };
}
