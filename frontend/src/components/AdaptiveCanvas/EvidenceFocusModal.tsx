import React, { useMemo } from "react";
import {
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { ComparisonFact, ComparisonSource, Entity } from "@/components/Comparison/types";

export type FocusedEvidenceItem = {
  kind: "fact" | "source";
  fact?: ComparisonFact;
  source?: ComparisonSource;
  categoryName?: string;
  dimensionSubject?: string;
};

interface EvidenceFocusModalProps {
  item: FocusedEvidenceItem | null;
  entities: { a: Entity; b: Entity };
  sources?: readonly ComparisonSource[];
  isOpen: boolean;
  onClose: () => void;
}

function isValidHttpUrl(urlStr?: string | null): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  try {
    const parsed = new URL(urlStr.trim());
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

function formatHumanDate(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export const EvidenceFocusModal: React.FC<EvidenceFocusModalProps> = ({
  item,
  entities,
  sources = [],
  isOpen,
  onClose,
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Match the fact's citation URL against actual comparison source inventory
  const resolvedSource = useMemo((): ComparisonSource | null => {
    if (!item) return null;
    if (item.source) return item.source;
    if (!item.fact) return null;

    const rawUrl = item.fact.sourceUrl?.trim();
    if (!rawUrl || rawUrl === "#") return null;

    if (!isValidHttpUrl(rawUrl)) return null;

    try {
      const parsedFactUrl = new URL(rawUrl);
      const match = sources.find((s) => {
        try {
          const parsed = new URL(s.url);
          return (
            parsed.host.toLowerCase() === parsedFactUrl.host.toLowerCase() &&
            parsed.pathname === parsedFactUrl.pathname
          );
        } catch {
          return s.url === rawUrl;
        }
      });
      return match || null;
    } catch {
      return sources.find((s) => s.url === rawUrl) || null;
    }
  }, [item, sources]);

  if (!item) return null;

  const fact = item.fact;
  const citationUrl = fact?.sourceUrl || resolvedSource?.url || null;
  const isWebCitation = isValidHttpUrl(citationUrl);

  const sourceTitle =
    resolvedSource?.title ||
    fact?.sourceTitle ||
    (fact?.source && fact.source !== "#" ? fact.source : "Attributed source record");

  const reliabilityTier = resolvedSource?.reliability ?? null;
  const fetchedAtDate = resolvedSource?.fetchedAt ?? null;
  const entity = fact ? entities[fact.entity] : null;

  const content = (
    <div className="space-y-6 p-4 sm:p-6 text-[#fdfbf7]">
      {/* Entity attribution header */}
      {entity && (
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white shadow"
            style={{ backgroundColor: entity.hex || "#f97316" }}
          >
            {entity.mark}
          </div>
          <div>
            <div className="text-xs font-semibold text-white/90">
              Claim regarding {entity.name}
            </div>
            <div className="text-[11px] text-white/50">{entity.subtitle}</div>
          </div>
        </div>
      )}

      {/* Main Fact Value / Claim statement */}
      {fact && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
              {fact.label}
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/70">
                <Layers className="h-3 w-3 text-white/40" />
                {item.categoryName || "General"}
              </span>
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${
                  fact.freshness === "Fresh"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : fact.freshness === "Monitor"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                }`}
              >
                {fact.freshness}
              </span>
            </div>
          </div>
          <p className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-white/90">
            {fact.value}
          </p>
        </div>
      )}

      {/* Source Citation & Lineage */}
      <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">
          <FileText className="h-3.5 w-3.5 text-white/40" />
          Citation Lineage
        </div>
        <div className="space-y-2 text-xs">
          <div className="font-medium text-white/90">{sourceTitle}</div>
          {isWebCitation && citationUrl ? (
            <a
              href={citationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 break-all text-xs text-orange-400 hover:text-orange-300 hover:underline"
            >
              <span>{citationUrl}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : (
            <span className="text-white/40 italic flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-white/30" />
              No retrievable HTTP(S) citation recorded
            </span>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-white/50 border-t border-white/5">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              {reliabilityTier ? `${reliabilityTier} source` : "Unclassified tier"}
            </span>
            {fetchedAtDate ? (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-white/40" />
                Retrieved {formatHumanDate(fetchedAtDate)}
              </span>
            ) : (
              <span className="text-white/30 italic">Retrieval date not recorded</span>
            )}
          </div>
        </div>
      </div>

      {/* Support Score Clarification */}
      {fact && typeof fact.confidence === "number" && (
        <div className="rounded-lg border border-white/5 bg-white/[0.015] p-3 text-xs text-white/60 space-y-1">
          <div className="flex items-center justify-between text-white/80">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              Evidence Support Score
            </span>
            <span className="font-semibold text-white/95">
              {Math.round(fact.confidence * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Support scores reflect citation strength and concordance across crawled documentation, strictly not absolute probability of truth.
          </p>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="border-white/10 bg-[#0d0b0a] text-white max-h-[85vh]">
          <DrawerHeader className="border-b border-white/10 pb-3 text-left">
            <DrawerTitle className="font-serif text-lg text-[#fffaf1]">
              Evidence Attribution
            </DrawerTitle>
            <DrawerDescription className="text-xs text-white/50">
              Inspect original claims, sources, and support ratings.
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto">{content}</div>
          <div className="p-4 border-t border-white/10">
            <Button
              variant="outline"
              className="w-full border-white/10 text-white hover:bg-white/10"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl border-white/10 bg-[#0d0b0a] text-white shadow-2xl">
        <DialogHeader className="border-b border-white/10 pb-4 text-left">
          <DialogTitle className="font-serif text-xl text-[#fffaf1]">
            Evidence Attribution
          </DialogTitle>
          <DialogDescription className="text-xs text-white/50">
            Inspect original claims, sources, and support ratings.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
