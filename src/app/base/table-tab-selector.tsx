"use client";

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
  return (
    <div className="flex items-end gap-0 w-full">
      {/* Tab list */}
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        const isFirst = index === 0;
        
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`py-1.5 text-xs relative flex items-center ${
              isActive ? "font-bold" : "font-normal"
            }`}
            style={{
              fontFamily:
                '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
              backgroundColor: isActive ? "rgb(255, 255, 255)" : "#f2f4f8",
              color: isActive ? "rgb(50, 50, 50)" : "rgb(100, 100, 100)",
              ...(isActive && !isFirst
                ? { borderRadius: "4px 4px 0 0" }
                : isFirst && !isActive
                ? { borderRadius: "4px 0 0 0" }
                : isFirst && isActive
                ? { borderRadius: "4px 4px 0 0" }
                : { borderRadius: "0" }),
              borderBottom: "none",
              boxShadow: isActive ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
              position: isActive ? "relative" : "static",
              zIndex: isActive ? 1 : 0,
              paddingLeft: "12px",
              paddingRight: isActive ? "8px" : "12px",
              gap: "4px",
            }}
          >
            <span>{tab.name}</span>
            {/* Dropdown arrow for active tab */}
            {isActive && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="text-gray-500"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M3 4.5l3 3 3-3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        );
      })}

      {/* Additional dropdown arrow (standalone) */}
      <button
        type="button"
        className="px-2 py-1.5 hover:bg-gray-200 flex items-center justify-center"
        style={{
          backgroundColor: "#f2f4f8",
          borderRadius: "6px",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="text-gray-500"
        >
          <path
            d="M3 4.5l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Add or import button */}
      <button
        type="button"
        onClick={onAddNewTab}
        className="px-3 py-1.5 hover:bg-gray-200 flex items-center gap-1.5 text-xs"
        style={{
          backgroundColor: "#f2f4f8",
          color: "rgb(100, 100, 100)",
          borderRadius: "6px",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 2v10M2 7h10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span>Add or import</span>
      </button>
    </div>
  );
}
