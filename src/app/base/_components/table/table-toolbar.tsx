"use client";

import { api } from "~/trpc/react";
import { useState } from "react";

type TableToolbarProps = {
  onToggleSidebar: () => void;
  activeTable?: { id: string; name: string } | null;
};

export function TableToolbar({ onToggleSidebar, activeTable }: TableToolbarProps) {
  const [isAddingRows, setIsAddingRows] = useState(false);
  const utils = api.useUtils();
  const addBulkRowsMut = api.tableData.addBulkRows.useMutation({
    onSuccess: async () => {
      if (activeTable?.id) {
        await utils.tableData.load.invalidate({ tableId: activeTable.id });
      }
      setIsAddingRows(false);
    },
    onError: () => {
      setIsAddingRows(false);
    },
  });

  const handleAdd100kRows = async () => {
    if (!activeTable?.id) return;
    setIsAddingRows(true);
    try {
      await addBulkRowsMut.mutateAsync({
        tableId: activeTable.id,
        count: 100000,
      });
    } catch (error) {
      console.error("Failed to add rows:", error);
    }
  };

  return (
    <div className="px-4 py-1.5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
      <div className="flex items-center gap-3">
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
        {activeTable && (
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="8" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="1" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="8" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            
            <span className="text-xs font-medium text-[#011435]">Grid view</span>
            
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 4.5l3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
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
        {activeTable && (
          <button
            type="button"
            onClick={handleAdd100kRows}
            disabled={isAddingRows}
            className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md flex items-center gap-1"
            title="Add 100,000 rows to the table"
          >
            {isAddingRows ? (
              <>
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Add 100k Rows
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
