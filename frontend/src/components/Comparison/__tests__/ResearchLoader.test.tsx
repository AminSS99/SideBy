// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, act } from "@testing-library/react";
vi.mock("@gsap/react", () => ({ useGSAP: () => {} }));
vi.mock("@/components/ui/animated-circular-progress-bar", () => ({ AnimatedCircularProgressBar: () => null }));
vi.mock("@/components/ui/border-beam", () => ({ BorderBeam: () => null }));
vi.mock("@/components/ui/animated-list", () => ({ AnimatedList: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
import { ResearchLoader } from "../ResearchLoader";
afterEach(() => { cleanup(); vi.useRealTimers(); });

it("waits for recorded activity instead of inventing research events", () => {
  Element.prototype.scrollTo = vi.fn();
  const { container } = render(<ResearchLoader query="React vs Vue" progress={60} activeStep={0} steps={[]} />);
  expect(container.textContent).not.toMatch(/Initializing deep|Routing query|Parsing DOM/);
  expect(screen.getByText(/Waiting for the next recorded research update/)).toBeTruthy();
});

it("renders complete server activity messages without dropping characters", async () => {
  vi.useFakeTimers();
  Element.prototype.scrollTo = vi.fn();
  render(<ResearchLoader query="React vs Vue" progress={60} activeStep={0} steps={[]} activity={[{
    id: "step-1", task: "facts", stepName: "extract", status: "running", startedAt: "2026-11-06T08:00:00Z", completedAt: null,
    durationMs: null, inputSummary: "Reading official docs", outputSummary: null, error: null,
  }]} />);
  await act(async () => { vi.advanceTimersByTime(2000); });
  expect(screen.getByText("facts/extract: Reading official docs")).toBeTruthy();
});
