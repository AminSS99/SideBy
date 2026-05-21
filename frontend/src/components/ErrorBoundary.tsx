import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { brand } from "@/config/brand";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

const MAX_ERROR_BOUNDARY_RETRIES = 3;

/**
 * GlobalErrorBoundary
 * Catches JavaScript errors anywhere in the child component tree,
 * logs them, and displays a fallback UI instead of crashing the app.
 * Includes a retry limit to prevent infinite error loops.
 */
class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("GlobalErrorBoundary caught an error:", error, errorInfo);
    this.setState((prev) => {
      const nextCount = prev.errorCount + 1;
      if (nextCount > MAX_ERROR_BOUNDARY_RETRIES) {
        console.error(`GlobalErrorBoundary: reached max retries (${MAX_ERROR_BOUNDARY_RETRIES}). Stopping error recovery to prevent infinite loops.`);
      }
      return { error, errorInfo, errorCount: nextCount };
    });

    // Report to Sentry if available
    if (typeof window !== "undefined" && "__SENTRY__" in window) {
      import("@sentry/react").then((Sentry) => {
        Sentry.captureException(error, {
          extra: { componentStack: errorInfo.componentStack },
        });
      }).catch(() => {
        // Sentry not available, ignore
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorCount: 0 });
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const maxRetriesExceeded = this.state.errorCount > MAX_ERROR_BOUNDARY_RETRIES;

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white px-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-sm border border-red-500/20 bg-red-500/10 text-red-400">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl text-[#fdfbf7] mb-3">
              Something went wrong
            </h1>
            <p className="text-sm text-[#fdfbf7]/50 mb-8 leading-relaxed">
              {maxRetriesExceeded
                ? "A critical error is preventing this page from loading. Please reload the application."
                : `${brand.productName} encountered an unexpected error. We've logged this issue and our team will investigate.`}
            </p>

            {this.state.error && !maxRetriesExceeded && (
              <div className="mb-6 rounded-sm border border-red-500/20 bg-red-500/5 p-4 text-left overflow-auto">
                <p className="text-xs font-mono text-red-400/80">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]"
              >
                <RotateCcw className="h-4 w-4" />
                Reload App
              </button>
              <Link
                to="/"
                className="flex items-center justify-center gap-2 rounded-sm border border-[#333] bg-[#111] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/70 transition-colors hover:border-[#555] hover:text-[#fdfbf7]"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </div>

            <p className="mt-8 text-[10px] text-[#fdfbf7]/20 uppercase tracking-widest">
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
