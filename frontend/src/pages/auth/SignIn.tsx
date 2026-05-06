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
      <div className="space-y-6">
        {!envConfig.hasClerkConfig ? (
          <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-500">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="leading-relaxed">
                {envConfig.isClerkTestKeyBlocked
                  ? "Production sign-in is paused because Clerk is configured with development keys. Add live Clerk keys in Vercel to enable sign-in."
                  : (
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
              fallbackRedirectUrl="/app"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none p-0 w-full max-w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  dividerLine: "bg-[#333]",
                  dividerText: "text-[#fdfbf7]/40 text-[10px] uppercase tracking-widest font-bold",
                  formFieldLabel: "text-[#fdfbf7]/70 text-[10px] uppercase tracking-widest font-bold",
                  formFieldInput: "bg-[#0c0b0a] border-[#333] text-[#fdfbf7] rounded-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500",
                  formButtonPrimary: "bg-[#fdfbf7] text-[#0a0a0a] hover:bg-[#e0e0e0] rounded-sm text-xs uppercase tracking-widest font-bold py-3",
                  socialButtonsBlockButton: "border border-[#333] bg-[#0c0b0a] hover:bg-[#1a1a1a] text-[#fdfbf7] rounded-sm text-xs font-bold",
                  socialButtonsBlockButtonText: "font-semibold",
                  footer: "hidden",
                }
              }}
            />
          </div>
        )}
        <div className="text-center">
          <Link to="/" className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 hover:text-orange-400 transition-colors">
            &larr; Back to comparisons
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
};

export default SignIn;
