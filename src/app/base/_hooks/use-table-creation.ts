import { useRouter, useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { generateTableId } from "~/utils/table-id-generator";

type UseTableCreationProps = {
  baseId: string;
  baseTables: Array<{ id: string }>;
};

export function useTableCreation({ baseId, baseTables }: UseTableCreationProps) {
  const router = useRouter();
  const params = useParams();
  const utils = api.useUtils();

  const createTable = api.table.create.useMutation({
    onSuccess: () => {
      void utils.base.getById.invalidate({ id: baseId });
    },
  });

  const handleAddNewTab = async () => {
    if (!baseId) {
      console.warn("Cannot add new tab: baseId is missing", { baseId, params: params?.id });
      return;
    }
    
    const newTableId = generateTableId();
    
    try {
      await createTable.mutateAsync({
        id: newTableId,
        baseId: baseId,
        name: `Table ${baseTables.length + 1}`,
      });
      
      router.push(`/base/${baseId}/${newTableId}`);
    } catch (error) {
      console.error("Error creating table:", error);
    }
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
