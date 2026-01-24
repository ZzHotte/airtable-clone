import { useMemo } from "react";

type UseAvailableTablesProps = {
  baseTables: Array<{ id: string; name: string }>;
  activeTableId: string | null;
};

export function useAvailableTables({ baseTables, activeTableId }: UseAvailableTablesProps) {
  const baseTablesList = useMemo(
    () => baseTables.map((t) => ({ id: t.id, name: t.name || "Table 1" })),
    [baseTables]
  );

  const availableTables = useMemo(() => {
    const tablesSet = new Set(baseTablesList.map((t) => t.id));

    if (activeTableId && !tablesSet.has(activeTableId)) {
      return [...baseTablesList, { id: activeTableId, name: `Table ${baseTablesList.length + 1}` }];
    }

    if (baseTablesList.length > 0) {
      return baseTablesList;
    }

    if (activeTableId) {
      return [{ id: activeTableId, name: "Table 1" }];
    }

    return [];
  }, [activeTableId, baseTablesList]);

  return availableTables;
}
