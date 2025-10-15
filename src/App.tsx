import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import PlatformNotifications from "./pages/PlatformNotifications";
import WorkspaceManagement from "./pages/WorkspaceManagement";
import ClientPortal from "./pages/ClientPortal";
import Chatbots from "./pages/Chatbots";
import CreateChatbot from "./pages/CreateChatbot";
import ChatbotEditor from "./pages/ChatbotEditor";
import Widget from "./pages/Widget";
import EmbedDemo from "./pages/EmbedDemo";
import Analytics from "./pages/Analytics";
import Leads from "./pages/Leads";
import LeadIntegrations from "./pages/LeadIntegrations";
import Pricing from "./pages/Pricing";
import VideoTemplateLibrary from "./pages/VideoTemplateLibrary";
import TemplateAnalytics from "./pages/TemplateAnalytics";
import OnboardingWizard from "./components/templates/OnboardingWizard";
import AvatarChatbots from "./pages/AvatarChatbots";
import AvatarChatbotEditor from "./pages/AvatarChatbotEditor";
import NotFound from "./pages/NotFound";
import VideoFlowEditor from "./pages/VideoFlowEditor";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/auth" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <WorkspaceProvider>
            <Routes>
              <Route 
                path="/" 
                element={
                  <PublicRoute>
                    <Landing />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/auth" 
                element={
                  <PublicRoute>
                    <Auth />
                  </PublicRoute>
                } 
              />
              
              {/* Client Portal - can be accessed with workspace param */}
              <Route path="/portal" element={<ClientPortal />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/user-management" 
                element={
                  <ProtectedRoute>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/platform-notifications" 
                element={
                  <ProtectedRoute>
                    <PlatformNotifications />
                  </ProtectedRoute>
                } 
              />
              
              {/* Workspace & Agency Management */}
              <Route 
                path="/workspaces" 
                element={
                  <ProtectedRoute>
                    <WorkspaceManagement />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/chatbots" 
                element={
                  <ProtectedRoute>
                    <Chatbots />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chatbots/create" 
                element={
                  <ProtectedRoute>
                    <CreateChatbot />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chatbots/:id/editor" 
                element={
                  <ProtectedRoute>
                    <ChatbotEditor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chatbots/:id/video-editor" 
                element={
                  <ProtectedRoute>
                    <VideoFlowEditor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/templates" 
                element={
                  <ProtectedRoute>
                    <VideoTemplateLibrary />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/templates/analytics" 
                element={
                  <ProtectedRoute>
                    <TemplateAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/onboarding" 
                element={
                  <ProtectedRoute>
                    <OnboardingWizard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/leads" 
                element={
                  <ProtectedRoute>
                    <Leads />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/leads/integrations" 
                element={
                  <ProtectedRoute>
                    <LeadIntegrations />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pricing" 
                element={
                  <ProtectedRoute>
                    <Pricing />
                  </ProtectedRoute>
                } 
              />
              <Route path="/widget" element={<Widget />} />
              <Route 
                path="/embed-demo" 
                element={
                  <ProtectedRoute>
                    <EmbedDemo />
                  </ProtectedRoute>
                } 
              />
              
              {/* Avatar Chatbots */}
              <Route 
                path="/avatar-chatbots" 
                element={
                  <ProtectedRoute>
                    <AvatarChatbots />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/avatar-chatbots/create" 
                element={
                  <ProtectedRoute>
                    <AvatarChatbotEditor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/avatar-chatbots/:id/editor" 
                element={
                  <ProtectedRoute>
                    <AvatarChatbotEditor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/avatar-chatbots/:id/preview" 
                element={
                  <ProtectedRoute>
                    <AvatarChatbotEditor />
                  </ProtectedRoute>
                } 
              />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
