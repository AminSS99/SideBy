import React from "react";
import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { envConfig } from "@/config/env";
import { brand } from "@/config/brand";
import { usePageTitle } from "@/hooks/usePageTitle";

const SignUp = () => {
  usePageTitle("Sign Up");
  const [searchParams] = useSearchParams();
  const requestedRedirect = searchParams.get("redirect_url") || "/app";
  const redirectUrl = requestedRedirect.startsWith("/app") && !requestedRedirect.startsWith("//")
    ? requestedRedirect
    : "/app";
  const signInUrl = `/auth/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;
  return (
    <AuthPageShell
      eyebrow="Start comparing"
      title={`Create your ${brand.productName} account`}
      description="Create an account to save workspaces, projects, and source-backed comparison runs."
      footerLabel="Already have an account?"
      footerLinkLabel="Sign in"
      footerHref={signInUrl}
    >
      <div className="space-y-6">
        {!envConfig.hasClerkConfig ? (
          <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-500">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="leading-relaxed">
                {envConfig.isClerkPublishableKeyMalformed ? (
                  "Signup is paused because the Clerk publishable key is malformed. Add the full live publishable key from Clerk's API Keys page in Vercel."
                ) : envConfig.isClerkTestKeyBlocked ? (
                  "Signup is paused because this production build still has Clerk development keys. Add live Clerk keys in Vercel to enable signup."
                ) : (
                    <>
                      Configure <code className="bg-amber-500/20 px-1 py-0.5 rounded text-amber-300">VITE_CLERK_PUBLISHABLE_KEY</code> to enable signup.
                    </>
                  )}
              </p>
            </div>
          </div>
        ) : (
          <div className="clerk-auth-scope min-w-0 overflow-hidden rounded-sm">
            <ClerkSignUp
              routing="path"
              path="/auth/sign-up"
              signInUrl={signInUrl}
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

export default SignUp;
