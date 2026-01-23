"use client";

import { useState } from "react";

export type ColumnType = "text" | "number";

type AddColumnModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; type: ColumnType; defaultValue?: string }) => void;
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

export function AddColumnModal({ isOpen, onClose, onCreate }: AddColumnModalProps) {
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

  const selectedType = columnTypes.find((t) => t.value === columnType) || columnTypes[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field name (optional)
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Field name (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Field type</label>
            <div className="relative">
              <select
                value={columnType}
                onChange={(e) => setColumnType(e.target.value as ColumnType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10"
              >
                {columnTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
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
            <p className="mt-2 text-sm text-gray-500">{selectedType.description}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Default</label>
            <input
              type="text"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder="Enter default value (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {!showDescription && (
            <button
              type="button"
              onClick={() => setShowDescription(true)}
              className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2v12M2 8h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span>Add description</span>
            </button>
          )}

          {showDescription && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create field
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
