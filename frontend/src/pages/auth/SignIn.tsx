import React from "react";
import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { envConfig } from "@/config/env";
import { brand } from "@/config/brand";

const SignIn = () => {
  return (
    <AuthPageShell
      eyebrow="Private beta"
      title={`Sign in to ${brand.productName}`}
      description={`${brand.productName} uses Clerk for beta access, workspace routing, and API authentication.`}
      footerLabel="Need an account?"
      footerLinkLabel="Create one"
      footerHref="/auth/sign-up"
    >
      <div className="space-y-4">
        {!envConfig.hasClerkConfig ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Configure <code>VITE_CLERK_PUBLISHABLE_KEY</code> to enable beta sign-in.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white text-black">
            <ClerkSignIn
              routing="path"
              path="/auth/sign-in"
              signUpUrl="/auth/sign-up"
              fallbackRedirectUrl="/app"
            />
          </div>
        )}
        <Link to="/" className="block text-center text-xs text-white/45 hover:text-white/80">
          Back to comparisons
        </Link>
      </div>
    </AuthPageShell>
  );
};

export default SignIn;
