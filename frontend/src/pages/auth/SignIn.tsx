import React from "react";
import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthComparisonBrief } from "@/components/auth/AuthComparisonBrief";
import { AuthUnavailable } from "@/components/auth/AuthUnavailable";
import { authDestination } from "@/lib/authDestination";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { useAuth } from "@/contexts/AuthContext";
import { envConfig } from "@/config/env";
import { brand } from "@/config/brand";
import { usePageTitle } from "@/hooks/usePageTitle";

const SignIn = () => {
  usePageTitle("Sign In");
  const [searchParams] = useSearchParams();
  const { isConfigured } = useAuth();
  const redirectUrl = authDestination(searchParams.get("redirect_url"));
  const signUpUrl = `/auth/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`;
  return (
    <AuthPageShell
      eyebrow="Welcome back"
      title={`Sign in to ${brand.productName}`}
      description="Continue your research, revisit saved comparisons, and export cited results."
      footerLabel="Need an account?"
      footerLinkLabel="Create one"
      footerHref={signUpUrl}
    >
      <div className="space-y-6">
        <AuthComparisonBrief destination={redirectUrl} />
        {envConfig.canUseTestAuth && (
          <div className="rounded border border-orange-500/30 bg-orange-500/10 p-4 text-center">
            <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">Test Environment</p>
            <button
              id="test-auth-btn"
              onClick={() => {
                localStorage.setItem("sideby.test.auth", "true");
                window.location.href = redirectUrl;
              }}
              className="w-full py-2 px-4 bg-[#fdfbf7] hover:bg-[#e0e0e0] text-[#0a0a0a] rounded font-bold transition-colors text-xs uppercase tracking-wider"
            >
              Sign in with Mock Account
            </button>
          </div>
        )}

        {!isConfigured ? (
          <AuthUnavailable />
        ) : (
          <div className="clerk-auth-scope min-w-0 overflow-hidden rounded-sm">
            <ClerkSignIn
              routing="path"
              path="/auth/sign-in"
              signUpUrl={signUpUrl}
              forceRedirectUrl={redirectUrl}
              fallbackRedirectUrl={redirectUrl}
              appearance={{
                elements: {
                  rootBox: "w-full min-w-0 max-w-full",
                  cardBox: "w-full min-w-0 max-w-full",
                  card: "bg-transparent shadow-none p-0 w-full min-w-0 max-w-full",
                  main: "w-full min-w-0 max-w-full",
                  form: "w-full min-w-0 max-w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  dividerLine: "bg-white/5",
                  dividerText: "text-white/30 text-xs font-semibold tracking-wider uppercase",
                  formFieldLabel: "text-white/75 text-xs font-medium mb-1.5 block text-left",
                  formFieldInput: "clerk-input",
                  formButtonPrimary: "clerk-primary-btn w-full",
                  socialButtonsBlockButton: "clerk-social-btn w-full flex items-center justify-center gap-2 font-medium",
                  socialButtonsBlockButtonText: "font-medium text-white",
                  footer: "hidden",
                }
              }}
            />
          </div>
        )}
        <div className="text-center mt-6">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-white/65 hover:text-orange-400 transition-colors font-medium">
            &larr; Back to comparisons
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
};

export default SignIn;
