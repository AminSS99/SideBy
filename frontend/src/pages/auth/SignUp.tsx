import React from "react";
import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import { AlertCircle } from "lucide-react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { envConfig } from "@/config/env";
import { brand } from "@/config/brand";

const SignUp = () => {
  return (
    <AuthPageShell
      eyebrow="Workspace access"
      title={`Create your ${brand.productName} account`}
      description={`Join the private beta to save workspaces, projects, and source-backed comparison runs.`}
      footerLabel="Already have an account?"
      footerLinkLabel="Sign in"
      footerHref="/auth/sign-in"
    >
      <div className="space-y-4">
        {!envConfig.hasClerkConfig ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Configure <code>VITE_CLERK_PUBLISHABLE_KEY</code> to enable signup.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white text-black">
            <ClerkSignUp
              routing="path"
              path="/auth/sign-up"
              signInUrl="/auth/sign-in"
              fallbackRedirectUrl="/app"
            />
          </div>
        )}
      </div>
    </AuthPageShell>
  );
};

export default SignUp;
