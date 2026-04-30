import React, { createContext, useContext, useMemo } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { envConfig } from "@/config/env";

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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  if (!envConfig.hasClerkConfig) {
    return <UnconfiguredAuthProvider>{children}</UnconfiguredAuthProvider>;
  }

  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
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

  const user = useMemo<AppUser | null>(() => {
    if (!isSignedIn || !clerkUser) {
      return null;
    }

    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      fullName: clerkUser.fullName,
      imageUrl: clerkUser.imageUrl,
    };
  }, [clerkUser, isSignedIn]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session: user ? { userId: user.id } : null,
      user,
      isLoading: !isLoaded,
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
        await clerkSignOut();
      },
    }),
    [clerkSignOut, isLoaded, user],
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
