import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Calendar, AlertTriangle, Play, Pause, Trash2, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { ComparisonData } from "./types";
import { panelClass } from "./constants";

type WatchlistRecord = {
  id: string;
  name: string;
  query: string;
  comparisonId: string;
  cadence: "daily" | "weekly" | "monthly";
  alertThreshold: string;
  status: "active" | "paused";
  nextRunAt: string | null;
  lastRunAt: string | null;
};

export const WatchlistPanel = ({
  result,
  comparisonId
}: {
  result: ComparisonData;
  comparisonId: string;
}) => {
  const { session } = useAuth();
  const [activeWatchlist, setActiveWatchlist] = useState<WatchlistRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form options
  const [cadence, setCadence] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [alertThreshold, setAlertThreshold] = useState<number>(0.1); // default 10%

  const fetchWatchlist = async () => {
    if (!session) return;
    try {
      setIsLoading(true);
      const res = await apiFetch(buildApiUrl("/api/watchlists"));
      if (!res.ok) throw new Error("Failed to load watchlists.");
      const data = (await res.json()) as { watchlists: WatchlistRecord[] };
      
      // Find if any watchlist is watching the current comparisonId
      const found = data.watchlists.find((w) => w.comparisonId === comparisonId);
      if (found) {
        setActiveWatchlist(found);
        setCadence(found.cadence);
        setAlertThreshold(Number(found.alertThreshold) || 0.1);
      } else {
        setActiveWatchlist(null);
      }
    } catch (err) {
      console.error("Error loading watchlist state:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      void fetchWatchlist();
    }
  }, [comparisonId, session]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please sign in or create an account to monitor comparisons.");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await apiFetch(buildApiUrl("/api/watchlists"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comparisonId,
          query: result.query,
          name: `Watchlist: ${result.entities.a.name} vs ${result.entities.b.name}`,
          cadence,
          alertThreshold,
        }),
      });

      if (!res.ok) throw new Error("Failed to create watchlist.");
      toast.success("Watchlist created. SideBy is now tracking this comparison.");
      void fetchWatchlist();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error subscribing to watchlist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePauseToggle = async () => {
    if (!activeWatchlist) return;
    try {
      setIsSubmitting(true);
      // Simply call PUT or PATCH to pause.
      const res = await apiFetch(buildApiUrl(`/api/watchlists?id=${activeWatchlist.id}`), {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to update status.");
      toast.success("Watchlist paused.");
      void fetchWatchlist();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error pausing watchlist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!activeWatchlist) return;
    try {
      setIsSubmitting(true);
      const res = await apiFetch(buildApiUrl(`/api/watchlists?id=${activeWatchlist.id}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete watchlist.");
      toast.success("Watchlist removed successfully.");
      setActiveWatchlist(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error removing watchlist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="watchlist-monitor" className={cn(panelClass, "overflow-hidden mb-10 scroll-mt-28")}>
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-[#2a2a2a] flex items-center justify-between gap-4 bg-[#111]">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#1a1a1a] border border-[#333] text-[#fdfbf7]/50">
            {activeWatchlist ? (
              <Eye className="h-5 w-5 text-cyan-400" />
            ) : (
              <EyeOff className="h-5 w-5 text-[#fdfbf7]/30" />
            )}
          </div>
          <div>
            <h3 className="font-serif text-2xl text-[#fdfbf7] tracking-tight">Competitive Monitoring</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mt-1">Automatic Watchlist Crawler</p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {isLoading ? (
          <div className="text-sm text-[#fdfbf7]/40 py-4 italic">Loading watchlist crawler configuration...</div>
        ) : activeWatchlist ? (
          // Active Watchlist Details
          <div className="space-y-6">
            <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-400">Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      activeWatchlist.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-yellow-500"
                    )} />
                    <span className="text-sm font-semibold text-[#fdfbf7] capitalize">{activeWatchlist.status}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {activeWatchlist.status === "active" && (
                    <button
                      onClick={handlePauseToggle}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-sm border border-yellow-500/20 bg-yellow-500/5 text-[9px] font-bold uppercase tracking-widest text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                    >
                      <Pause className="h-3 w-3" /> Pause
                    </button>
                  )}
                  <button
                    onClick={handleUnsubscribe}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-sm border border-red-500/20 bg-red-500/5 text-[9px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" /> Unsubscribe
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#1f1f1f] pt-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block">Cadence</span>
                  <span className="text-xs font-semibold text-[#fdfbf7] mt-1 block capitalize">{activeWatchlist.cadence}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block">Drift Alert Threshold</span>
                  <span className="text-xs font-semibold text-[#fdfbf7] mt-1 block">{(Number(activeWatchlist.alertThreshold) * 100).toFixed(0)}% score change</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#1f1f1f] pt-4 text-[10px] text-[#fdfbf7]/40">
                <div>
                  <span>Last Evaluated: </span>
                  <span className="font-semibold text-[#fdfbf7]/60 block mt-0.5">
                    {activeWatchlist.lastRunAt ? new Date(activeWatchlist.lastRunAt).toLocaleString() : "Never"}
                  </span>
                </div>
                <div>
                  <span>Next Evaluation: </span>
                  <span className="font-semibold text-[#fdfbf7]/60 block mt-0.5">
                    {activeWatchlist.nextRunAt ? new Date(activeWatchlist.nextRunAt).toLocaleString() : "Pending"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-4 text-[10px] text-[#fdfbf7]/40 flex items-start gap-2.5">
              <Calendar className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#fdfbf7]/60 uppercase tracking-widest block mb-0.5">Automated Cron Execution</span>
                When the crawler detects fact drift or index change exceeding {(Number(activeWatchlist.alertThreshold) * 100).toFixed(0)}%, you will receive email/webhook notifications automatically.
              </div>
            </div>
          </div>
        ) : !session ? (
          <div className="space-y-6">
            <p className="text-xs text-[#fdfbf7]/60 leading-relaxed">
              Keep this comparison fresh automatically. SideBy will execute background research runs on a scheduled cadence and alert you if the scoring index drifts.
            </p>
            <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-6 text-center space-y-4">
              <Lock className="h-8 w-8 text-cyan-400 mx-auto" />
              <div>
                <h5 className="font-serif text-base text-[#fdfbf7]">Competitive Watchlists</h5>
                <p className="text-[10px] text-[#fdfbf7]/50 mt-1 max-w-xs mx-auto">
                  Sign up to track this comparison, get notified on Slack or Email when metrics shift, and access version history.
                </p>
              </div>
              <a
                href="/auth/sign-up"
                className="inline-flex h-10 items-center justify-center w-full rounded-sm bg-cyan-600 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-cyan-700 transition-colors"
              >
                Sign Up Free
              </a>
            </div>
          </div>
        ) : (
          // Watchlist Subscribing Form
          <form onSubmit={handleSubscribe} className="space-y-6">
            <p className="text-xs text-[#fdfbf7]/60 leading-relaxed">
              Keep this comparison fresh automatically. SideBy will execute background research runs on a scheduled cadence and alert you if the scoring index drifts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cadence Selection */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block">Tracking Cadence</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["daily", "weekly", "monthly"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setCadence(opt)}
                      className={cn(
                        "h-10 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all capitalize",
                        cadence === opt 
                          ? "border-cyan-500 bg-cyan-500/10 text-cyan-400" 
                          : "border-[#333] bg-black text-[#fdfbf7]/60 hover:text-[#fdfbf7]"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alert Threshold Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block">Drift Alert Threshold</label>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {(alertThreshold * 100).toFixed(0)}% change
                  </span>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-[9px] font-bold text-[#fdfbf7]/30 uppercase tracking-widest shrink-0">1%</span>
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#1f1f1f] rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <span className="text-[9px] font-bold text-[#fdfbf7]/30 uppercase tracking-widest shrink-0">50%</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-sm bg-cyan-600 text-xs font-bold uppercase tracking-widest text-white hover:bg-cyan-700 transition-colors disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              {isSubmitting ? "Starting Watchlist..." : "Subscribe to Watchlist"}
            </button>
          </form>
        )}
      </div>

      {/* Brand Footer */}
      <div className="mt-8 pt-4 border-t border-[#2a2a2a] text-center text-xs text-[#fdfbf7]/20 pb-4">
        <a href="https://snapsolve.ink" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
          Made by SnapSolve Ink
        </a>
      </div>
    </div>
  );
};
