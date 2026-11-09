/** Returns the value only if it is an http(s) URL; citations come from LLM output and are untrusted. */
export function httpUrlOrNull(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}
