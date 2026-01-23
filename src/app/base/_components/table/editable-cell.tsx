"use client";

import { useState, useRef, useEffect } from "react";

type EditableCellProps = {
  value: string;
  onChange: (value: string) => void;
  isEditing?: boolean;
  onStopEditing?: () => void;
  onArrowKey?: (direction: "up" | "down" | "left" | "right") => void;
  placeholder?: string;
  className?: string;
};

export function EditableCell({
  value,
  onChange,
  isEditing = false,
  onStopEditing,
  onArrowKey,
  placeholder = "",
  className = "",
}: EditableCellProps) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const start = inputRef.current.selectionStart;
          const end = inputRef.current.selectionEnd;
          if (start === end && inputRef.current.value.length > 0) {
            inputRef.current.setSelectionRange(0, inputRef.current.value.length);
          }
        }
      });
    }
  }, [isEditing]);

  const handleBlur = () => {
    onChange(editValue);
    if (onStopEditing) {
      onStopEditing();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      inputRef.current?.blur();
      return;
    }
    if (e.key === "Escape") {
      setEditValue(value);
      inputRef.current?.blur();
      return;
    }

    const arrowKeys: Record<string, "up" | "down" | "left" | "right"> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };

    if (arrowKeys[e.key] && onArrowKey) {
      const direction = arrowKeys[e.key];
      const textarea = e.target as HTMLTextAreaElement;
      const isAtBoundary =
        (direction === "left" && textarea.selectionStart === 0) ||
        (direction === "right" &&
          textarea.selectionEnd === textarea.value.length) ||
        (direction === "up" && textarea.selectionStart === 0) ||
        (direction === "down" &&
          textarea.selectionEnd === textarea.value.length);

      if (isAtBoundary) {
        e.preventDefault();
        onChange(editValue);
        if (onStopEditing) {
          onStopEditing();
        }
        onArrowKey(direction);
      }
    }
  };

  return (
    <>
      <div
        className={`w-full px-1.5 py-1 text-xs text-gray-900 leading-normal ${className}`}
        style={{
          lineHeight: "1.5",
          margin: 0,
          height: "24px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          visibility: isEditing ? "hidden" : "visible",
        }}
      >
        {value}
      </div>

      {isEditing && (
        <textarea
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`absolute inset-0 min-h-[24px] px-1.5 py-1 outline-none resize-none bg-white text-xs text-gray-900 leading-normal border-2 border-blue-500 ${className}`}
          style={{
            lineHeight: "1.5",
            margin: 0,
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            minHeight: "100%",
            overflow: "auto",
            zIndex: 1,
          }}
          placeholder=""
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            const newHeight = Math.min(target.scrollHeight, 200);
            target.style.height = `${newHeight}px`;
            target.style.overflowY = target.scrollHeight > 200 ? "auto" : "hidden";
          }}
        />
      )}
    </>
  );
}
