/**
 * Generate a random base ID similar to Airtable format
 * Format: "app" prefix + exactly 16 alphanumeric characters (A-Z, a-z, 0-9)
 * Example: "appy6Yk48lHrfTXLD"
 */
export function generateBaseId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "app";
  const length = 16; // Must be exactly 16 characters after "app" prefix
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}
