"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type Table,
} from "@tanstack/react-table";
import { TableTabSelector } from "./table-tab-selector";

type TableRow = {
  id: string;
  name: string;
  number: string;
};

type TableData = {
  id: string;
  name: string;
  data: TableRow[];
};

type TableSpacesProps = {
  // Keep backward compatibility, but we'll manage tabs internally
  table?: Table<TableRow>;
  data?: TableRow[];
  setData?: (data: TableRow[]) => void;
};

export function TableSpaces({ table: externalTable, data: externalData, setData: externalSetData }: TableSpacesProps) {
  // Manage multiple tables internally
  const [tables, setTables] = useState<TableData[]>([
    { id: "table-1", name: "Table 1", data: [{ id: "1", name: "", number: "" }, { id: "2", name: "", number: "" }, { id: "3", name: "", number: "" }] },
    { id: "table-2", name: "Table 2", data: [{ id: "1", name: "", number: "" }] },
  ]);
  const [activeTableId, setActiveTableId] = useState("table-2");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeTableData = tables.find((t) => t.id === activeTableId) ?? tables[0];
  const currentData = activeTableData?.data ?? [];

  const handleSetData = (newData: TableRow[]) => {
    setTables((prev) =>
      prev.map((t) => (t.id === activeTableId ? { ...t, data: newData } : t))
    );
    // Also call external setData if provided for backward compatibility
    if (externalSetData) {
      externalSetData(newData);
    }
  };

  const handleAddRow = () => {
    const newRow: TableRow = {
      id: String(currentData.length + 1),
      name: "",
      number: "",
    };
    handleSetData([...currentData, newRow]);
  };

  const handleAddNewTab = () => {
    const newTableId = `table-${tables.length + 1}`;
    const newTable: TableData = {
      id: newTableId,
      name: `Table ${tables.length + 1}`,
      data: [{ id: "1", name: "", number: "" }],
    };
    setTables([...tables, newTable]);
    setActiveTableId(newTableId);
  };

  // Define columns
  const columns = useMemo<ColumnDef<TableRow>[]>(
    () => [
      {
        id: "rowNumber",
        header: () => <input type="checkbox" className="w-4 h-4" />,
        cell: (info) => {
          const rowIndex = info.row.index;
          return (
            <div className="px-2 py-1 text-sm text-gray-600">
              {rowIndex + 1}
            </div>
          );
        },
        size: 50,
      },
      {
        accessorKey: "name",
        header: "A Name",
        cell: (info) => {
          const rowIndex = info.row.index;
          const currentRow = currentData[rowIndex];
          return (
            <input
              type="text"
              className="w-full px-2 py-1 border-none outline-none bg-transparent"
              placeholder=""
              value={currentRow?.name ?? ""}
              onChange={(e) => {
                const newData = [...currentData];
                if (newData[rowIndex]) {
                  newData[rowIndex] = {
                    ...newData[rowIndex],
                    name: e.target.value,
                  };
                  handleSetData(newData);
                }
              }}
            />
          );
        },
      },
      {
        accessorKey: "number",
        header: "# Number",
        cell: (info) => {
          const rowIndex = info.row.index;
          const currentRow = currentData[rowIndex];
          return (
            <input
              type="text"
              className="w-full px-2 py-1 border-none outline-none bg-transparent"
              placeholder=""
              value={currentRow?.number ?? ""}
              onChange={(e) => {
                const newData = [...currentData];
                if (newData[rowIndex]) {
                  newData[rowIndex] = {
                    ...newData[rowIndex],
                    number: e.target.value,
                  };
                  handleSetData(newData);
                }
              }}
            />
          );
        },
      },
      {
        id: "addColumn",
        header: () => (
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
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
        ),
        cell: () => null,
        size: 50,
      },
    ],
    [currentData]
  );

  // Initialize table
  const table = useReactTable({
    data: currentData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    defaultColumn: {
      size: 150,
      minSize: 100,
      maxSize: 500,
    },
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Table Spaces Top Bar */}
      <div 
        className="border-b border-gray-200 flex items-end relative"
        style={{ backgroundColor: "#f2f4f8" }}
      >
        {/* Left: Table tab selector */}
        <TableTabSelector
          tabs={tables.map((t) => ({ id: t.id, name: t.name }))}
          activeTabId={activeTableId}
          onTabChange={setActiveTableId}
          onAddNewTab={handleAddNewTab}
        />
      </div>

      {/* Main Content: Sidebar + Table */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar for Views */}
        <div
          className={`${
            isSidebarOpen ? "w-64" : "w-0"
          } border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-200 overflow-hidden`}
        >

          {isSidebarOpen && (
            <>
              {/* Search Section */}
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
                placeholder="Find a view"
                className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(27,97,201)]"
              />
            </div>
          </div>

          {/* Bottom Section: Active view list */}
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
            </>
          )}
        </div>

        

        {/* Table Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Table Toolbar */}
          <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
            {/* Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-gray-500"
              >
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
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
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
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M6 2v10M2 6h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Filter
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
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
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
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
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M7 3v4l3 2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Color
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
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

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r border-b border-gray-200"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 border-b border-gray-200">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-2 py-1 border-r border-gray-200"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Add Row indicator */}
                <tr className="border-b border-gray-200">
                  <td className="px-2 py-1 border-r border-gray-200">
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-400"
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
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200"></td>
                  <td className="px-2 py-1 border-r border-gray-200"></td>
                  <td className="px-2 py-1"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Bar */}
          <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between bg-gray-50">
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
                onClick={handleAddRow}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
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
              <span className="text-sm text-gray-500 ml-2">{currentData.length} records</span>
            </div>
            <span className="text-sm text-gray-500">Sum 0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
