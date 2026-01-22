"use client";

import { TableTabAddIcon } from "./table-tab-add-icon";

type TableTabAddButtonProps = {
  onClick?: () => void;
};

export function TableTabAddButton({ onClick }: TableTabAddButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) {
          onClick();
        }
      }}
      className="px-3 py-1.5 hover:bg-gray-200 flex items-center gap-1.5 text-xs cursor-pointer"
      style={{
        backgroundColor: "#f2f4f8",
        color: "rgb(100, 100, 100)",
        borderRadius: "6px",
        pointerEvents: "auto",
      }}
    >
      <TableTabAddIcon />
      <span>Add or import</span>
    </button>
  );
}
