"use client";

import { TableTabDropdownIcon } from "./table-tab-dropdown-icon";

type TableTabButtonProps = {
  tab: { id: string; name: string };
  isActive: boolean;
  isFirst: boolean;
  onClick: () => void;
};

export function TableTabButton({ tab, isActive, isFirst, onClick }: TableTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      {isActive && <TableTabDropdownIcon />}
    </button>
  );
}
