"use client";

export function BaseTopBar() {
  return (
    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white relative">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-300" style={{ backgroundColor: "#39CAFF", marginLeft: "1px" }}>
            <svg
              width="25"
              height="20"
              viewBox="0 0 200 170"
              fill="none"
              style={{ shapeRendering: "geometricPrecision" }}
            >
              <g>
                <path
                  fill="#000000"
                  d="M90.0389,12.3675 L24.0799,39.6605 C20.4119,41.1785 20.4499,46.3885 24.1409,47.8515 L90.3759,74.1175 C96.1959,76.4255 102.6769,76.4255 108.4959,74.1175 L174.7319,47.8515 C178.4219,46.3885 178.4609,41.1785 174.7919,39.6605 L108.8339,12.3675 C102.8159,9.8775 96.0559,9.8775 90.0389,12.3675"
                />
                <path
                  fill="#000000"
                  d="M105.3122,88.4608 L105.3122,154.0768 C105.3122,157.1978 108.4592,159.3348 111.3602,158.1848 L185.1662,129.5368 C186.8512,128.8688 187.9562,127.2408 187.9562,125.4288 L187.9562,59.8128 C187.9562,56.6918 184.8092,54.5548 181.9082,55.7048 L108.1022,84.3528 C106.4182,85.0208 105.3122,86.6488 105.3122,88.4608"
                />
                <path
                  fill="#000000"
                  d="M88.0781,91.8464 L66.1741,102.4224 L63.9501,103.4974 L17.7121,125.6524 C14.7811,127.0664 11.0401,124.9304 11.0401,121.6744 L11.0401,60.0884 C11.0401,58.9104 11.6441,57.8934 12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
                />
                <path
                  fill="rgba(0, 0, 0, 0.25)"
                  d="M88.0781,91.8464 L66.1741,102.4224 L12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
                />
              </g>
            </svg>
          </div>
          <h1
            className="text-base font-bold text-[#011435]"
            style={{
              fontFamily:
                '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            }}
          >
            Untitled Base
          </h1>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-gray-500"
          >
            <path
              d="M3 4.5l3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-medium text-[#011435] border-b-2 border-[rgb(27,97,201)]"
          style={{
            fontFamily:
              '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          }}
        >
          Data
        </button>
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-[#011435]"
          style={{
            fontFamily:
              '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          }}
        >
          Automations
        </button>
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-[#011435]"
          style={{
            fontFamily:
              '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          }}
        >
          Interfaces
        </button>
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-[#011435]"
          style={{
            fontFamily:
              '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          }}
        >
          Forms
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 4v4l3 2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-medium text-[#011435] border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
          style={{
            fontFamily:
              '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          }}
        >
          Launch
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 7.5l3-3 3 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-medium rounded-md"
          style={{
            backgroundColor: '#39CAFF',
            color: '#000000',
            fontFamily:
              '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          }}
        >
          Share
        </button>
      </div>
    </div>
  );
}
