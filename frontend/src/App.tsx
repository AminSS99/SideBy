import React from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectsProvider } from "@/contexts/ProjectsContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ReverseProtectedRoute from "@/components/auth/ReverseProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import GlobalErrorBoundary from "@/components/ErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import { RouteMetaUpdater } from "@/components/RouteMetaUpdater";
import CookieConsent from "@/components/privacy/CookieConsent";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";

// Lazy-load non-landing pages to reduce initial bundle and memory pressure
const Compare = lazy(() => import("./pages/Compare"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Features = lazy(() => import("./pages/Features"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const Docs = lazy(() => import("./pages/Docs"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const CookiesPolicy = lazy(() => import("./pages/legal/CookiesPolicy"));
const RefundPolicy = lazy(() => import("./pages/legal/RefundPolicy"));
const SecurityOverview = lazy(() => import("./pages/legal/SecurityOverview"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const AuthCallback = lazy(() => import("./pages/auth/AuthCallback"));
const DashboardHome = lazy(() => import("./pages/app/DashboardHome"));
const ComparisonDetailPage = lazy(() => import("./pages/app/ComparisonDetailPage"));
const ComparisonsPage = lazy(() => import("./pages/app/ComparisonsPage"));
const ChatPage = lazy(() => import("./pages/app/ChatPage"));
const ResearchPage = lazy(() => import("./pages/app/ResearchPage"));
const UploadsPage = lazy(() => import("./pages/app/UploadsPage"));
const PromptsPage = lazy(() => import("./pages/app/PromptsPage"));
const AnalyticsPage = lazy(() => import("./pages/app/AnalyticsPage"));
const BillingPage = lazy(() => import("./pages/app/BillingPage"));
const ProjectsPage = lazy(() => import("./pages/app/ProjectsPage"));
const SettingsPage = lazy(() => import("./pages/app/SettingsPage"));
const WorkspacesPage = lazy(() => import("./pages/app/WorkspacesPage"));
const TeamPage = lazy(() => import("./pages/app/TeamPage"));
const OnboardingPage = lazy(() => import("./pages/app/OnboardingPage"));
const OnboardingDiscoveryPage = lazy(() => import("./pages/app/OnboardingDiscoveryPage"));
const EcosystemWorkspacePage = lazy(() => import("./pages/app/EcosystemWorkspacePage"));
const DemoOne = lazy(() => import("./components/ui/demo"));

/**
 * Production-grade QueryClient configuration:
 * - Stale-while-revalidate caching
 * - Automatic retries for transient failures
 * - Refetch on window focus (common SaaS pattern)
 * - Error handling via global callbacks
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache persists for 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests 2 times with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch when window regains focus (great for multi-tab usage)
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect if data is still fresh
      refetchOnReconnect: "always",
    },
    mutations: {
      // Retry mutations once for network errors
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#030303]">
    <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

const App = ({ clerkUnavailable = false }: { clerkUnavailable?: boolean }) => {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider clerkUnavailable={clerkUnavailable}>
          <WorkspaceProvider>
            <ProjectsProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <ScrollToTop />
                <RouteMetaUpdater />
                <CookieConsent />
                  <Suspense fallback={<LazyFallback />}>
                    <Routes>
                    {/* Public marketing pages */}
                    <Route path="/" element={<Index />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/docs" element={<Docs />} />
                    <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                    <Route path="/legal/terms" element={<TermsOfService />} />
                    <Route path="/legal/cookies" element={<CookiesPolicy />} />
                    <Route path="/legal/refund" element={<RefundPolicy />} />
                    <Route path="/legal/security" element={<SecurityOverview />} />
                    <Route path="/compare/:slug" element={<Compare />} />
                    <Route path="/demo" element={<DemoOne />} />

                    {/* Auth pages — reverse protected so signed-in users get redirected */}
                    <Route
                      path="/auth/sign-in"
                      element={
                        <ReverseProtectedRoute>
                          <SignIn />
                        </ReverseProtectedRoute>
                      }
                    />
                    <Route
                      path="/auth/sign-up"
                      element={
                        <ReverseProtectedRoute>
                          <SignUp />
                        </ReverseProtectedRoute>
                      }
                    />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route
                      path="/auth/sign-in/sso-callback"
                      element={
                        <AuthenticateWithRedirectCallback
                          signInUrl="/auth/sign-in"
                          signUpUrl="/auth/sign-up"
                          signInFallbackRedirectUrl="/app"
                          signUpFallbackRedirectUrl="/app"
                        />
                      }
                    />
                    <Route
                      path="/auth/sign-up/sso-callback"
                      element={
                        <AuthenticateWithRedirectCallback
                          signInUrl="/auth/sign-in"
                          signUpUrl="/auth/sign-up"
                          signInFallbackRedirectUrl="/app"
                          signUpFallbackRedirectUrl="/app"
                        />
                      }
                    />

                    {/* Onboarding — for new users without workspaces */}
                    <Route
                      path="/onboarding/discovery"
                      element={
                        <ProtectedRoute>
                          <OnboardingDiscoveryPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute>
                          <OnboardingPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* App shell with protected routes */}
                    <Route
                      path="/app"
                      element={
                        <ProtectedRoute>
                          <AppShell />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<DashboardHome />} />
                      <Route path="chat" element={<ChatPage />} />
                      <Route path="comparisons" element={<ComparisonsPage />} />
                      <Route path="comparisons/:id" element={<ComparisonDetailPage />} />
                      <Route path="research" element={<ResearchPage />} />
                      <Route path="uploads" element={<UploadsPage />} />
                      <Route path="prompts" element={<PromptsPage />} />
                      <Route path="analytics" element={<AnalyticsPage />} />
                      <Route path="quality" element={<Navigate to="/app/analytics" replace />} />
                      <Route path="billing" element={<BillingPage />} />
                      <Route path="team" element={<TeamPage />} />
                      <Route path="ecosystem" element={<EcosystemWorkspacePage />} />
                      <Route path="workspaces" element={<WorkspacesPage />} />
                      <Route path="projects" element={<ProjectsPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>

                    {/* Catch-all 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
              </TooltipProvider>
            </ProjectsProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
