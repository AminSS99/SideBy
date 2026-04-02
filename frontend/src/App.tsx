import { useState } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoadingPage from "./components/LoadingPage";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import AuthCallback from "./pages/auth/AuthCallback";
import DashboardHome from "./pages/app/DashboardHome";
import ProjectsPage from "./pages/app/ProjectsPage";
import SettingsPage from "./pages/app/SettingsPage";
import WorkspacesPage from "./pages/app/WorkspacesPage";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <ProjectsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <LoadingPage
                    key="loading"
                    onComplete={() => setIsLoading(false)}
                  />
                ) : (
                  <motion.div
                    key="main"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <BrowserRouter>
                      <Routes>
                        <Route path="/" element={<Index />} />
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
                          <Route path="workspaces" element={<WorkspacesPage />} />
                          <Route path="projects" element={<ProjectsPage />} />
                          <Route path="settings" element={<SettingsPage />} />
                        </Route>
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </motion.div>
                )}
              </AnimatePresence>
            </TooltipProvider>
          </ProjectsProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
