import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Feature-scoped failure containment for optional panels (charts, evidence
 * visualizations, nonessential ecosystem widgets).
 *
 * Contract:
 * - A render failure inside one optional panel never takes down navigation,
 *   the primary result, or sibling panels — the rest of the workbench stays
 *   fully usable.
 * - Users see a plain, recoverable state with an explicit retry. No raw
 *   stack traces, provider messages, or error internals are rendered.
 * - Errors are reported to Sentry with the panel name as a tag so failures
 *   stay diagnosable without exposing details in the UI.
 * - This is a render boundary only: async errors must still be handled
 *   explicitly by the panel that owns the request.
 */
export class SafePanelBoundary extends React.Component<
  { panelName: string; children: React.ReactNode; fallback?: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    const panelName = this.props.panelName;
    void import("@/lib/sentry").then(({ Sentry }) => {
      Sentry.withScope((scope) => {
        scope.setTag("panel", panelName);
        scope.setContext("panelFailure", { panel: panelName });
        Sentry.captureException(error);
      });
    }).catch(() => {
      // Reporting must never escalate a contained failure, including offline.
    });
  }

  reset = () => this.setState({ failed: false });

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return <SafePanelFallback panelName={this.props.panelName} onRetry={this.reset} />;
  }
}

function SafePanelFallback({ panelName, onRetry }: { panelName: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5 text-[#fdfbf7]"
    >
      <div className="flex items-center gap-2 text-amber-300">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <p className="text-sm font-semibold">{panelName} couldn't be displayed</p>
      </div>
      <p className="text-xs leading-relaxed text-[#fdfbf7]/55">
        The rest of this comparison is unaffected. You can retry this panel without reloading the page.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 text-xs font-semibold text-[#fdfbf7]/80 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Retry panel
      </button>
    </div>
  );
}

/** Functional wrapper: wraps an optional panel with scoped containment. */
export function SafePanel({
  panelName,
  children,
  fallback,
  resetKey,
}: {
  panelName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /**
   * Change this when the displayed record changes (e.g. comparison id or
   * viewed version) so a contained failure never survives record navigation
   * and a fresh record gets a fresh attempt.
   */
  resetKey?: string | number;
}) {
  return (
    <SafePanelBoundary
      key={`${panelName}:${resetKey ?? "default"}`}
      panelName={panelName}
      fallback={fallback}
    >
      {children}
    </SafePanelBoundary>
  );
}
