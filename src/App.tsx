import { lazy, Suspense, ReactNode } from "react";
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
const PublicShareViewer = lazy(() => import("./pages/public/PublicShareViewer"));

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
const OffertaAgenteVocale = lazy(() => import("./pages/offerta/AgentiVocale"));

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
const MonitoringPage = lazy(() => import("./pages/superadmin/Monitoring"));

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
const Automations = lazy(() => import("./pages/app/Automations"));
const OnboardingPage = lazy(() => import("./pages/app/Onboarding"));
const CallMonitor = lazy(() => import("./pages/app/CallMonitor"));
const ScheduledCalls = lazy(() => import("./pages/app/ScheduledCalls"));
const RenderBagnoHub = lazy(() => import("./pages/app/RenderBagnoHub"));
const RenderBagnoNew = lazy(() => import("./pages/app/RenderBagnoNew"));
const RenderFacciataHub = lazy(() => import("./pages/app/RenderFacciataHub"));
const RenderFacciataNew = lazy(() => import("./pages/app/RenderFacciataNew"));
const RenderPersianeHub = lazy(() => import("./pages/app/RenderPersianeHub"));
const RenderPersianeNew = lazy(() => import("./pages/app/RenderPersianeNew"));
const RenderPavimentoHub = lazy(() => import("./pages/app/RenderPavimentoHub"));
const RenderPavimentoNew = lazy(() => import("./pages/app/RenderPavimentoNew"));
const RenderStanzaHub = lazy(() => import("./pages/app/RenderStanzaHub"));
const RenderStanzaNew = lazy(() => import("./pages/app/RenderStanzaNew"));
const RenderTettoHub = lazy(() => import("./pages/app/RenderTettoHub"));
const RenderTettoNew = lazy(() => import("./pages/app/RenderTettoNew"));
const KnowledgeBasePreventivo = lazy(() => import("./pages/app/KnowledgeBasePreventivo"));
const PreventivoTemplateList = lazy(() => import("./pages/app/PreventivoTemplateList"));
const PreventivoTemplateBuilder = lazy(() => import("./pages/app/PreventivoTemplateBuilder"));
const PreventivoHub = lazy(() => import("./pages/app/PreventivoHub"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

/** Wraps a lazy page in ErrorBoundary + Suspense */
function SafeRoute({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
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
            <Route path="/soluzioni" element={<SafeRoute><Solutions /></SafeRoute>} />
            <Route path="/per-chi-e" element={<SafeRoute><PerChiE /></SafeRoute>} />
            <Route path="/per-chi-e/:slug" element={<SafeRoute><PerChiEDetail /></SafeRoute>} />
            <Route path="/chi-siamo" element={<SafeRoute><ChiSiamo /></SafeRoute>} />
            <Route path="/come-funziona" element={<SafeRoute><ComeFunziona /></SafeRoute>} />
            <Route path="/garanzia" element={<SafeRoute><Garanzia /></SafeRoute>} />
            <Route path="/tariffe" element={<SafeRoute><Tariffe /></SafeRoute>} />
            <Route path="/blog" element={<SafeRoute><Blog /></SafeRoute>} />
            <Route path="/blog/:slug" element={<SafeRoute><BlogPost /></SafeRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<SafeRoute><ForgotPassword /></SafeRoute>} />
            <Route path="/reset-password" element={<SafeRoute><ResetPassword /></SafeRoute>} />
            <Route path="/s/:token" element={<SafeRoute><PublicShareViewer /></SafeRoute>} />

            {/* SuperAdmin routes */}
            <Route element={<AuthGuard requiredRole="superadmin" />}>
              <Route element={<Shell />}>
                <Route path="/superadmin" element={<SafeRoute><SuperAdminDashboard /></SafeRoute>} />
                <Route path="/superadmin/companies" element={<SafeRoute><Companies /></SafeRoute>} />
                <Route path="/superadmin/companies/new" element={<SafeRoute><CreateCompany /></SafeRoute>} />
                <Route path="/superadmin/companies/:id" element={<SafeRoute><CompanyDetail /></SafeRoute>} />
                <Route path="/superadmin/whatsapp" element={<SafeRoute><WhatsAppAdminPage /></SafeRoute>} />
                <Route path="/superadmin/templates" element={<SafeRoute><SATemplatesPage /></SafeRoute>} />
                <Route path="/superadmin/team" element={<SafeRoute><TeamPage /></SafeRoute>} />
                <Route path="/superadmin/settings" element={<SafeRoute><SASettingsPage /></SafeRoute>} />
                <Route path="/superadmin/analytics" element={<SafeRoute><GlobalAnalyticsPage /></SafeRoute>} />
                <Route path="/superadmin/api-keys" element={<SafeRoute><ApiKeysPage /></SafeRoute>} />
                <Route path="/superadmin/logs" element={<SafeRoute><SystemLogsPage /></SafeRoute>} />
                <Route path="/superadmin/platform-settings" element={<SafeRoute><PlatformSettingsPage /></SafeRoute>} />
                <Route path="/superadmin/render-config" element={<SafeRoute><RenderConfig /></SafeRoute>} />
                <Route path="/superadmin/monitoring" element={<SafeRoute><MonitoringPage /></SafeRoute>} />
              </Route>
            </Route>

            {/* Company routes */}
            <Route element={<AuthGuard requiredRole="company" />}>
              <Route element={<Shell />}>
                <Route path="/app" element={<SafeRoute><AppDashboard /></SafeRoute>} />
                <Route path="/app/onboarding" element={<SafeRoute><OnboardingPage /></SafeRoute>} />
                <Route path="/app/agents" element={<SafeRoute><AgentsPage /></SafeRoute>} />
                <Route path="/app/agents/new" element={<SafeRoute><CreateAgent /></SafeRoute>} />
                <Route path="/app/agents/new/:slug" element={<SafeRoute><AgentTemplateWizard /></SafeRoute>} />
                <Route path="/app/agents/:id" element={<SafeRoute><AgentDetail /></SafeRoute>} />
                <Route path="/app/conversations" element={<SafeRoute><ConversationsPage /></SafeRoute>} />
                <Route path="/app/contacts" element={<SafeRoute><ContactsPage /></SafeRoute>} />
                <Route path="/app/contacts/import" element={<SafeRoute><ImportContactsPage /></SafeRoute>} />
                <Route path="/app/contacts/:id" element={<SafeRoute><ContactDetailPage /></SafeRoute>} />
                <Route path="/app/phone-numbers" element={<SafeRoute><PhoneNumbersPage /></SafeRoute>} />
                <Route path="/app/phone-numbers/buy" element={<SafeRoute><BuyPhoneNumberPage /></SafeRoute>} />
                <Route path="/app/knowledge-base" element={<SafeRoute><KnowledgeBasePage /></SafeRoute>} />
                <Route path="/app/templates" element={<SafeRoute><TemplatesPage /></SafeRoute>} />
                <Route path="/app/templates/:slug" element={<SafeRoute><TemplateDetailPage /></SafeRoute>} />
                <Route path="/app/templates/:slug/setup" element={<SafeRoute><TemplateSetupPage /></SafeRoute>} />
                <Route path="/app/whatsapp" element={<SafeRoute><WhatsAppPage /></SafeRoute>} />
                <Route path="/app/cantieri" element={<SafeRoute><CantierePage /></SafeRoute>} />
                <Route path="/app/cantieri/configurazione" element={<SafeRoute><CantiereConfig /></SafeRoute>} />
                <Route path="/app/cantieri/:id" element={<SafeRoute><CantiereDetail /></SafeRoute>} />
                <Route path="/app/preventivi" element={<SafeRoute><PreventiviList /></SafeRoute>} />
                <Route path="/app/preventivi/nuovo" element={<SafeRoute><NuovoPreventivo /></SafeRoute>} />
                <Route path="/app/preventivi/:id" element={<SafeRoute><PreventivoDetail /></SafeRoute>} />
                <Route path="/app/documenti" element={<SafeRoute><DocumentiScadenze /></SafeRoute>} />
                <Route path="/app/presenze" element={<SafeRoute><FoglioPresenze /></SafeRoute>} />
                <Route path="/app/impostazioni/template-preventivo" element={<SafeRoute><TemplatePreventivo /></SafeRoute>} />
                <Route path="/app/render" element={<SafeRoute><RenderHub /></SafeRoute>} />
                <Route path="/app/render/new" element={<SafeRoute><RenderNew /></SafeRoute>} />
                <Route path="/app/render/gallery" element={<SafeRoute><RenderGallery /></SafeRoute>} />
                <Route path="/app/render/gallery/:id" element={<SafeRoute><RenderGalleryDetail /></SafeRoute>} />
                <Route path="/app/render-bagno" element={<SafeRoute><RenderBagnoHub /></SafeRoute>} />
                <Route path="/app/render-bagno/new" element={<SafeRoute><RenderBagnoNew /></SafeRoute>} />
                <Route path="/app/render-facciata" element={<SafeRoute><RenderFacciataHub /></SafeRoute>} />
                <Route path="/app/render-facciata/new" element={<SafeRoute><RenderFacciataNew /></SafeRoute>} />
                <Route path="/app/render-persiane" element={<SafeRoute><RenderPersianeHub /></SafeRoute>} />
                <Route path="/app/render-persiane/new" element={<SafeRoute><RenderPersianeNew /></SafeRoute>} />
                <Route path="/app/render-pavimento" element={<SafeRoute><RenderPavimentoHub /></SafeRoute>} />
                <Route path="/app/render-pavimento/new" element={<SafeRoute><RenderPavimentoNew /></SafeRoute>} />
                <Route path="/app/render-stanza" element={<SafeRoute><RenderStanzaHub /></SafeRoute>} />
                <Route path="/app/render-stanza/new" element={<SafeRoute><RenderStanzaNew /></SafeRoute>} />
                <Route path="/app/render-tetto" element={<SafeRoute><RenderTettoHub /></SafeRoute>} />
                <Route path="/app/render-tetto/new" element={<SafeRoute><RenderTettoNew /></SafeRoute>} />
                <Route path="/app/lists" element={<SafeRoute><ContactListsPage /></SafeRoute>} />
                <Route path="/app/lists/:id" element={<SafeRoute><ContactListDetailPage /></SafeRoute>} />
                <Route path="/app/campaigns" element={<SafeRoute><CampaignsPage /></SafeRoute>} />
                <Route path="/app/campaigns/new" element={<SafeRoute><CreateCampaignPage /></SafeRoute>} />
                <Route path="/app/campaigns/:id" element={<SafeRoute><CampaignDetailPage /></SafeRoute>} />
                <Route path="/app/analytics" element={<SafeRoute><AnalyticsPage /></SafeRoute>} />
                <Route path="/app/credits" element={<SafeRoute><CreditsPage /></SafeRoute>} />
                <Route path="/app/settings" element={<SafeRoute><SettingsPage /></SafeRoute>} />
                <Route path="/app/integrations" element={<SafeRoute><Integrations /></SafeRoute>} />
                <Route path="/app/automations" element={<SafeRoute><Automations /></SafeRoute>} />
                <Route path="/app/call-monitor" element={<SafeRoute><CallMonitor /></SafeRoute>} />
                <Route path="/app/scheduled-calls" element={<SafeRoute><ScheduledCalls /></SafeRoute>} />
                <Route path="/app/preventivo-hub" element={<SafeRoute><PreventivoHub /></SafeRoute>} />
                <Route path="/app/preventivo-kb" element={<SafeRoute><KnowledgeBasePreventivo /></SafeRoute>} />
                <Route path="/app/preventivi/templates" element={<SafeRoute><PreventivoTemplateList /></SafeRoute>} />
                <Route path="/app/preventivi/templates/nuovo" element={<SafeRoute><PreventivoTemplateBuilder /></SafeRoute>} />
                <Route path="/app/preventivi/templates/:id" element={<SafeRoute><PreventivoTemplateBuilder /></SafeRoute>} />
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
  </ErrorBoundary>
);

export default App;
