import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ImpersonationProvider } from "@/context/ImpersonationContext";
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
import AgentDetail from "./pages/app/AgentDetail";
import ConversationsPage from "./pages/app/Conversations";
import AnalyticsPage from "./pages/app/Analytics";
import CompanyDetail from "./pages/superadmin/CompanyDetail";
import SettingsPage from "./pages/app/Settings";
import ContactsPage from "./pages/app/Contacts";
import ContactDetailPage from "./pages/app/ContactDetail";
import ContactListsPage from "./pages/app/ContactLists";
import CampaignsPage from "./pages/app/Campaigns";
import ImportContactsPage from "./pages/app/ImportContacts";
import CreateCampaignPage from "./pages/app/CreateCampaign";
import CampaignDetailPage from "./pages/app/CampaignDetail";
import ContactListDetailPage from "./pages/app/ContactListDetail";
import CreditsPage from "./pages/app/Credits";
import PhoneNumbersPage from "./pages/app/PhoneNumbers";
import BuyPhoneNumberPage from "./pages/app/BuyPhoneNumber";
import KnowledgeBasePage from "./pages/app/KnowledgeBase";
import TeamPage from "./pages/superadmin/Team";
import SASettingsPage from "./pages/superadmin/SASettings";
import GlobalAnalyticsPage from "./pages/superadmin/GlobalAnalytics";
import ApiKeysPage from "./pages/superadmin/ApiKeys";
import SystemLogsPage from "./pages/superadmin/SystemLogs";
import PlatformSettingsPage from "./pages/superadmin/PlatformSettings";
import WhatsAppPage from "./pages/app/WhatsApp";
import WhatsAppAdminPage from "./pages/superadmin/WhatsAppAdmin";

const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ImpersonationProvider>
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
                <Route path="/superadmin/companies/:id" element={<CompanyDetail />} />
                <Route path="/superadmin/whatsapp" element={<WhatsAppAdminPage />} />
                <Route path="/superadmin/team" element={<TeamPage />} />
                <Route path="/superadmin/settings" element={<SASettingsPage />} />
                <Route path="/superadmin/analytics" element={<GlobalAnalyticsPage />} />
                <Route path="/superadmin/api-keys" element={<ApiKeysPage />} />
                <Route path="/superadmin/logs" element={<SystemLogsPage />} />
                <Route path="/superadmin/platform-settings" element={<PlatformSettingsPage />} />
              </Route>
            </Route>

            {/* Company routes */}
            <Route element={<AuthGuard requiredRole="company" />}>
              <Route element={<Shell />}>
                <Route path="/app" element={<AppDashboard />} />
                <Route path="/app/agents" element={<AgentsPage />} />
                <Route path="/app/agents/new" element={<CreateAgent />} />
                <Route path="/app/agents/:id" element={<AgentDetail />} />
                <Route path="/app/conversations" element={<ConversationsPage />} />
                <Route path="/app/contacts" element={<ContactsPage />} />
                <Route path="/app/contacts/import" element={<ImportContactsPage />} />
                <Route path="/app/contacts/:id" element={<ContactDetailPage />} />
                <Route path="/app/phone-numbers" element={<PhoneNumbersPage />} />
                <Route path="/app/phone-numbers/buy" element={<BuyPhoneNumberPage />} />
                <Route path="/app/knowledge-base" element={<KnowledgeBasePage />} />
                <Route path="/app/lists" element={<ContactListsPage />} />
                <Route path="/app/lists/:id" element={<ContactListDetailPage />} />
                <Route path="/app/campaigns" element={<CampaignsPage />} />
                <Route path="/app/campaigns/new" element={<CreateCampaignPage />} />
                <Route path="/app/campaigns/:id" element={<CampaignDetailPage />} />
                <Route path="/app/analytics" element={<AnalyticsPage />} />
                <Route path="/app/credits" element={<CreditsPage />} />
                <Route path="/app/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </ImpersonationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
