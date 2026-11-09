import { describe, expect, it } from "vitest";
import { httpUrlOrNull } from "../safe-url.js";

describe("httpUrlOrNull", () => {
  it("keeps http(s) URLs", () => {
    expect(httpUrlOrNull("https://example.com/x")).toBe("https://example.com/x");
  });
  it("rejects script/data schemes, junk, non-strings and oversized values", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "ftp://x.com", "not a url", "", null, undefined, 5, "https://x.com/" + "a".repeat(2100)]) {
      expect(httpUrlOrNull(bad)).toBeNull();
    }
  });
});
