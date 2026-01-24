/**
 * Table skeleton loader for better perceived performance
 * Shows while data is loading to give instant feedback
 */

"use client";

export function TableSkeleton() {
  return (
    <div className="flex-1 overflow-auto" style={{ backgroundColor: "#F6F8FC" }}>
      <div className="inline-block relative">
        <table className="border-collapse" style={{ tableLayout: "fixed", width: "auto" }}>
          <thead className="bg-white sticky top-0 z-20">
            <tr className="border-b border-gray-200">
              <th className="px-2 py-1 border-r border-gray-200" style={{ width: 50 }}>
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </th>
              {[1, 2, 3].map((i) => (
                <th key={i} className="px-2 py-1 border-r border-gray-200" style={{ width: 150 }}>
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
              <tr key={row} className="border-b border-gray-200">
                <td className="px-2 py-1 border-r border-gray-200">
                  <div className="h-4 w-8 bg-gray-100 rounded animate-pulse" />
                </td>
                {[1, 2, 3].map((col) => (
                  <td key={col} className="px-2 py-1 border-r border-gray-200">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
