/**
 * URL-safe, reversible encoding used to hide raw resource ids in the frontend URL.
 * The backend always receives the decoded id.
 */
export function encodeId(id: string): string {
  return btoa(id).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeId(encoded: string): string {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    return atob(padded);
  } catch {
    return encoded;
  }
}