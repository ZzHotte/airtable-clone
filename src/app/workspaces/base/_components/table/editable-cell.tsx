"use client";

import { useState, useRef, useEffect } from "react";

type ColumnType = "text" | "number";

type EditableCellProps = {
  value: string | number | null;
  columnType: ColumnType;
  onChange: (value: string | number | null) => void;
  isEditing?: boolean;
  onStopEditing?: () => void;
  onArrowKey?: (direction: "up" | "down" | "left" | "right") => void;
  placeholder?: string;
  className?: string;
};

export function EditableCell({
  value,
  columnType,
  onChange,
  isEditing = false,
  onStopEditing,
  onArrowKey,
  placeholder = "",
  className = "",
}: EditableCellProps) {
  const valueToString = (val: string | number | null): string => {
    if (val === null || val === undefined) return "";
    return String(val);
  };

  const [editValue, setEditValue] = useState(() => valueToString(value));
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isEditingRef = useRef(isEditing);
  const lastSyncedValueRef = useRef<string>(valueToString(value));

  // Update ref when isEditing changes
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  // Only sync value prop to editValue when:
  // 1. Not currently editing (user finished editing)
  // 2. Value changed externally (not from our own input)
  useEffect(() => {
    // Don't update if user is currently editing - this prevents input interruption
    if (isEditingRef.current) {
      // Still update the ref so we know what the external value is
      lastSyncedValueRef.current = valueToString(value);
      return;
    }
    
    const newValueStr = valueToString(value);
    // Only update if value actually changed and it's different from what we have
    if (newValueStr !== editValue && newValueStr !== lastSyncedValueRef.current) {
      setEditValue(newValueStr);
      lastSyncedValueRef.current = newValueStr;
    }
  }, [value, editValue]);

  useEffect(() => {
    if (isEditing) {
      const currentRef = columnType === "number" ? inputRef.current : textareaRef.current;
      if (currentRef) {
        requestAnimationFrame(() => {
          if (currentRef) {
            currentRef.focus();
            const start = currentRef.selectionStart;
            const end = currentRef.selectionEnd;
            if (start === end && currentRef.value.length > 0) {
              currentRef.setSelectionRange(0, currentRef.value.length);
            }
          }
        });
      }
    }
  }, [isEditing, columnType]);

  const handleBlur = () => {
    let processedValue: string | number | null = editValue;
    
    if (columnType === "number") {
      if (editValue.trim() === "") {
        processedValue = null;
      } else {
        const numValue = parseFloat(editValue);
        processedValue = isNaN(numValue) ? null : numValue;
      }
    } else {
      processedValue = editValue;
    }
    
    // Only call onChange if value actually changed (avoid unnecessary updates)
    const currentValueStr = valueToString(value);
    const newValueStr = valueToString(processedValue);
    
    if (currentValueStr !== newValueStr) {
      // Update ref to track what we just synced
      lastSyncedValueRef.current = newValueStr;
      onChange(processedValue);
    }
    
    if (onStopEditing) {
      onStopEditing();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    let newValue = e.target.value;
    
    if (columnType === "number") {
      if (newValue === "") {
        setEditValue("");
        return;
      }
      
      const filtered = newValue.replace(/[^\d.-]/g, "");
      
      const parts = filtered.split(".");
      if (parts.length > 2) {
        newValue = parts[0] + "." + parts.slice(1).join("");
      } else {
        newValue = filtered;
      }
      
      if (newValue.includes("-") && !newValue.startsWith("-")) {
        newValue = newValue.replace(/-/g, "");
        if (newValue.length > 0) {
          newValue = "-" + newValue;
        }
      }
    }
    
    setEditValue(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    // Handle Enter key
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      
      // For textarea, Shift+Enter creates new line, Enter alone should save and move down
      // For input (number), Enter always saves and moves down
      if (columnType === "text" && e.shiftKey) {
        // Shift+Enter: allow new line in textarea (default behavior)
        return;
      }
      
      // Save current value first (this will trigger onChange and onStopEditing)
      const currentRef = columnType === "number" ? inputRef.current : textareaRef.current;
      if (currentRef) {
        currentRef.blur();
      }
      
      // Then move to next row (down) if onArrowKey is provided
      // This matches Excel/Airtable behavior: Enter saves and moves down
      if (onArrowKey) {
        // Small delay to ensure blur and save complete before navigation
        requestAnimationFrame(() => {
          onArrowKey("down");
        });
      }
      return;
    }
    
    // Handle Escape key
    if (e.key === "Escape") {
      setEditValue(valueToString(value));
      (columnType === "number" ? inputRef.current : textareaRef.current)?.blur();
      return;
    }

    // Note: Delete/Backspace are handled normally by handleChange
    // They don't trigger boundary checks, so they won't cause cell navigation

    if (columnType === "number") {
      const allowedKeys = [
        "Backspace", "Delete", "Tab", "Escape", "Enter",
        "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Home", "End", "Clear"
      ];
      
      if (e.ctrlKey || e.metaKey) {
        return;
      }
      
      if (!allowedKeys.includes(e.key) && !/[0-9.-]/.test(e.key)) {
        e.preventDefault();
        setShowError(true);
        setTimeout(() => setShowError(false), 2000);
        return;
      }
    }

    const arrowKeys: Record<string, "up" | "down" | "left" | "right"> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      Tab: "right", 
    };

    if (arrowKeys[e.key] && onArrowKey) {
      const direction = arrowKeys[e.key];
      const input = e.target as HTMLTextAreaElement | HTMLInputElement;
      
      let isAtBoundary = false;
      
      if (direction === "left") {
        isAtBoundary = true;
      } else if (direction === "right") {
        const selectionEnd = input.selectionEnd ?? input.value.length;
        isAtBoundary = selectionEnd === input.value.length;
      } else if (direction === "up") {
        if (columnType === "number") {
          isAtBoundary = true;
        } else {
          const selectionStart = input.selectionStart ?? 0;
          const textBeforeCursor = input.value.substring(0, selectionStart);
          const lineNumber = (textBeforeCursor.match(/\n/g) || []).length;
          isAtBoundary = lineNumber === 0; 
        }
      } else if (direction === "down") {
        if (columnType === "number") {
          isAtBoundary = true; 
        } else {
          const selectionEnd = input.selectionEnd ?? input.value.length;
          const textAfterCursor = input.value.substring(selectionEnd);
          const lineNumber = (textAfterCursor.match(/\n/g) || []).length;
          const totalLines = (input.value.match(/\n/g) || []).length + 1;
          isAtBoundary = lineNumber === totalLines - 1;
        }
      }

      if (isAtBoundary && direction) {
        e.preventDefault();
        // Save current value before moving (only if changed)
        const currentValueStr = valueToString(value);
        const editValueStr = editValue.trim();
        if (currentValueStr !== editValueStr) {
          handleBlur();
        } else {
          // Value unchanged, just stop editing without triggering onChange
          if (onStopEditing) {
            onStopEditing();
          }
        }
        // Use requestAnimationFrame to ensure smooth transition
        requestAnimationFrame(() => {
          onArrowKey(direction);
        });
      }
    }
  };

  const displayValue = valueToString(value);
  const inputClassName = `absolute inset-0 min-h-[24px] px-1.5 py-1 outline-none resize-none bg-white text-xs text-gray-900 leading-normal border-2 border-blue-500 ${className}`;
  const inputStyle: React.CSSProperties = {
    lineHeight: "1.5",
    margin: 0,
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    minHeight: "100%",
    overflow: columnType === "number" ? "hidden" : "auto",
    zIndex: 1,
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
        {displayValue}
      </div>

      {isEditing && (
        <>
          {columnType === "number" ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={editValue}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={inputClassName}
              style={inputStyle}
              placeholder=""
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={inputClassName}
              style={inputStyle}
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
      )}

      {showError && isEditing && columnType === "number" && (
        <div
          className="
            absolute
            left-0
            top-full
            px-2 py-1
            text-xs
            text-gray-700
            bg-white
            border
            border-gray-300
            rounded
            shadow-md
            z-50
            whitespace-nowrap
          "
          style={{ pointerEvents: "none" }}
        >
          Please enter a number
        </div>
      )}

    </>
  );
}
