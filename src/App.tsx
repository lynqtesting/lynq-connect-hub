import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ModuleDetails from "./pages/ModuleDetails";
import RequestForm from "./pages/RequestForm";
import NotFound from "./pages/NotFound";
import UploadModule from "./pages/UploadModule";
import AssignModules from "./pages/AssignModules";
import ViewRequests from "./pages/ViewRequests";
import WriteRecommendations from "./pages/WriteRecommendations";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/module/:moduleId" element={<ModuleDetails />} />
          <Route path="/request/new/:moduleId" element={<RequestForm type="new" />} />
          <Route path="/request/adapt/:moduleId" element={<RequestForm type="adapt" />} />
          <Route path="/upload-module" element={<UploadModule />} />
          <Route path="/assign-modules" element={<AssignModules />} />
          <Route path="/view-requests" element={<ViewRequests />} />
          <Route path="/write-recommendations" element={<WriteRecommendations />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
