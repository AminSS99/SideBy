import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { brand } from "@/config/brand";

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, signInWithGoogle, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/app";

  const handlePasswordSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConfigured) {
      setError("Supabase is not configured yet. Add the project URL and publishable key first.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await signInWithPassword(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed.");
    }
  };

  return (
    <AuthPageShell
      eyebrow="Phase 2 foundation"
      title={`Sign in to ${brand.productName}`}
      description={`${brand.productName} now has a real SaaS route shell. Use Supabase Auth here, then continue into workspaces, projects, and AI operations.`}
      footerLabel="Need an account?"
      footerLinkLabel="Create one"
      footerHref="/auth/sign-up"
    >
      <div className="space-y-4">
        {!isConfigured && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Configure <code>VITE_SUPABASE_URL</code> and{" "}
                <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to enable auth.
              </p>
            </div>
          </div>
        )}

        <form className="space-y-4" onSubmit={handlePasswordSignIn}>
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/70">Password</label>
              <Link to="/auth/sign-up" className="text-xs text-white/45 hover:text-white/80">
                Need access?
              </Link>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="h-12 border-white/10 bg-black/30 text-white"
              required
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-2xl bg-white text-black hover:bg-white/90"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-2xl border-white/15 bg-transparent text-white hover:bg-white/10"
          onClick={handleGoogleSignIn}
        >
          Continue with Google
        </Button>
      </div>
    </AuthPageShell>
  );
};

export default SignIn;
