import React, { useEffect } from "react";
import { Share, PlusSquare, X, Smartphone, Sparkles } from "lucide-react";

interface IosInstallGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export function IosInstallGuideModal({ open, onClose }: IosInstallGuideModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
      className="fixed inset-0 z-[110] flex items-end justify-center p-3 sm:items-center sm:p-4"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-orange-500/25 bg-[#0d0b0a]/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-orange-400/25 bg-orange-500/10 text-orange-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 id="ios-install-title" className="font-serif text-lg font-bold text-white">
                Install SideBy on iPhone
              </h2>
              <p className="text-xs text-white/50">Full-screen PWA with instant launch.</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close installation guide"
            onClick={onClose}
            className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
              1
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                Tap the Share button <Share className="h-4 w-4 text-orange-400 shrink-0" />
              </p>
              <p className="mt-0.5 text-xs text-white/55">
                In Safari, tap the Share icon at the bottom of the screen.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
              2
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                Choose Add to Home Screen <PlusSquare className="h-4 w-4 text-orange-400 shrink-0" />
              </p>
              <p className="mt-0.5 text-xs text-white/55">
                Scroll through the share menu and select &ldquo;Add to Home Screen&rdquo;.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
              3
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                Tap Add in the top right <Sparkles className="h-4 w-4 text-orange-400 shrink-0" />
              </p>
              <p className="mt-0.5 text-xs text-white/55">
                SideBy will appear as a standalone app on your home screen.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-white/10 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/15"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
