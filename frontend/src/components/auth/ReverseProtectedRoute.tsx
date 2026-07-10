import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { brand } from "@/config/brand";

/**
 * ReverseProtectedRoute
 * Redirects already-authenticated users away from auth pages (sign-in, sign-up)
 * to the app dashboard. Prevents logged-in users from seeing auth forms.
 */
const ReverseProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, session } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">
            {brand.productName}
          </p>
          <p className="mt-3 text-lg text-white/70">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (session) {
    // Redirect to the page they came from (if any) or the app dashboard
    const stateFrom = (location.state as { from?: { pathname?: string; search?: string } })?.from;
    const requestedRedirect = new URLSearchParams(location.search).get("redirect_url");
    const safeRedirect = requestedRedirect?.startsWith("/app") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : null;
    const from = stateFrom?.pathname ? `${stateFrom.pathname}${stateFrom.search || ""}` : null;
    return <Navigate to={safeRedirect || from || "/app"} replace />;
  }

  return <>{children}</>;
};

export default ReverseProtectedRoute;
