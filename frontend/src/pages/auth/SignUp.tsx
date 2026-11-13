import React from "react";
import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthComparisonBrief } from "@/components/auth/AuthComparisonBrief";
import { AuthUnavailable } from "@/components/auth/AuthUnavailable";
import { authDestination } from "@/lib/authDestination";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { useAuth } from "@/contexts/AuthContext";
import { brand } from "@/config/brand";
import { usePageTitle } from "@/hooks/usePageTitle";

const SignUp = () => {
  usePageTitle("Sign Up");
  const [searchParams] = useSearchParams();
  const { isConfigured } = useAuth();
  const redirectUrl = authDestination(searchParams.get("redirect_url"));
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
        <AuthComparisonBrief destination={redirectUrl} />
        {!isConfigured ? (
          <AuthUnavailable />
        ) : (
          <div className="clerk-auth-scope min-w-0 overflow-hidden rounded-sm">
            <ClerkSignUp
              routing="path"
              path="/auth/sign-up"
              signInUrl={signInUrl}
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

export default SignUp;
