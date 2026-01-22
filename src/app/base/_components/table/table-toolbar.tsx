"use client";

type TableToolbarProps = {
  onToggleSidebar: () => void;
};

export function TableToolbar({ onToggleSidebar }: TableToolbarProps) {
  return (
    <div className="px-4 py-1.5 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-500">
          <path
            d="M1 3h12M1 7h12M1 11h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        type="button"
        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 3C4.5 3 2.5 4.5 1 7C2.5 9.5 4.5 11 7 11C9.5 11 11.5 9.5 13 7C11.5 4.5 9.5 3 7 3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Hide fields
      </button>
      <button
        type="button"
        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M6 2v10M2 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Filter
      </button>
      <button
        type="button"
        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.5" />
          <rect x="1" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.5" />
          <rect x="7" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.5" />
          <rect x="7" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Group
      </button>
      <button
        type="button"
        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M4 5l3-3 3 3M4 9l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Sort
      </button>
      <button
        type="button"
        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 3v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Color
      </button>
      <button
        type="button"
        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="8" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="1" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="8" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Share and sync
      </button>
      <div className="flex-1"></div>
      <button
        type="button"
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M11 11l3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
