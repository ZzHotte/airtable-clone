import { nanoid } from "nanoid";

/**
 * 生成稳定的 Column ID
 * 格式: col_${nanoid()}
 * 示例: col_V1StGXR8_Z5jdHi6B-myT
 */
export function genColumnId(): string {
  return `col_${nanoid()}`;
}

/**
 * 生成稳定的 Row ID
 * 格式: row_${nanoid()}
 * 示例: row_V1StGXR8_Z5jdHi6B-myT
 */
export function genRowId(): string {
  return `row_${nanoid()}`;
}
