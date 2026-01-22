"use client";

import { TableTabDropdownIcon } from "./table-tab-dropdown-icon";

export function TableTabDropdown() {
  return (
    <button
      type="button"
      className="px-2 py-1.5 hover:bg-gray-200 flex items-center justify-center"
      style={{
        backgroundColor: "#f2f4f8",
        borderRadius: "6px",
      }}
    >
      <TableTabDropdownIcon />
    </button>
  );
}
