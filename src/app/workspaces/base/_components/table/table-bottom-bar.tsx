"use client";

type TableBottomBarProps = {
  recordCount: number;
  onAddRow: () => void;
};

export function TableBottomBar({ recordCount, onAddRow }: TableBottomBarProps) {
  return (
    <div className="px-4 py-1.5 border-t border-gray-200 flex items-center justify-between bg-gray-50">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2v12M2 8h12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={onAddRow}
          className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2v12M2 8h12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Add...
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 2l1.5 3 3.5.5-2.5 2.5.5 3.5L7 10.5 4 11.5l.5-3.5L2 5.5l3.5-.5L7 2z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-xs text-gray-500 ml-2">{recordCount} records</span>
      </div>
      <span className="text-xs text-gray-500">Sum 0.0</span>
    </div>
  );
}
