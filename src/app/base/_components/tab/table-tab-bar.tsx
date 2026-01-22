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
      className="border-b border-gray-200 flex items-end relative"
      style={{ backgroundColor: "#f2f4f8" }}
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
