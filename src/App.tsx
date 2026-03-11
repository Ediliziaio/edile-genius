import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ImpersonationProvider } from "@/context/ImpersonationContext";
import Index from "./pages/Index";
import Solutions from "./pages/Solutions";
import ChiSiamo from "./pages/ChiSiamo";
import ComeFunziona from "./pages/ComeFunziona";
import Garanzia from "./pages/Garanzia";
import Tariffe from "./pages/Tariffe";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthGuard from "./components/auth/AuthGuard";
import ScrollToTop from "./components/ScrollToTop";
import Shell from "./components/layout/Shell";
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import Companies from "./pages/superadmin/Companies";
import CreateCompany from "./pages/superadmin/CreateCompany";
import AppDashboard from "./pages/app/Dashboard";
import AgentsPage from "./pages/app/Agents";
import AgentTemplateWizard from "./pages/app/AgentTemplateWizard";
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
import TemplatesPage from "./pages/app/Templates";
import TemplateDetailPage from "./pages/app/TemplateDetail";
import TemplateSetupPage from "./pages/app/TemplateSetup";
import TeamPage from "./pages/superadmin/Team";
import SASettingsPage from "./pages/superadmin/SASettings";
import GlobalAnalyticsPage from "./pages/superadmin/GlobalAnalytics";
import ApiKeysPage from "./pages/superadmin/ApiKeys";
import SystemLogsPage from "./pages/superadmin/SystemLogs";
import PlatformSettingsPage from "./pages/superadmin/PlatformSettings";
import SATemplatesPage from "./pages/superadmin/Templates";
import WhatsAppPage from "./pages/app/WhatsApp";
import WhatsAppAdminPage from "./pages/superadmin/WhatsAppAdmin";
import RenderHub from "./pages/app/RenderHub";
import RenderNew from "./pages/app/RenderNew";
import RenderGallery from "./pages/app/RenderGallery";
import RenderGalleryDetail from "./pages/app/RenderGalleryDetail";
import RenderConfig from "./pages/superadmin/RenderConfig";
import PerChiE from "./pages/PerChiE";
import PerChiEDetail from "./pages/PerChiEDetail";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import CantierePage from "./pages/app/Cantieri";
import CantiereDetail from "./pages/app/CantiereDetail";
import CantiereConfig from "./pages/app/CantiereConfig";
import PreventiviList from "./pages/app/PreventiviList";
import NuovoPreventivo from "./pages/app/NuovoPreventivo";
import PreventivoDetail from "./pages/app/PreventivoDetail";
import DocumentiScadenze from "./pages/app/DocumentiScadenze";
import FoglioPresenze from "./pages/app/FoglioPresenze";
import TemplatePreventivo from "./pages/app/TemplatePreventivo";
import Integrations from "./pages/app/Integrations";

const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <ImpersonationProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/soluzioni" element={<Solutions />} />
            <Route path="/per-chi-e" element={<PerChiE />} />
            <Route path="/per-chi-e/:slug" element={<PerChiEDetail />} />
            <Route path="/chi-siamo" element={<ChiSiamo />} />
            <Route path="/come-funziona" element={<ComeFunziona />} />
            <Route path="/garanzia" element={<Garanzia />} />
            <Route path="/tariffe" element={<Tariffe />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/login" element={<Login />} />

            {/* SuperAdmin routes */}
            <Route element={<AuthGuard requiredRole="superadmin" />}>
              <Route element={<Shell />}>
                <Route path="/superadmin" element={<SuperAdminDashboard />} />
                <Route path="/superadmin/companies" element={<Companies />} />
                <Route path="/superadmin/companies/new" element={<CreateCompany />} />
                <Route path="/superadmin/companies/:id" element={<CompanyDetail />} />
                <Route path="/superadmin/whatsapp" element={<WhatsAppAdminPage />} />
                <Route path="/superadmin/templates" element={<SATemplatesPage />} />
                <Route path="/superadmin/team" element={<TeamPage />} />
                <Route path="/superadmin/settings" element={<SASettingsPage />} />
                <Route path="/superadmin/analytics" element={<GlobalAnalyticsPage />} />
                <Route path="/superadmin/api-keys" element={<ApiKeysPage />} />
                <Route path="/superadmin/logs" element={<SystemLogsPage />} />
                <Route path="/superadmin/platform-settings" element={<PlatformSettingsPage />} />
                <Route path="/superadmin/render-config" element={<RenderConfig />} />
              </Route>
            </Route>

            {/* Company routes */}
            <Route element={<AuthGuard requiredRole="company" />}>
              <Route element={<Shell />}>
                <Route path="/app" element={<AppDashboard />} />
                <Route path="/app/agents" element={<AgentsPage />} />
                <Route path="/app/agents/new" element={<CreateAgent />} />
                <Route path="/app/agents/new/:slug" element={<AgentTemplateWizard />} />
                <Route path="/app/agents/:id" element={<AgentDetail />} />
                <Route path="/app/conversations" element={<ConversationsPage />} />
                <Route path="/app/contacts" element={<ContactsPage />} />
                <Route path="/app/contacts/import" element={<ImportContactsPage />} />
                <Route path="/app/contacts/:id" element={<ContactDetailPage />} />
                <Route path="/app/phone-numbers" element={<PhoneNumbersPage />} />
                <Route path="/app/phone-numbers/buy" element={<BuyPhoneNumberPage />} />
                <Route path="/app/knowledge-base" element={<KnowledgeBasePage />} />
                <Route path="/app/templates" element={<TemplatesPage />} />
                <Route path="/app/templates/:slug" element={<TemplateDetailPage />} />
                <Route path="/app/templates/:slug/setup" element={<TemplateSetupPage />} />
                <Route path="/app/whatsapp" element={<WhatsAppPage />} />
                <Route path="/app/cantieri" element={<CantierePage />} />
                <Route path="/app/cantieri/configurazione" element={<CantiereConfig />} />
                <Route path="/app/cantieri/:id" element={<CantiereDetail />} />
                <Route path="/app/preventivi" element={<PreventiviList />} />
                <Route path="/app/preventivi/nuovo" element={<NuovoPreventivo />} />
                <Route path="/app/preventivi/:id" element={<PreventivoDetail />} />
                <Route path="/app/documenti" element={<DocumentiScadenze />} />
                <Route path="/app/presenze" element={<FoglioPresenze />} />
                <Route path="/app/impostazioni/template-preventivo" element={<TemplatePreventivo />} />
                <Route path="/app/render" element={<RenderHub />} />
                <Route path="/app/render/new" element={<RenderNew />} />
                <Route path="/app/render/gallery" element={<RenderGallery />} />
                <Route path="/app/render/gallery/:id" element={<RenderGalleryDetail />} />
                <Route path="/app/lists" element={<ContactListsPage />} />
                <Route path="/app/lists/:id" element={<ContactListDetailPage />} />
                <Route path="/app/campaigns" element={<CampaignsPage />} />
                <Route path="/app/campaigns/new" element={<CreateCampaignPage />} />
                <Route path="/app/campaigns/:id" element={<CampaignDetailPage />} />
                <Route path="/app/analytics" element={<AnalyticsPage />} />
                <Route path="/app/credits" element={<CreditsPage />} />
                <Route path="/app/settings" element={<SettingsPage />} />
                <Route path="/app/integrations" element={<Integrations />} />
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
