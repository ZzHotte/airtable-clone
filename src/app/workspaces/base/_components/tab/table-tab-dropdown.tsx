"use client";

import { useState } from "react";
import { TableTabDropdownIcon } from "./table-tab-dropdown-icon";

export function TableTabDropdown() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="px-2 py-1.5 flex items-center justify-center cursor-pointer transition-shadow duration-200"
      style={{
        backgroundColor: "#E3FAFD",
        borderRadius: "6px",
        borderBottom: "1px solid rgb(229, 231, 235)",
        borderRight: "1px solid rgb(229, 231, 235)",
        boxShadow: isHovered ? "0 2px 6px rgba(0, 0, 0, 0.15)" : "none",
      }}
    >
      <TableTabDropdownIcon />
    </button>
  );
}
