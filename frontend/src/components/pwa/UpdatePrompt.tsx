import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { pwaUpdates } from "@/lib/pwa/register";

/**
 * Shown when a new service worker version is waiting. Activating is explicit:
 * the user clicks "Refresh" which posts SKIP_WAITING and reloads, guaranteeing
 * the app never runs a half-updated shell.
 *
 * If draft preservation fails while the form is dirty, the prompt stays open
 * with a retry option instead of silently discarding input. Discarding is
 * only ever an explicit user choice ("Discard draft & refresh").
 */
export function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(pwaUpdates.needRefresh);
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const isDirty = pwaUpdates.isDirty();

  useEffect(() => {
    return pwaUpdates.onNeedRefresh(() => setNeedRefresh(pwaUpdates.needRefresh));
  }, []);

  if (!needRefresh) return null;

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    setSaveFailed(false);
    const success = await pwaUpdates.applyUpdate();
    if (!success) {
      setIsUpdating(false);
      // applyUpdate only returns false without reloading when preservation
      // failed while dirty (or activation threw) — keep the prompt open.
      setSaveFailed(true);
    }
  };

  const handleDiscardAndUpdate = async () => {
    setIsDiscarding(true);
    const success = await pwaUpdates.forceApplyUpdate();
    if (!success) {
      setIsDiscarding(false);
    }
  };

  return (
    <div
      role="alert"
      className="fixed bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px)+1rem)] left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-orange-500/25 bg-[#0c0b0a]/95 p-4 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-xl lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#fdfbf7]">New version available</p>
          <p className="mt-1 text-xs leading-relaxed text-[#fdfbf7]/55">
            {saveFailed
              ? "SideBy couldn't preserve your draft (browser storage may be blocked). Copy your input or retry before refreshing."
              : isDirty
                ? "You have unsaved input. SideBy will preserve your draft and restore it automatically after reloading."
                : "Refresh to load the latest SideBy experience."}
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss update prompt"
          onClick={() => {
            pwaUpdates.dismissUpdate();
            setNeedRefresh(false);
          }}
          className="rounded-md p-1.5 text-[#fdfbf7]/40 transition-colors hover:bg-white/5 hover:text-[#fdfbf7]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        disabled={isUpdating || isDiscarding}
        onClick={() => void handleApplyUpdate()}
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-60"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isUpdating ? "animate-spin" : ""}`} />
        {isUpdating ? "Updating..." : saveFailed ? "Retry save & update" : isDirty ? "Save draft & update" : "Refresh now"}
      </button>
      {saveFailed && (
        <button
          type="button"
          disabled={isUpdating || isDiscarding}
          onClick={() => void handleDiscardAndUpdate()}
          className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold uppercase tracking-wider text-[#fdfbf7]/70 transition-colors hover:bg-white/10 disabled:opacity-60"
        >
          {isDiscarding ? "Refreshing..." : "Discard draft & refresh"}
        </button>
      )}
    </div>
  );
}
