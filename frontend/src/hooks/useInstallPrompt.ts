import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface InstallPromptState {
  /** True only while a native install prompt is available and app not installed. */
  canInstall: boolean;
  /** True when manual installation guidance is appropriate (e.g. iOS Safari without native prompt). */
  canInstallManual: boolean;
  /** Already running as an installed PWA. */
  isStandalone: boolean;
  /** Whether the user accepted the prompt in the current session. */
  promptOutcome: "idle" | "accepted" | "dismissed";
  /** Browser supports the beforeinstallprompt flow at all. */
  isSupported: boolean;
  /** True if running on an iOS / iPadOS device. */
  isIosDevice: boolean;
  isPrompting: boolean;
  promptInstall: () => Promise<void>;
  showManualGuide: boolean;
  setShowManualGuide: (show: boolean) => void;
}

const readStandalone = (): boolean => {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return (
    iosStandalone ||
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: minimal-ui)").matches
  );
};

const detectIosDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isAppleTouch =
    /iPhone|iPad|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  return isAppleTouch;
};

/**
 * Exposes capability-aware PWA installation state.
 * - Distinguishes between native prompt support and iOS manual "Add to Home Screen" help.
 * - Separates user prompt acceptance from verified standalone display mode.
 */
export function useInstallPrompt(): InstallPromptState {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(readStandalone);
  const [isPrompting, setIsPrompting] = useState(false);
  const [promptOutcome, setPromptOutcome] = useState<"idle" | "accepted" | "dismissed">("idle");
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [isIosDevice] = useState<boolean>(detectIosDevice);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferredEvent(null);
      setPromptOutcome("accepted");
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const mediaQueries = ["(display-mode: standalone)", "(display-mode: minimal-ui)"];
    const listeners = mediaQueries
      .map((query) => window.matchMedia(query))
      .filter(Boolean)
      .map((mq) => {
        const handler = () => setIsStandalone(readStandalone());
        mq.addEventListener?.("change", handler);
        return { mq, handler };
      });

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      for (const { mq, handler } of listeners) {
        mq.removeEventListener?.("change", handler);
      }
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredEvent && !isPrompting) {
      setIsPrompting(true);
      try {
        await deferredEvent.prompt();
        const choice = await deferredEvent.userChoice;
        setDeferredEvent(null);
        if (choice.outcome === "accepted") {
          setPromptOutcome("accepted");
          toast.success("Installation started", {
            description: "SideBy is installing to your home screen or apps folder.",
          });
        } else {
          setPromptOutcome("dismissed");
        }
      } catch {
        toast.error("Installation was interrupted.", {
          description: "You can retry from your browser menu.",
        });
      } finally {
        setIsPrompting(false);
      }
      return;
    }

    if (isIosDevice && !isStandalone) {
      setShowManualGuide(true);
    }
  }, [deferredEvent, isPrompting, isIosDevice, isStandalone]);

  const canInstall = !!deferredEvent && !isStandalone;
  const canInstallManual = !canInstall && isIosDevice && !isStandalone;

  return {
    canInstall,
    canInstallManual,
    isStandalone,
    promptOutcome,
    isSupported:
      typeof window !== "undefined" &&
      ("onbeforeinstallprompt" in window || deferredEvent !== null || isIosDevice),
    isIosDevice,
    isPrompting,
    promptInstall,
    showManualGuide,
    setShowManualGuide,
  };
}
