/**
 * Generate a random table ID similar to Airtable format
 * Format: "tbl" prefix + exactly 16 alphanumeric characters (A-Z, a-z, 0-9)
 * Example: "tblCNUmC5MzTCpueG"
 */
export function generateTableId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "tbl";
  const length = 16; // Must be exactly 16 characters after "tbl" prefix
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}
