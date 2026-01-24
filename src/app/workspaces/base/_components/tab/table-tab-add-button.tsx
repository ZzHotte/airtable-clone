"use client";

import { useState } from "react";
import { TableTabAddIcon } from "./table-tab-add-icon";

type TableTabAddButtonProps = {
  onClick?: () => void;
};

export function TableTabAddButton({ onClick }: TableTabAddButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="px-3 py-1.5 flex items-center gap-1.5 text-xs cursor-pointer transition-shadow duration-200"
      style={{
        backgroundColor: "#E3FAFD",
        color: "rgb(100, 100, 100)",
        borderRadius: "6px",
        borderBottom: "1px solid rgb(229, 231, 235)",
        pointerEvents: "auto",
        boxShadow: isHovered ? "0 2px 6px rgba(0, 0, 0, 0.15)" : "none",
      }}
    >
      <TableTabAddIcon />
      <span>Add or import</span>
    </button>
  );
}
