import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Solutions from "./pages/Solutions";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AuthGuard from "./components/auth/AuthGuard";
import Shell from "./components/layout/Shell";
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import Companies from "./pages/superadmin/Companies";
import CreateCompany from "./pages/superadmin/CreateCompany";
import AppDashboard from "./pages/app/Dashboard";
import AgentsPage from "./pages/app/Agents";
import CreateAgent from "./pages/app/CreateAgent";

const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/soluzioni" element={<Solutions />} />
            <Route path="/login" element={<Login />} />

            {/* SuperAdmin routes */}
            <Route element={<AuthGuard requiredRole="superadmin" />}>
              <Route element={<Shell />}>
                <Route path="/superadmin" element={<SuperAdminDashboard />} />
                <Route path="/superadmin/companies" element={<Companies />} />
                <Route path="/superadmin/companies/new" element={<CreateCompany />} />
              </Route>
            </Route>

            {/* Company routes */}
            <Route element={<AuthGuard requiredRole="company" />}>
              <Route element={<Shell />}>
                <Route path="/app" element={<AppDashboard />} />
                <Route path="/app/agents" element={<AgentsPage />} />
                <Route path="/app/agents/new" element={<CreateAgent />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
