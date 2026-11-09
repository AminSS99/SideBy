/**
 * Returns the URL only when it is an http(s) link. Source and citation URLs
 * come from search providers and LLM output, so they are untrusted: a
 * `javascript:` or `data:` value must never reach an href.
 */
export function safeHref(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:" ? value : undefined;
  } catch {
    return undefined;
  }
}
