// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  Activity,
  BookOpenCheck,
  Bot,
  ChartNoAxesCombined,
  Check,
  FileCheck2,
  GitCompare,
  GitCompareArrows,
  Scale,
  SearchCheck,
  Sparkles,
  WandSparkles,
} from "../index";

describe("SideBy bespoke & Phosphor icon system", () => {
  it("renders all 10 bespoke editorial icons with aria-hidden and custom sizes", () => {
    const bespoke = [
      BookOpenCheck,
      Bot,
      ChartNoAxesCombined,
      FileCheck2,
      GitCompare,
      GitCompareArrows,
      Scale,
      SearchCheck,
      Sparkles,
      WandSparkles,
    ];

    for (const Icon of bespoke) {
      const { container, unmount } = render(<Icon size={20} strokeWidth={1.8} className="text-sky-400" />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
      expect(svg?.getAttribute("width")).toBe("20");
      expect(svg?.getAttribute("height")).toBe("20");
      unmount();
    }
  });

  it("renders wrapped Phosphor duotone and bold UI icons", () => {
    const { container: c1, unmount: u1 } = render(<Activity size={16} />);
    const svg1 = c1.querySelector("svg");
    expect(svg1).not.toBeNull();
    u1();

    const { container: c2, unmount: u2 } = render(<Check size={16} strokeWidth={2.25} />);
    const svg2 = c2.querySelector("svg");
    expect(svg2).not.toBeNull();
    u2();
  });
});
