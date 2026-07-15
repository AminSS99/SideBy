import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, ExternalLink, Share2, X } from "lucide-react";
import { buildShareUrl } from "@/config/brand";
import { buildApiUrl } from "@/config/env";
import { apiFetch } from "@/lib/api";
import { copyText } from "@/lib/clipboard";

interface ShareModalProps {
  opens: boolean;
  onClose: () => void;
  entityA: string;
  entityB: string;
  slug?: string | null;
  comparisonId?: string | null;
}

const resolveShareUrl = (slug?: string | null) => {
  const safeSlug = slug?.replace(/^\/+/, "") || "comparison";
  if (typeof window !== "undefined" && window.location.hostname !== "sideby.ink") {
    return `${window.location.origin}/compare/${safeSlug}`;
  }

  return buildShareUrl(safeSlug);
};

const ShareModal = ({ opens, onClose, entityA, entityB, slug, comparisonId }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const url = resolveShareUrl(slug);

  const publish = useCallback(async () => {
    if (!comparisonId) {
      return true;
    }

    try {
      setIsPublishing(true);
      setPublishError(null);
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${comparisonId}/publish`), {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Unable to publish this comparison.");
      }
      return true;
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Unable to publish this comparison.");
      return false;
    } finally {
      setIsPublishing(false);
    }
  }, [comparisonId]);

  const copy = useCallback(async () => {
    const published = await publish();
    if (!published) {
      return;
    }

    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setPublishError("Clipboard permission is blocked. Select and copy the URL manually.");
    }
  }, [publish, url]);

  const open = useCallback(async () => {
    const published = await publish();
    if (published) {
      window.open(url, "_blank");
    }
  }, [publish, url]);

  return (
    <AnimatePresence>
      {opens && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-6 shadow-2xl shadow-purple-500/5"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-lg text-white">Share Comparison</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">
                Public URL
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-white/[0.04] px-3 py-2 text-xs text-white/60 font-mono">
                  {url}
                </code>
                <button
                  onClick={copy}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] transition-all hover:border-purple-500/30 hover:bg-purple-500/[0.06]"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-white/40" />
                  )}
                </button>
              </div>
              {copied && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-[10px] font-bold text-emerald-400/80"
                >
                  Copied to clipboard
                </motion.p>
              )}
              {publishError && (
                <p className="mt-2 text-[10px] font-bold text-red-300">
                  {publishError}
                </p>
              )}
            </div>

            <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.01] p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">
                Preview
              </p>
              <div className="rounded-lg border border-white/[0.04] bg-[#050505] p-3">
                <p className="mb-1 font-serif text-sm text-white">
                  {entityA}
                  <span className="mx-1.5 text-[10px] italic text-white/20">vs</span>
                  {entityB}
                </p>
                <p className="text-[10px] text-white/25">
                  SideBy · Source-backed comparison engine
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/[0.06] bg-transparent py-2.5 text-xs font-bold uppercase tracking-widest text-white/40 transition-colors hover:border-white/15 hover:text-white/70"
              >
                Close
              </button>
              <button
                onClick={() => {
                  void open();
                }}
                disabled={isPublishing}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-white/90"
              >
                {isPublishing ? "Publishing..." : "Open"}
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ShareButton = ({
  entityA,
  entityB,
  slug,
  comparisonId,
  className,
}: {
  entityA: string;
  entityB: string;
  slug: string;
  comparisonId?: string | null;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/50 transition-all hover:border-purple-500/20 hover:bg-purple-500/[0.04] hover:text-purple-300 ${className || ""}`}
      >
        <Share2 className="h-3 w-3" />
        Share
      </button>
      <ShareModal
        opens={open}
        onClose={() => setOpen(false)}
        entityA={entityA}
        entityB={entityB}
        slug={slug}
        comparisonId={comparisonId}
      />
    </>
  );
};

export default ShareModal;
