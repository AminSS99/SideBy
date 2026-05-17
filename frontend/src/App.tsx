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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Compare from "./pages/Compare";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Docs from "./pages/Docs";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import CookiesPolicy from "./pages/legal/CookiesPolicy";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import AuthCallback from "./pages/auth/AuthCallback";
import DashboardHome from "./pages/app/DashboardHome";
import ComparisonDetailPage from "./pages/app/ComparisonDetailPage";
import ComparisonsPage from "./pages/app/ComparisonsPage";
import ChatPage from "./pages/app/ChatPage";
import ResearchPage from "./pages/app/ResearchPage";
import UploadsPage from "./pages/app/UploadsPage";
import PromptsPage from "./pages/app/PromptsPage";
import AnalyticsPage from "./pages/app/AnalyticsPage";
import QualityPage from "./pages/app/QualityPage";
import BillingPage from "./pages/app/BillingPage";
import ProjectsPage from "./pages/app/ProjectsPage";
import SettingsPage from "./pages/app/SettingsPage";
import WorkspacesPage from "./pages/app/WorkspacesPage";
import TeamPage from "./pages/app/TeamPage";
import OnboardingPage from "./pages/app/OnboardingPage";

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

const App = () => {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WorkspaceProvider>
            <ProjectsProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
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
                    <Route path="/compare/:slug" element={<Compare />} />

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
                      <Route path="quality" element={<QualityPage />} />
                      <Route path="billing" element={<BillingPage />} />
                      <Route path="team" element={<TeamPage />} />
                      <Route path="workspaces" element={<WorkspacesPage />} />
                      <Route path="projects" element={<ProjectsPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>

                    {/* Catch-all 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </ProjectsProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
