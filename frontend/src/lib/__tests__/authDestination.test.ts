import { describe, expect, it } from "vitest";
import { authDestination } from "../authDestination";

describe("authentication destination", () => {
  it.each(["/app", "/app/settings", "/app/comparisons?q=iPhone%20vs%20Pixel#sources"])("preserves %s", (path) => {
    expect(authDestination(path)).toBe(path);
  });
  it.each([null, "https://example.com/app", "//example.com/app", "/application", "/app/../../auth/sign-in", "/app\\..\\auth", "/app\n/settings"])("rejects destinations outside app routes: %s", (path) => {
    expect(authDestination(path)).toBe("/app");
  });
});
