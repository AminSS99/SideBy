import { describe, expect, it } from "vitest";
import { safeHref } from "../safe-url";

describe("safeHref", () => {
  it("keeps http(s) links", () => {
    expect(safeHref("https://example.com/a?b=1")).toBe("https://example.com/a?b=1");
    expect(safeHref("http://example.com")).toBe("http://example.com");
  });
  it("drops script, data, relative and empty values", () => {
    for (const bad of ["javascript:alert(1)", " JaVaScRiPt:alert(1)", "data:text/html,<script>1</script>", "vbscript:x", "#", "/x", "", null, undefined]) {
      expect(safeHref(bad as string | null | undefined)).toBeUndefined();
    }
  });
});
