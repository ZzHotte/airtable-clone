"use client";

import { useState } from "react";
import { TableTabDropdownIcon } from "./table-tab-dropdown-icon";

type TableTabButtonProps = {
  tab: { id: string; name: string };
  isActive: boolean;
  isFirst: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
};

export function TableTabButton({ tab, isActive, isFirst, onClick, onMouseEnter }: TableTabButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverBgColor = "#D4E8EA"; 
  const baseBgColor = isActive ? "rgb(255, 255, 255)" : "#E3FAFD";
  const backgroundColor = isHovered && !isActive ? hoverBgColor : baseBgColor;

  const handleMouseEnter = () => {
    setIsHovered(true);
    onMouseEnter?.();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      className={`py-1.5 text-xs relative flex items-center cursor-pointer transition-all duration-200 ${
        isActive ? "font-bold" : "font-normal"
      }`}
      style={{
        fontFamily:
          '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        backgroundColor,
        color: isActive ? "rgb(50, 50, 50)" : "rgb(100, 100, 100)",
        ...(isActive
          ? { 
              borderRadius: isFirst ? "4px 4px 0 0" : "4px 4px 0 0",
              borderBottom: "none",
              borderLeft: isFirst ? "none" : "1px solid rgb(229, 231, 235)",
              borderRight: "1px solid rgb(229, 231, 235)",
            }
          : isFirst && !isActive
          ? { 
              borderRadius: "4px 0 0 0",
              borderBottom: "1px solid rgb(229, 231, 235)",
              borderRight: "1px solid rgb(229, 231, 235)",
            }
          : { 
              borderRadius: "0",
              borderBottom: "1px solid rgb(229, 231, 235)",
              borderRight: "1px solid rgb(229, 231, 235)",
            }),
        boxShadow: isActive
          ? "none"
          : isHovered
          ? "0 2px 6px rgba(0, 0, 0, 0.15)"
          : "none",
        position: isActive ? "relative" : "static",
        zIndex: isActive ? 10 : isHovered ? 1 : 0,
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
