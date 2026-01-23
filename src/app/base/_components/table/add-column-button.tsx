"use client";

import { useState } from "react";
import { AddColumnModal, type ColumnType } from "./add-column-modal";

type AddColumnButtonProps = {
  onCreate: (data: { name: string; type: ColumnType; defaultValue?: string }) => void;
};

export function AddColumnButton({ onCreate }: AddColumnButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleCreate = (data: { name: string; type: ColumnType; defaultValue?: string }) => {
    onCreate(data);
  };

  return (
    <>
      <div
        className="absolute bg-white border-b border-r border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
        style={{
          top: 0,
          left: "100%",
          width: "80px",
          height: "33px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 30,
        }}
      >
        <button
          type="button"
          onClick={handleButtonClick}
          className="w-full min-h-[1.5rem] flex items-center justify-center text-gray-400 transition-colors cursor-pointer"
          title="Add column"
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
      </div>
      <AddColumnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}

