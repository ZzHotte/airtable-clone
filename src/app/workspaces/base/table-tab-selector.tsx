"use client";

import { TableTabButton } from "./_components/tab/table-tab-button";
import { TableTabDropdown } from "./_components/tab/table-tab-dropdown";
import { TableTabAddButton } from "./_components/tab/table-tab-add-button";
import { useTableBackendSync } from "./_hooks/use-table-backend-sync";

type TableTab = {
  id: string;
  name: string;
};

type TableTabSelectorProps = {
  tabs: TableTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onAddNewTab?: () => void;
};

export function TableTabSelector({ tabs, activeTabId, onTabChange, onAddNewTab }: TableTabSelectorProps) {
  const backendSync = useTableBackendSync();

  return (
    <div className="flex items-end gap-0 w-full">
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        const isFirst = index === 0;
        
        return (
          <TableTabButton
            key={tab.id}
            tab={tab}
            isActive={isActive}
            isFirst={isFirst}
            onClick={() => onTabChange(tab.id)}
            onMouseEnter={() => {
              // Prefetch data on hover for instant loading when clicked
              if (!isActive) {
                backendSync.prefetchData(tab.id);
              }
            }}
          />
        );
      })}

      <TableTabDropdown />

      <TableTabAddButton onClick={onAddNewTab} />
    </div>
  );
}
