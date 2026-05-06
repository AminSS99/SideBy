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
      <div className="space-y-6">
        {!envConfig.hasClerkConfig ? (
          <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-500">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="leading-relaxed">
                {envConfig.isClerkTestKeyBlocked
                  ? "Production signup is paused because Clerk is configured with development keys. Add live Clerk keys in Vercel to enable signup."
                  : (
                    <>
                      Configure <code className="bg-amber-500/20 px-1 py-0.5 rounded text-amber-300">VITE_CLERK_PUBLISHABLE_KEY</code> to enable signup.
                    </>
                  )}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm">
            <ClerkSignUp
              routing="path"
              path="/auth/sign-up"
              signInUrl="/auth/sign-in"
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
      </div>
    </AuthPageShell>
  );
};

export default SignUp;
