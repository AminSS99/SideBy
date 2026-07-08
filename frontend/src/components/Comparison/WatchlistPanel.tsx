import React, { useCallback, useState, useEffect } from "react";
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
  const monitorName = `${result.entities.a.name} vs ${result.entities.b.name}`;

  const agentSignals = [
    {
      icon: Sparkles,
      title: "Recrawl sources",
      text: "Refreshes the cited sources behind this comparison on schedule.",
    },
    {
      icon: AlertTriangle,
      title: "Detect drift",
      text: "Flags material score and fact changes before the decision gets stale.",
    },
    {
      icon: Calendar,
      title: "Keep history",
      text: "Preserves the run cadence, last check, and next check for review.",
    },
  ];

  const fetchWatchlist = useCallback(async () => {
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
  }, [comparisonId, session]);

  useEffect(() => {
    if (session) {
      void fetchWatchlist();
    }
  }, [fetchWatchlist, session]);

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
          name: `AI Monitor: ${monitorName}`,
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
    const nextStatus = activeWatchlist.status === "active" ? "paused" : "active";
    try {
      setIsSubmitting(true);
      const res = await apiFetch(buildApiUrl(`/api/watchlists?id=${activeWatchlist.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status.");
      toast.success(nextStatus === "active" ? "AI monitor resumed." : "AI monitor paused.");
      void fetchWatchlist();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error updating watchlist.");
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mt-1">AI Research Monitor</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex h-7 items-center rounded-sm border border-cyan-500/20 bg-cyan-500/10 px-3 text-[9px] font-bold uppercase tracking-widest text-cyan-300">
          Agent Mode
        </span>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {isLoading ? (
          <div className="text-sm text-[#fdfbf7]/40 py-4 italic">Loading AI monitor configuration...</div>
        ) : activeWatchlist ? (
          // Active Watchlist Details
          <div className="space-y-6">
            <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-400">Monitor</span>
                  <h4 className="mt-1 font-serif text-lg text-[#fdfbf7]">{activeWatchlist.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      activeWatchlist.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-yellow-500"
                    )} />
                    <span className="text-sm font-semibold text-[#fdfbf7] capitalize">{activeWatchlist.status}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handlePauseToggle}
                    disabled={isSubmitting}
                    className={cn(
                      "flex h-8 items-center gap-1.5 rounded-sm border px-3 text-[9px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50",
                      activeWatchlist.status === "active"
                        ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-400 hover:bg-yellow-500/10"
                        : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10",
                    )}
                  >
                    {activeWatchlist.status === "active" ? (
                      <>
                        <Pause className="h-3 w-3" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" /> Resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={isSubmitting}
                    className="flex h-8 items-center gap-1.5 rounded-sm border border-red-500/20 bg-red-500/5 px-3 text-[9px] font-bold uppercase tracking-widest text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
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
                <span className="font-bold text-[#fdfbf7]/60 uppercase tracking-widest block mb-0.5">Automated Research Agent</span>
                SideBy will recrawl sources and refresh this comparison on schedule. When fact or score drift exceeds {(Number(activeWatchlist.alertThreshold) * 100).toFixed(0)}%, the monitor can trigger email or webhook alerts.
              </div>
            </div>
          </div>
        ) : !session ? (
          <div className="space-y-6">
            <p className="text-xs text-[#fdfbf7]/60 leading-relaxed">
              Turn this comparison into a scheduled AI research agent. SideBy recrawls sources, refreshes scoring, and flags material changes before your decision goes stale.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {agentSignals.map((signal) => (
                <div key={signal.title} className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-4">
                  <signal.icon className="mb-3 h-4 w-4 text-cyan-400" />
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/70">{signal.title}</div>
                  <p className="mt-2 text-[10px] leading-relaxed text-[#fdfbf7]/45">{signal.text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-6 text-center space-y-4">
              <Lock className="h-8 w-8 text-cyan-400 mx-auto" />
              <div>
                <h5 className="font-serif text-base text-[#fdfbf7]">AI Research Monitors</h5>
                <p className="text-[10px] text-[#fdfbf7]/50 mt-1 max-w-xs mx-auto">
                  Sign up to track this comparison, receive change alerts, and keep a version trail of refreshed research.
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
              Turn <span className="font-semibold text-[#fdfbf7]">{monitorName}</span> into a scheduled AI research monitor. SideBy recrawls sources, reruns scoring, and flags meaningful changes before your decision goes stale.
            </p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {agentSignals.map((signal) => (
                <div key={signal.title} className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-4">
                  <signal.icon className="mb-3 h-4 w-4 text-cyan-400" />
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/70">{signal.title}</div>
                  <p className="mt-2 text-[10px] leading-relaxed text-[#fdfbf7]/45">{signal.text}</p>
                </div>
              ))}
            </div>

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
              {isSubmitting ? "Starting Monitor..." : "Start AI Monitor"}
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
