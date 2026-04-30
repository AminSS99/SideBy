import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectsProvider } from "@/contexts/ProjectsContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Compare from "./pages/Compare";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
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
import BillingPage from "./pages/app/BillingPage";
import ProjectsPage from "./pages/app/ProjectsPage";
import SettingsPage from "./pages/app/SettingsPage";
import WorkspacesPage from "./pages/app/WorkspacesPage";
import TeamPage from "./pages/app/TeamPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <ProjectsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                  <Route path="/legal/terms" element={<TermsOfService />} />
                  <Route path="/compare/:slug" element={<Compare />} />
                  <Route path="/auth/sign-in" element={<SignIn />} />
                  <Route path="/auth/sign-up" element={<SignUp />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
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
                    <Route path="billing" element={<BillingPage />} />
                    <Route path="team" element={<TeamPage />} />
                    <Route path="workspaces" element={<WorkspacesPage />} />
                    <Route path="projects" element={<ProjectsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ProjectsProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;