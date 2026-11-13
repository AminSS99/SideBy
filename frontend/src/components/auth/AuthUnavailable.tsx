import { AlertCircle, ArrowRight, RefreshCw } from "@/components/icons";
import { Link } from "react-router-dom";

export function AuthUnavailable() {
  return (
    <div role="status" className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.06] p-5">
      <AlertCircle className="h-5 w-5 text-amber-200" aria-hidden="true" />
      <h2 className="mt-3 text-base font-semibold text-white">Sign-in is temporarily unavailable</h2>
      <p className="mt-2 text-sm leading-6 text-white/70">
        Please try again shortly. You can still explore SideBy while we get you connected.
      </p>
      <button type="button" onClick={() => window.location.reload()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300">
        <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
      </button>
      <Link to="/" className="mt-3 flex min-h-11 items-center gap-2 text-sm text-orange-200 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-300">
        Explore comparisons <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
