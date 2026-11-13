import { useEffect, useState } from "react";
import { RefreshCw, X } from "@/components/icons";
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

  // Common case (nothing to preserve): one compact row, so on phones it never
  // stacks with the cookie notice over the main form.
  if (!isDirty && !saveFailed) {
    return (
      <div
        role="alert"
        className="flex w-full max-w-sm items-center gap-2 rounded-2xl border border-orange-500/25 bg-[#0c0b0a]/96 py-1.5 pl-3.5 pr-1.5 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <p className="min-w-0 flex-1 text-xs font-medium text-[#fdfbf7]/85">New version available</p>
        <button
          type="button"
          disabled={isUpdating || isDiscarding}
          onClick={() => void handleApplyUpdate()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-3.5 text-xs font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-[0.99] disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isUpdating ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <button
          type="button"
          aria-label="Dismiss update prompt"
          onClick={() => {
            pwaUpdates.dismissUpdate();
            setNeedRefresh(false);
          }}
          disabled={isUpdating || isDiscarding}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[#fdfbf7]/70 transition-colors hover:bg-white/5 hover:text-[#fdfbf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="w-full max-w-sm rounded-2xl border border-orange-500/25 bg-[#0c0b0a]/96 p-4 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#fdfbf7]">New version available</p>
          <p className="mt-1 text-xs leading-relaxed text-[#fdfbf7]/75">
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
          disabled={isUpdating || isDiscarding}
          className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[#fdfbf7]/70 transition-colors hover:bg-white/5 hover:text-[#fdfbf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        disabled={isUpdating || isDiscarding}
        onClick={() => void handleApplyUpdate()}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-[0.99] disabled:opacity-60 motion-reduce:transition-none"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isUpdating ? "animate-spin" : ""}`} />
        {isUpdating ? "Updating..." : saveFailed ? "Retry save & update" : isDirty ? "Save draft & update" : "Refresh now"}
      </button>
      {saveFailed && (
        <button
          type="button"
          disabled={isUpdating || isDiscarding}
          onClick={() => void handleDiscardAndUpdate()}
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-bold uppercase tracking-wider text-[#fdfbf7]/80 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-60"
        >
          {isDiscarding ? "Refreshing..." : "Discard draft & refresh"}
        </button>
      )}
    </div>
  );
}
