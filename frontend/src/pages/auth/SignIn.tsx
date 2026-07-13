import React from "react";
import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { envConfig } from "@/config/env";
import { brand } from "@/config/brand";
import { usePageTitle } from "@/hooks/usePageTitle";

const SignIn = () => {
  usePageTitle("Sign In");
  const [searchParams] = useSearchParams();
  const requestedRedirect = searchParams.get("redirect_url") || "/app";
  const redirectUrl = requestedRedirect.startsWith("/app") && !requestedRedirect.startsWith("//")
    ? requestedRedirect
    : "/app";
  return (
    <AuthPageShell
      eyebrow="Private beta"
      title={`Sign in to ${brand.productName}`}
      description={`${brand.productName} uses Clerk for beta access, workspace routing, and API authentication.`}
      footerLabel="Need an account?"
      footerLinkLabel="Create one"
      footerHref="/auth/sign-up"
    >
      <div className="space-y-6">
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

        {!envConfig.hasClerkConfig ? (
          <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-500">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="leading-relaxed">
                {envConfig.isClerkPublishableKeyMalformed ? (
                  "Sign-in is paused because the Clerk publishable key is malformed. Add the full live publishable key from Clerk's API Keys page in Vercel."
                ) : envConfig.isClerkTestKeyBlocked ? (
                  "Sign-in is paused because this production build still has Clerk development keys. Add live Clerk keys in Vercel to enable sign-in."
                ) : (
                    <>
                      Configure <code className="bg-amber-500/20 px-1 py-0.5 rounded text-amber-300">VITE_CLERK_PUBLISHABLE_KEY</code> to enable beta sign-in.
                    </>
                  )}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm">
            <ClerkSignIn
              routing="path"
              path="/auth/sign-in"
              signUpUrl="/auth/sign-up"
              fallbackRedirectUrl={redirectUrl}
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none p-0 w-full max-w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  dividerLine: "bg-white/5",
                  dividerText: "text-white/30 text-xs font-semibold tracking-wider uppercase",
                  formFieldLabel: "text-white/50 text-[10px] uppercase tracking-widest font-semibold mb-1.5 block text-left",
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
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-orange-400 transition-colors font-medium">
            &larr; Back to comparisons
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
};

export default SignIn;
