"use client";

import { TableTabSelector } from "../../table-tab-selector";

type TableTabBarProps = {
  isLoading: boolean;
  activeTableId: string | null;
  availableTables: Array<{ id: string; name: string }>;
  onTabChange: (tabId: string) => void;
  onAddNewTab: () => void;
};

export function TableTabBar({
  isLoading,
  activeTableId,
  availableTables,
  onTabChange,
  onAddNewTab,
}: TableTabBarProps) {
  return (
    <div
      className="flex items-end relative border-b border-gray-200"
      style={{ backgroundColor: "#E3FAFD" }}
    >
      {!isLoading && activeTableId && (
        <TableTabSelector
          tabs={availableTables}
          activeTabId={activeTableId}
          onTabChange={onTabChange}
          onAddNewTab={onAddNewTab}
        />
      )}
    </div>
  );
}
