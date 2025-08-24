import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RouteGuard } from "@/components/RouteGuard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ModuleDetails from "./pages/ModuleDetails";
import RequestForm from "./pages/RequestForm";
import NotFound from "./pages/NotFound";
import UploadModule from "./pages/UploadModule";
import ViewModules from "./pages/ViewModules";
import CreateUser from "./pages/CreateUser";
import ViewUsers from "./pages/ViewUsers";
import AssignModules from "./pages/AssignModules";
import ViewRequests from "./pages/ViewRequests";
import WriteRecommendations from "./pages/WriteRecommendations";
import EditModule from "./pages/EditModule";
import LynqLibrary from "./pages/LynqLibrary";
import AdaptLynqs from "./pages/AdaptLynqs";
import AdaptiveRequests from "./pages/AdaptiveRequests";
import TweakRequests from "./pages/TweakRequests";
import ManageQuestions from "./pages/ManageQuestions";
import ManageAdaptiveIdeas from "./pages/ManageAdaptiveIdeas";
import ClientRequests from "./pages/ClientRequests";
import TweakRequestForm from "./pages/TweakRequestForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/lynq-library" element={<RouteGuard><LynqLibrary /></RouteGuard>} />
            <Route path="/user-dashboard" element={<RouteGuard><UserDashboard /></RouteGuard>} />
            <Route path="/module/:moduleId" element={<RouteGuard><ModuleDetails /></RouteGuard>} />
            <Route path="/request-form/new" element={<RouteGuard><RequestForm type="new" /></RouteGuard>} />
            <Route path="/request-form/adapt/:moduleId" element={<RouteGuard><RequestForm type="adapt" /></RouteGuard>} />
            <Route path="/request-form/tweak/:moduleId" element={<RouteGuard><TweakRequestForm /></RouteGuard>} />
            
            {/* Admin Routes - Protected */}
            <Route path="/admin-dashboard" element={<RouteGuard requireAdmin><AdminDashboard /></RouteGuard>} />
            <Route path="/view-modules" element={<RouteGuard requireAdmin><ViewModules /></RouteGuard>} />
            <Route path="/upload-module" element={<RouteGuard requireAdmin><UploadModule /></RouteGuard>} />
            <Route path="/create-user" element={<RouteGuard requireAdmin><CreateUser /></RouteGuard>} />
            <Route path="/view-users" element={<RouteGuard requireAdmin><ViewUsers /></RouteGuard>} />
            <Route path="/assign-modules" element={<RouteGuard requireAdmin><AssignModules /></RouteGuard>} />
            <Route path="/view-requests" element={<RouteGuard requireAdmin><ViewRequests /></RouteGuard>} />
            <Route path="/write-recommendations" element={<RouteGuard requireAdmin><WriteRecommendations /></RouteGuard>} />
            <Route path="/edit-module/:moduleId" element={<RouteGuard requireAdmin><EditModule /></RouteGuard>} />
            <Route path="/adapt-lynqs" element={<RouteGuard requireAdmin><AdaptLynqs /></RouteGuard>} />
            <Route path="/admin/client-requests" element={<RouteGuard requireAdmin><ClientRequests /></RouteGuard>} />
            <Route path="/admin/adaptive-requests" element={<RouteGuard requireAdmin><AdaptiveRequests /></RouteGuard>} />
            <Route path="/admin/tweak-requests" element={<RouteGuard requireAdmin><TweakRequests /></RouteGuard>} />
            <Route path="/admin/manage-questions" element={<RouteGuard requireAdmin><ManageQuestions /></RouteGuard>} />
            <Route path="/admin/manage-adaptive-ideas" element={<RouteGuard requireAdmin><ManageAdaptiveIdeas /></RouteGuard>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
