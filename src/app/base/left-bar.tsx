"use client";

import { useSession } from "next-auth/react";

export function LeftBar() {
  const { data: session } = useSession();

  return (
    <div className="w-14 bg-white border-r border-gray-200 flex flex-col items-center justify-between py-2 flex-shrink-0">
      {/* Logo - Back button */}
      <button
        type="button"
        className="group w-8 h-8 flex items-center justify-center transition-colors text-gray-700 relative mt-2"
      >
        {/* Logo - visible by default, hidden on hover */}
        <svg
          width="25"
          height="20"
          viewBox="0 0 200 170"
          fill="none"
          className="group-hover:hidden"
          style={{ shapeRendering: "geometricPrecision" }}
        >
          <g>
            {/* Top surface - all black */}
            <path
              fill="#000000"
              d="M90.0389,12.3675 L24.0799,39.6605 C20.4119,41.1785 20.4499,46.3885 24.1409,47.8515 L90.3759,74.1175 C96.1959,76.4255 102.6769,76.4255 108.4959,74.1175 L174.7319,47.8515 C178.4219,46.3885 178.4609,41.1785 174.7919,39.6605 L108.8339,12.3675 C102.8159,9.8775 96.0559,9.8775 90.0389,12.3675"
            />
            {/* Right side - all black */}
            <path
              fill="#000000"
              d="M105.3122,88.4608 L105.3122,154.0768 C105.3122,157.1978 108.4592,159.3348 111.3602,158.1848 L185.1662,129.5368 C186.8512,128.8688 187.9562,127.2408 187.9562,125.4288 L187.9562,59.8128 C187.9562,56.6918 184.8092,54.5548 181.9082,55.7048 L108.1022,84.3528 C106.4182,85.0208 105.3122,86.6488 105.3122,88.4608"
            />
            {/* Left side - all black */}
            <path
              fill="#000000"
              d="M88.0781,91.8464 L66.1741,102.4224 L63.9501,103.4974 L17.7121,125.6524 C14.7811,127.0664 11.0401,124.9304 11.0401,121.6744 L11.0401,60.0884 C11.0401,58.9104 11.6441,57.8934 12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
            />
            {/* Shadow - all black with opacity */}
            <path
              fill="rgba(0, 0, 0, 0.25)"
              d="M88.0781,91.8464 L66.1741,102.4224 L12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
            />
          </g>
        </svg>
        {/* Back arrow - hidden by default, visible on hover */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 12 12"
          fill="none"
          className="hidden group-hover:block"
        >
          <path
            fillRule="evenodd"
            d="M5.64775 2.22725C5.86742 2.44692 5.86742 2.80308 5.64775 3.02275L3.233 5.4375H10.125C10.4357 5.4375 10.6875 5.68934 10.6875 6C10.6875 6.31066 10.4357 6.5625 10.125 6.5625H3.233L5.64775 8.97725C5.86742 9.19692 5.86742 9.55308 5.64775 9.77275C5.42808 9.99242 5.07192 9.99242 4.85225 9.77275L1.47725 6.39775C1.37176 6.29226 1.3125 6.14918 1.3125 6C1.3125 5.85082 1.37176 5.70774 1.47725 5.60225L4.85225 2.22725C5.07192 2.00758 5.42808 2.00758 5.64775 2.22725Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Bottom section - Question mark, Bell, User avatar */}
      <div className="flex flex-col items-center gap-3">
        {/* Question mark icon */}
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 11V8M8 5h.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {/* Bell/notification icon */}
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2a4 4 0 014 4v2.5l1.5 1.5H14a1 1 0 01-1 1H3a1 1 0 01-1-1h.5L4 8.5V6a4 4 0 014-4zM6 13a2 2 0 104 0"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </button>
        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">
          {session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase() ?? "W"}
        </div>
      </div>
    </div>
  );
}
