import { isValidWorkspaceId } from "./workspace-id-validator";

/**
 * Generate a random workspace ID similar to Airtable format
 * Format: exactly 16 alphanumeric characters (A-Z, a-z, 0-9)
 * Example: "wspyLvjZmXhoNExBN"
 */
export function generateWorkspaceId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const length = 16; // Must be exactly 16 characters
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Verify the generated ID is valid (should always be true, but good for safety)
  if (!isValidWorkspaceId(result)) {
    // This should never happen, but if it does, regenerate
    return generateWorkspaceId();
  }
  
  return result;
}
