"use client";

type TableSidebarProps = {
  isOpen: boolean;
};

export function TableSidebar({ isOpen }: TableSidebarProps) {
  if (!isOpen) {
    return (
      <div
        className="w-0 border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-200 overflow-hidden"
      />
    );
  }

  return (
    <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-200 overflow-hidden">
      <div className="p-3">
        <div className="relative">
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
              <path
                d="M9.5 9.5l3 3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <input
            type="text"
            name="find-view"
            id="find-view-input"
            placeholder="Find a view"
            className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(27,97,201)]"
          />
        </div>
      </div>

      <div className="flex-1 p-3">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-md border border-gray-300">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="8" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="1" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="8" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="text-sm font-medium text-[#011435]">Grid view</span>
        </div>
      </div>
    </div>
  );
}
