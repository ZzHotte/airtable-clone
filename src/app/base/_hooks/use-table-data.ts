import { useState, useMemo, useCallback } from "react";

export type TableRow = {
  id: string;
  [key: string]: string;
};

type UseTableDataProps = {
  activeTableId: string | null;
  externalSetData?: (data: TableRow[]) => void;
};

export function useTableData({ activeTableId, externalSetData }: UseTableDataProps) {
  const [tableDataMap, setTableDataMap] = useState<Record<string, TableRow[]>>({});

  const currentData = useMemo(() => {
    if (activeTableId) {
      return tableDataMap[activeTableId] || [{ id: "1", name: "", number: "" }];
    }
    return [{ id: "1", name: "", number: "" }];
  }, [activeTableId, tableDataMap]);

  const handleSetData = useCallback(
    (newData: TableRow[]) => {
      if (activeTableId) {
        setTableDataMap((prev) => ({
          ...prev,
          [activeTableId]: newData,
        }));
      }
      if (externalSetData) {
        externalSetData(newData);
      }
    },
    [activeTableId, externalSetData]
  );

  const handleAddRow = useCallback(() => {
    const newRow: TableRow = {
      id: String(currentData.length + 1),
    };
    handleSetData([...currentData, newRow]);
  }, [currentData, handleSetData]);

  return {
    currentData,
    handleSetData,
    handleAddRow,
  };
}
