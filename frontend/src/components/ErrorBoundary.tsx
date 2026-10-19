import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { brand } from "@/config/brand";
import { AlertTriangle, RotateCcw, Home, WifiOff, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { pwaUpdates } from "@/lib/pwa/register";
import {
  CHUNK_RELOAD_GUARD_KEY,
  reloadPage,
  safeSessionGet,
  safeSessionRemove,
  safeSessionSet,
} from "@/lib/safe-storage";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  isOffline: boolean;
  isChunkLoadError: boolean;
}

const MAX_ERROR_BOUNDARY_RETRIES = 3;

/**
 * GlobalErrorBoundary
 * Catches JavaScript errors anywhere in the component tree.
 * - Distinguishes offline network disconnection vs post-deploy chunk mismatch vs runtime exceptions.
 * - Prevents infinite reload loops when assets are unavailable.
 * - Logs exceptions to Sentry when enabled.
 * - Safely handles blocked storage environments (private browsing, disabled cookies).
 */
class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      isOffline: typeof navigator !== "undefined" && !navigator.onLine,
      isChunkLoadError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const message = (error?.message || "").toLowerCase();
    const isChunk =
      message.includes("failed to fetch dynamically imported module") ||
      message.includes("error loading dynamically imported module") ||
      message.includes("dynamically imported module") ||
      error?.name === "ChunkLoadError";

    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    return {
      hasError: true,
      error,
      errorInfo: null,
      isOffline,
      isChunkLoadError: isChunk,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("GlobalErrorBoundary caught an error:", error, errorInfo);
    this.setState((prev) => {
      const nextCount = prev.errorCount + 1;
      return { error, errorInfo, errorCount: nextCount };
    });

    // Auto-reload once for stale chunk deploy mismatch if online and not previously attempted.
    // The reload only proceeds automatically when preservation succeeded or
    // there is no dirty input; otherwise the error surface stays up with an
    // explicit Reload action so recoverable input is never silently lost.
    // The guard write itself must succeed first: if blocked storage drops the
    // guard, the next page load would have no record of this attempt and could
    // reload again, so automatic recovery stays disabled in that case.
    if (this.state.isChunkLoadError && typeof window !== "undefined" && navigator.onLine) {
      const attempted = safeSessionGet(CHUNK_RELOAD_GUARD_KEY);
      if (!attempted) {
        const guardPersisted = safeSessionSet(CHUNK_RELOAD_GUARD_KEY, "true");
        if (!guardPersisted) {
          return;
        }
        // Preserve active user drafts before reloading due to chunk mismatch
        const saveResult = pwaUpdates.saveAllDrafts();
        if (saveResult.ok || !pwaUpdates.isDirty()) {
          reloadPage();
          return;
        }
      }
    }

    // Report to Sentry if available
    if (typeof window !== "undefined" && "__SENTRY__" in window) {
      import("@sentry/react")
        .then((Sentry) => {
          Sentry.captureException(error, {
            extra: { componentStack: errorInfo.componentStack },
          });
        })
        .catch(() => {
          // Sentry not available, ignore
        });
    }
  }

  handleReset = () => {
    // Explicit user-initiated reload: best-effort preservation first, then
    // reload regardless — the user chose this action knowingly.
    pwaUpdates.saveAllDrafts();
    safeSessionRemove(CHUNK_RELOAD_GUARD_KEY);
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      isOffline: false,
      isChunkLoadError: false,
    });
    reloadPage();
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { isOffline, isChunkLoadError } = this.state;
      const maxRetriesExceeded = this.state.errorCount > MAX_ERROR_BOUNDARY_RETRIES;

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white px-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
              {isOffline ? (
                <WifiOff className="h-8 w-8" />
              ) : isChunkLoadError ? (
                <RefreshCw className="h-8 w-8" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-400" />
              )}
            </div>

            <h1 className="font-serif text-3xl text-[#fdfbf7] mb-3">
              {isOffline
                ? "You're currently offline"
                : isChunkLoadError
                  ? "Update available"
                  : "Something went wrong"}
            </h1>

            <p className="text-sm text-[#fdfbf7]/60 mb-8 leading-relaxed">
              {isOffline
                ? "This section requires an active internet connection to load. Once your device reconnects, tap retry below."
                : isChunkLoadError
                  ? "A new release of SideBy is available. Refreshing will load the updated version."
                  : maxRetriesExceeded
                    ? "A critical error is preventing this page from loading. Please reload the application."
                    : `${brand.productName} encountered an unexpected error. We've logged this issue and our team will investigate.`}
            </p>

            {this.state.error && !isOffline && !isChunkLoadError && !maxRetriesExceeded && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left overflow-auto">
                <p className="text-xs font-mono text-red-400/80">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 active:scale-[0.99]"
              >
                <RotateCcw className="h-4 w-4" />
                {isOffline ? "Retry connection" : "Reload"}
              </button>
              <Link
                to="/"
                onClick={() => safeSessionRemove(CHUNK_RELOAD_GUARD_KEY)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#fdfbf7]/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Home className="h-4 w-4" />
                Go home
              </Link>
            </div>

            <p className="mt-8 text-[10px] text-[#fdfbf7]/30 uppercase tracking-widest font-mono">
              {brand.operatedByLine}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
