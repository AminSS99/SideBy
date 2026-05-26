import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { envConfig } from "@/config/env";
import { identifyUser, resetPostHog } from "@/lib/posthog";

const AUTH_CACHE_KEY = "sideby.auth.cache";
const AUTH_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

interface CachedAuthState {
  userId: string;
  email: string | null;
  fullName: string | null;
  imageUrl: string | null;
  timestamp: number;
}

export interface AppUser {
  id: string;
  email: string | null;
  fullName: string | null;
  imageUrl: string | null;
}

export interface AppSession {
  userId: string;
}

interface AuthContextValue {
  session: AppSession | null;
  user: AppUser | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readCachedAuth(): CachedAuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedAuthState;
    if (Date.now() - parsed.timestamp > AUTH_CACHE_TTL_MS) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedAuth(user: AppUser | null) {
  try {
    if (user) {
      const cache: CachedAuthState = {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        imageUrl: user.imageUrl,
        timestamp: Date.now(),
      };
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache));
    } else {
      localStorage.removeItem(AUTH_CACHE_KEY);
    }
  } catch {
    // Storage might be full or unavailable
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const isTestAuth = typeof window !== "undefined" && localStorage.getItem("sideby.test.auth") === "true";

  if (isTestAuth) {
    return <TestAuthProvider>{children}</TestAuthProvider>;
  }

  if (!envConfig.hasClerkConfig) {
    return <UnconfiguredAuthProvider>{children}</UnconfiguredAuthProvider>;
  }

  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
};

const TestAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const user = useMemo<AppUser>(() => ({
    id: "user_test_mock",
    email: "test@example.com",
    fullName: "Test Admin",
    imageUrl: null,
  }), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session: { userId: user.id },
      user,
      isLoading: false,
      isConfigured: true,
      async signInWithPassword() {},
      async signUpWithPassword() {},
      async signInWithGoogle() {},
      async signOut() {
        localStorage.removeItem("sideby.test.auth");
        window.location.href = "/";
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const UnconfiguredAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useMemo<AuthContextValue>(
    () => ({
      session: null,
      user: null,
      isLoading: false,
      isConfigured: false,
      async signInWithPassword() {
        throw new Error("Clerk is not configured.");
      },
      async signUpWithPassword() {
        throw new Error("Clerk is not configured.");
      },
      async signInWithGoogle() {
        throw new Error("Clerk is not configured.");
      },
      async signOut() {
        return;
      },
    }),
    [],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const ClerkAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const [cachedUser, setCachedUser] = useState<AppUser | null>(readCachedAuth);

  const user = useMemo<AppUser | null>(() => {
    if (!isLoaded) {
      // While Clerk is loading, show cached user to prevent flicker
      return cachedUser;
    }
    if (!isSignedIn || !clerkUser) {
      return null;
    }

    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      fullName: clerkUser.fullName,
      imageUrl: clerkUser.imageUrl,
    };
  }, [clerkUser, isSignedIn, isLoaded]);

  // Sync user to cache whenever it changes
  useEffect(() => {
    if (isLoaded) {
      writeCachedAuth(user);
      setCachedUser(user);
    }
  }, [user, isLoaded]);

  // Clear cache on sign-out
  const handleSignOut = useCallback(async () => {
    writeCachedAuth(null);
    setCachedUser(null);
    // Clear workspace and project selections to prevent stale data on next login
    try {
      localStorage.removeItem("sideby.activeWorkspaceId");
      localStorage.removeItem("sideby.activeProjectId");
      localStorage.removeItem("sideby.preferences");
      localStorage.removeItem("sideby.workspaceDraft");
    } catch {
      // Ignore storage errors
    }
    await clerkSignOut();
  }, [clerkSignOut]);

  useEffect(() => {
    if (user) {
      identifyUser(user.id, {
        email: user.email,
        name: user.fullName,
      });
    } else if (isLoaded && !isSignedIn) {
      resetPostHog();
    }
  }, [user, isLoaded, isSignedIn]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session: user ? { userId: user.id } : null,
      user,
      // If we have a cached user, we can consider auth "loaded" even before Clerk finishes
      isLoading: !isLoaded && !cachedUser,
      isConfigured: true,
      async signInWithPassword() {
        throw new Error("Use the Clerk sign-in form to authenticate.");
      },
      async signUpWithPassword() {
        throw new Error("Use the Clerk sign-up form to create an account.");
      },
      async signInWithGoogle() {
        throw new Error("Use the Clerk sign-in form to authenticate.");
      },
      async signOut() {
        await handleSignOut();
      },
    }),
    [handleSignOut, isLoaded, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
};
