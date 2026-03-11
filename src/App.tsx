import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ImpersonationProvider } from "@/context/ImpersonationContext";
import ScrollToTop from "./components/ScrollToTop";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Eagerly loaded (landing + auth)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import AuthGuard from "./components/auth/AuthGuard";
import Shell from "./components/layout/Shell";

// Auth pages (lazy)
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Lazy-loaded marketing pages
const Solutions = lazy(() => import("./pages/Solutions"));
const ChiSiamo = lazy(() => import("./pages/ChiSiamo"));
const ComeFunziona = lazy(() => import("./pages/ComeFunziona"));
const Garanzia = lazy(() => import("./pages/Garanzia"));
const Tariffe = lazy(() => import("./pages/Tariffe"));
const PerChiE = lazy(() => import("./pages/PerChiE"));
const PerChiEDetail = lazy(() => import("./pages/PerChiEDetail"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));

// Lazy-loaded SuperAdmin pages
const SuperAdminDashboard = lazy(() => import("./pages/superadmin/Dashboard"));
const Companies = lazy(() => import("./pages/superadmin/Companies"));
const CreateCompany = lazy(() => import("./pages/superadmin/CreateCompany"));
const CompanyDetail = lazy(() => import("./pages/superadmin/CompanyDetail"));
const WhatsAppAdminPage = lazy(() => import("./pages/superadmin/WhatsAppAdmin"));
const SATemplatesPage = lazy(() => import("./pages/superadmin/Templates"));
const TeamPage = lazy(() => import("./pages/superadmin/Team"));
const SASettingsPage = lazy(() => import("./pages/superadmin/SASettings"));
const GlobalAnalyticsPage = lazy(() => import("./pages/superadmin/GlobalAnalytics"));
const ApiKeysPage = lazy(() => import("./pages/superadmin/ApiKeys"));
const SystemLogsPage = lazy(() => import("./pages/superadmin/SystemLogs"));
const PlatformSettingsPage = lazy(() => import("./pages/superadmin/PlatformSettings"));
const RenderConfig = lazy(() => import("./pages/superadmin/RenderConfig"));

// Lazy-loaded Company pages
const AppDashboard = lazy(() => import("./pages/app/Dashboard"));
const AgentsPage = lazy(() => import("./pages/app/Agents"));
const AgentTemplateWizard = lazy(() => import("./pages/app/AgentTemplateWizard"));
const CreateAgent = lazy(() => import("./pages/app/CreateAgent"));
const AgentDetail = lazy(() => import("./pages/app/AgentDetail"));
const ConversationsPage = lazy(() => import("./pages/app/Conversations"));
const AnalyticsPage = lazy(() => import("./pages/app/Analytics"));
const SettingsPage = lazy(() => import("./pages/app/Settings"));
const ContactsPage = lazy(() => import("./pages/app/Contacts"));
const ContactDetailPage = lazy(() => import("./pages/app/ContactDetail"));
const ContactListsPage = lazy(() => import("./pages/app/ContactLists"));
const CampaignsPage = lazy(() => import("./pages/app/Campaigns"));
const ImportContactsPage = lazy(() => import("./pages/app/ImportContacts"));
const CreateCampaignPage = lazy(() => import("./pages/app/CreateCampaign"));
const CampaignDetailPage = lazy(() => import("./pages/app/CampaignDetail"));
const ContactListDetailPage = lazy(() => import("./pages/app/ContactListDetail"));
const CreditsPage = lazy(() => import("./pages/app/Credits"));
const PhoneNumbersPage = lazy(() => import("./pages/app/PhoneNumbers"));
const BuyPhoneNumberPage = lazy(() => import("./pages/app/BuyPhoneNumber"));
const KnowledgeBasePage = lazy(() => import("./pages/app/KnowledgeBase"));
const TemplatesPage = lazy(() => import("./pages/app/Templates"));
const TemplateDetailPage = lazy(() => import("./pages/app/TemplateDetail"));
const TemplateSetupPage = lazy(() => import("./pages/app/TemplateSetup"));
const WhatsAppPage = lazy(() => import("./pages/app/WhatsApp"));
const RenderHub = lazy(() => import("./pages/app/RenderHub"));
const RenderNew = lazy(() => import("./pages/app/RenderNew"));
const RenderGallery = lazy(() => import("./pages/app/RenderGallery"));
const RenderGalleryDetail = lazy(() => import("./pages/app/RenderGalleryDetail"));
const CantierePage = lazy(() => import("./pages/app/Cantieri"));
const CantiereDetail = lazy(() => import("./pages/app/CantiereDetail"));
const CantiereConfig = lazy(() => import("./pages/app/CantiereConfig"));
const PreventiviList = lazy(() => import("./pages/app/PreventiviList"));
const NuovoPreventivo = lazy(() => import("./pages/app/NuovoPreventivo"));
const PreventivoDetail = lazy(() => import("./pages/app/PreventivoDetail"));
const DocumentiScadenze = lazy(() => import("./pages/app/DocumentiScadenze"));
const FoglioPresenze = lazy(() => import("./pages/app/FoglioPresenze"));
const TemplatePreventivo = lazy(() => import("./pages/app/TemplatePreventivo"));
const Integrations = lazy(() => import("./pages/app/Integrations"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
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
            <Route path="/signup" element={<Signup />} />

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
          </Suspense>
          </ImpersonationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
