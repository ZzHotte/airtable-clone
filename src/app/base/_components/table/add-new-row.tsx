"use client";

type AddNewRowProps = {
  onAddRow: () => void;
  variant: "inline" | "sticky";
  cellWidth?: number;
};

function AddNewRowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 2v12M2 8h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AddNewRow({ onAddRow, variant, cellWidth }: AddNewRowProps) {
  if (variant === "sticky") {
    return (
      <div
        className="sticky bottom-0 left-0 right-0 z-10 pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="border border-gray-200 bg-white min-h-[24px] flex items-center justify-center pointer-events-auto"
          style={{ width: cellWidth ?? 80 }}
        >
          <button
            type="button"
            onClick={onAddRow}
            className="w-full h-full flex items-center justify-center gap-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Add new row"
          >
            <AddNewRowIcon />
            <span className="text-xs">Add row</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAddRow}
      className="w-full min-h-[1.5rem] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
      title="Add new row"
    >
      <AddNewRowIcon />
    </button>
  );
}
