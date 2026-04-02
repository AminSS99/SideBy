import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { brand } from "@/config/brand";

const SignUp = () => {
  const { signUpWithPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConfigured) {
      setError("Supabase is not configured yet. Add the project URL and publishable key first.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);
      await signUpWithPassword(email, password);
      setMessage("Account created. Check your inbox for the confirmation link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      eyebrow="Workspace access"
      title={`Create your ${brand.productName} account`}
      description={`This is the first real SaaS entrypoint for ${brand.productName}. After signup, the next implementation step is workspace creation and the first persisted data model on Supabase.`}
      footerLabel="Already have an account?"
      footerLinkLabel="Sign in"
      footerHref="/auth/sign-in"
    >
      <div className="space-y-4">
        {!isConfigured && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Configure <code>VITE_SUPABASE_URL</code> and{" "}
                <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to enable signup.
              </p>
            </div>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="founder@sideby.ai"
              className="h-12 border-white/10 bg-black/30 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Choose a secure password"
              className="h-12 border-white/10 bg-black/30 text-white"
              required
              minLength={8}
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-2xl bg-white text-black hover:bg-white/90"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </div>
    </AuthPageShell>
  );
};

export default SignUp;
