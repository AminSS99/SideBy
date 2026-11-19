// @vitest-environment jsdom
import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Activity, ShieldCheck, Sparkles } from "@/components/icons";
import { HoldButton } from "../hold-button";
import { SmoothTab } from "../smooth-tab";
import { ShimmerText } from "../shimmer-text";
import { ParticleButton } from "../particle-button";
import { CardFlip } from "../card-flip";
import { BentoSpotlight } from "../bento-spotlight";

describe("KokonutUI Obsidian Pack (6 new components)", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("HoldButton cancels on early release and confirms after full hold duration (mouse & keyboard)", () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn();

    render(
      <HoldButton
        onConfirm={onConfirm}
        holdDuration={600}
        holdingLabel="Keep holding..."
        confirmedLabel="Confirmed"
      >
        Hold to delete
      </HoldButton>
    );

    const button = screen.getByRole("button");
    expect(button.textContent).toContain("Hold to delete");

    // Release too early: should NOT confirm
    fireEvent.mouseDown(button, { button: 0 });
    expect(button.getAttribute("data-holding")).toBe("true");
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.mouseUp(button);
    expect(button.getAttribute("data-holding")).toBe("false");
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onConfirm).not.toHaveBeenCalled();

    // Hold full duration with mouse: should confirm once
    fireEvent.mouseDown(button, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(button.getAttribute("data-confirmed")).toBe("true");
    expect(button.textContent).toContain("Confirmed");

    // Keyboard Space hold: should confirm again
    fireEvent.keyDown(button, { key: " " });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    fireEvent.keyUp(button, { key: " " });
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it("SmoothTab switches active tab via click and keyboard arrow navigation", () => {
    const onChangeSpy = vi.fn();

    function ControlledTabs() {
      const [active, setActive] = useState<"overview" | "matrix" | "sources">("overview");
      return (
        <SmoothTab
          ariaLabel="Comparison sections"
          layoutId="test-smooth-tab"
          mobileGridCols={3}
          value={active}
          onValueChange={(next) => {
            setActive(next);
            onChangeSpy(next);
          }}
          items={[
            { id: "overview", label: "Overview", icon: Activity, tabId: "tab-overview" },
            { id: "matrix", label: "Matrix", icon: ShieldCheck, tabId: "tab-matrix" },
            { id: "sources", label: "Sources", icon: Sparkles, tabId: "tab-sources" },
          ]}
        />
      );
    }

    render(<ControlledTabs />);

    const overviewTab = screen.getByRole("tab", { name: "Overview" });
    const matrixTab = screen.getByRole("tab", { name: "Matrix" });
    const sourcesTab = screen.getByRole("tab", { name: "Sources" });

    expect(overviewTab.getAttribute("aria-selected")).toBe("true");
    expect(matrixTab.getAttribute("aria-selected")).toBe("false");

    // Click to switch
    fireEvent.click(matrixTab);
    expect(onChangeSpy).toHaveBeenCalledWith("matrix");
    expect(matrixTab.getAttribute("aria-selected")).toBe("true");
    expect(overviewTab.getAttribute("aria-selected")).toBe("false");

    // ArrowRight moves to next tab
    fireEvent.keyDown(matrixTab, { key: "ArrowRight" });
    expect(onChangeSpy).toHaveBeenCalledWith("sources");
    expect(sourcesTab.getAttribute("aria-selected")).toBe("true");
  });

  it("CardFlip toggles front and back faces via click, Enter, and Space with aria-pressed", () => {
    const onFlipChange = vi.fn();

    render(
      <CardFlip
        ariaLabel="Feature proof card"
        onFlipChange={onFlipChange}
        front={<div>Front Overview</div>}
        back={<div>Back Proof Detail</div>}
      />
    );

    const card = screen.getByRole("button", { name: "Feature proof card" });
    expect(card.getAttribute("aria-pressed")).toBe("false");
    expect(card.getAttribute("data-flipped")).toBe("false");

    // Click toggles to back
    fireEvent.click(card);
    expect(card.getAttribute("aria-pressed")).toBe("true");
    expect(card.getAttribute("data-flipped")).toBe("true");
    expect(onFlipChange).toHaveBeenLastCalledWith(true);

    // Enter toggles back to front
    fireEvent.keyDown(card, { key: "Enter" });
    expect(card.getAttribute("aria-pressed")).toBe("false");
    expect(onFlipChange).toHaveBeenLastCalledWith(false);

    // Space toggles to back again
    fireEvent.keyDown(card, { key: " " });
    expect(card.getAttribute("aria-pressed")).toBe("true");
    expect(onFlipChange).toHaveBeenLastCalledWith(true);
  });

  it("ShimmerText renders warm metallic editorial text with custom element tag", () => {
    render(
      <ShimmerText as="p" tone="amber" duration={2.8}>
        Workspace Intelligence
      </ShimmerText>
    );

    const text = screen.getByText("Workspace Intelligence");
    expect(text.tagName).toBe("P");
    expect(text.className).toContain("kokonut-shimmer-text");
  });

  it("ParticleButton triggers click handler for button and router link modes", () => {
    const onClick = vi.fn();
    render(
      <MemoryRouter>
        <div>
          <ParticleButton onClick={onClick} tone="ember">
            Refresh Evidence
          </ParticleButton>
          <ParticleButton to="/pricing" tone="rose">
            Upgrade Plan
          </ParticleButton>
        </div>
      </MemoryRouter>
    );

    const actionButton = screen.getByRole("button", { name: "Refresh Evidence" });
    fireEvent.click(actionButton);
    expect(onClick).toHaveBeenCalledTimes(1);

    const ctaLink = screen.getByRole("link", { name: "Upgrade Plan" });
    expect(ctaLink.getAttribute("href")).toBe("/pricing");
    fireEvent.click(ctaLink);
  });

  it("BentoSpotlight renders children and updates --spot-x / --spot-y CSS variables via rAF", () => {
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      });

    const { container } = render(
      <BentoSpotlight tone="amber" data-testid="bento-card">
        <span>Metric Value</span>
      </BentoSpotlight>
    );

    expect(screen.getByText("Metric Value")).toBeTruthy();
    const card = container.querySelector('[data-testid="bento-card"]') as HTMLElement;
    expect(card).not.toBeNull();

    vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
      left: 10,
      top: 20,
      width: 300,
      height: 180,
      right: 310,
      bottom: 200,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    });

    fireEvent.mouseMove(card, { clientX: 110, clientY: 70 });
    expect(rafSpy).toHaveBeenCalled();
    expect(card.style.getPropertyValue("--spot-x")).toBe("100px");
    expect(card.style.getPropertyValue("--spot-y")).toBe("50px");
  });
});
