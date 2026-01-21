/**
 * Validates workspace ID format
 * Workspace IDs should be exactly 16 characters and contain only alphanumeric characters
 * Format: 16 alphanumeric characters (A-Z, a-z, 0-9)
 * Example: "wspyLvjZmXhoNExBN"
 */
export function isValidWorkspaceId(id: string | undefined | null): boolean {
  if (!id) {
    return false;
  }

  // Must be exactly 16 characters
  if (id.length !== 16) {
    return false;
  }

  // Must contain only alphanumeric characters (A-Z, a-z, 0-9)
  const alphanumericRegex = /^[A-Za-z0-9]+$/;
  return alphanumericRegex.test(id);
}

/**
 * Workspace ID validation regex pattern
 */
export const WORKSPACE_ID_PATTERN = /^[A-Za-z0-9]{16}$/;

/**
 * Workspace ID validation error message
 */
export const WORKSPACE_ID_ERROR_MESSAGE =
  "Workspace ID must be exactly 16 alphanumeric characters";
