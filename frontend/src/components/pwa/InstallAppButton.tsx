import { Download, LoaderCircle, Smartphone } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { IosInstallGuideModal } from "@/components/pwa/IosInstallGuideModal";

/**
 * "Install SideBy" button:
 * - Triggers native browser install prompt when available (Chrome, Edge, Android).
 * - Opens clear, verified iOS Safari "Add to Home Screen" instructions on iPhones/iPads.
 * - Hides automatically when already running in standalone PWA mode.
 */
export function InstallAppButton() {
  const {
    canInstall,
    canInstallManual,
    isPrompting,
    promptInstall,
    showManualGuide,
    setShowManualGuide,
  } = useInstallPrompt();

  if (!canInstall && !canInstallManual) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => void promptInstall()}
        disabled={isPrompting}
        aria-label="Install SideBy application"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-orange-300/25 bg-orange-400/10 px-5 text-xs font-bold uppercase tracking-widest text-orange-200 transition hover:border-orange-300/50 hover:bg-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPrompting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : canInstallManual ? (
          <Smartphone className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Install SideBy
      </button>

      <IosInstallGuideModal
        open={showManualGuide}
        onClose={() => setShowManualGuide(false)}
      />
    </>
  );
}
