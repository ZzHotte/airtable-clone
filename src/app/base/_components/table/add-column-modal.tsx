"use client";

import { useState } from "react";

export type ColumnType = "text" | "number";

type AddColumnModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; type: ColumnType; defaultValue?: string }) => void;
  position?: { top: number; left: number } | null;
};

const columnTypes: Array<{ value: ColumnType; label: string; description: string }> = [
  {
    value: "text",
    label: "Single line text",
    description: "Enter text, or prefill each new cell with a default value.",
  },
  {
    value: "number",
    label: "Number",
    description: "Enter numbers, or prefill each new cell with a default value.",
  },
];

export function AddColumnModal({ isOpen, onClose, onCreate, position }: AddColumnModalProps) {
  const [fieldName, setFieldName] = useState("");
  const [columnType, setColumnType] = useState<ColumnType>("text");
  const [defaultValue, setDefaultValue] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleCreate = () => {
    onCreate({
      name: fieldName || `Column ${Date.now()}`,
      type: columnType,
      defaultValue: defaultValue || undefined,
    });
    handleClose();
  };

  const handleClose = () => {
    setFieldName("");
    setColumnType("text");
    setDefaultValue("");
    setDescription("");
    setShowDescription(false);
    onClose();
  };

  const selectedType = columnTypes.find((t) => t.value === columnType) ?? columnTypes[0];

  const pad = 16;
  const modalW = 320;
  const modalH = 380;
  const constrained = (() => {
    if (!position || typeof window === "undefined") return position;
    let { top, left } = position;
    if (left + modalW > window.innerWidth - pad) left = window.innerWidth - modalW - pad;
    if (left < pad) left = pad;
    if (top + modalH > window.innerHeight - pad) top = window.innerHeight - modalH - pad;
    if (top < pad) top = pad;
    return { top, left };
  })();

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.01)" }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full"
        style={{
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          position: "absolute",
          top: constrained ? `${constrained.top}px` : "50%",
          left: constrained ? `${constrained.left}px` : "50%",
          transform: constrained ? "none" : "translate(-50%, -50%)",
          maxWidth: "calc(28rem * 2 / 3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Field name (optional)
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Field name (optional)"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Field type</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                {columnType === "text" ? (
                  <span className="text-sm text-gray-600 font-medium">A</span>
                ) : (
                  <span className="text-sm text-gray-600 font-medium">#</span>
                )}
              </div>
              <select
                value={columnType}
                onChange={(e) => setColumnType(e.target.value as ColumnType)}
                className="w-full pl-7 pr-8 py-1.5 text-xs border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {columnTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">{selectedType?.description ?? ""}</p>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Default</label>
            <input
              type="text"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder="Enter default value (optional)"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 mb-1">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create field
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
