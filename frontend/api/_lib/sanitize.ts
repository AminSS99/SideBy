/**
 * Defensive text sanitization for model-generated strings before persistence.
 * React escapes text by default, but exports, JSON consumers, and future rich
 * renderers should never receive raw scriptable markup from an LLM.
 */
export function sanitizeLlmText(value: string, maxLength = 8000): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:.*?\2/gi, "")
    .replace(/<\/?[^>]+>/g, "")
    .replace(
      new RegExp(
        `[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`,
        "g",
      ),
      "",
    )
    .slice(0, maxLength)
    .trim();
}

export function sanitizeLlmStringArray(values: string[], maxItemLength = 1000): string[] {
  return values
    .map((value) => sanitizeLlmText(value, maxItemLength))
    .filter((value) => value.length > 0);
}
