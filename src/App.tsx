import { lazy, Suspense, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import type { RouteRecord } from "vite-react-ssg";
import { blogPosts } from "./data/blogPosts";
import { perChiECategories } from "./data/perChiE";
import { SERVIZI } from "./data/servizi";
import { AuthProvider } from "@/context/AuthContext";
import { ImpersonationProvider } from "@/context/ImpersonationContext";
import ScrollToTop from "./components/ScrollToTop";
import SubdomainRouter from "./components/SubdomainRouter";
import MetaPixelPageView from "./components/MetaPixelPageView";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Eagerly loaded (landing + auth)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import AuthGuard from "./components/auth/AuthGuard";
import Shell from "./components/layout/Shell";
import FeatureGate from "./components/auth/FeatureGate";

// Auth pages (lazy)
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PublicShareViewer = lazy(() => import("./pages/public/PublicShareViewer"));
const AccettaInvito = lazy(() => import("./pages/AccettaInvito"));

// Lazy-loaded marketing pages
const Solutions = lazy(() => import("./pages/Solutions"));
const Servizi = lazy(() => import("./pages/Servizi"));
const ServizioDetail = lazy(() => import("./pages/ServizioDetail"));
const ChiSiamo = lazy(() => import("./pages/ChiSiamo"));
const ComeFunziona = lazy(() => import("./pages/ComeFunziona"));
const Garanzia = lazy(() => import("./pages/Garanzia"));
const PerChiE = lazy(() => import("./pages/PerChiE"));
const PerChiEDetail = lazy(() => import("./pages/PerChiEDetail"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const EdiliziaInCloud = lazy(() => import("./pages/EdiliziaInCloud"));
const Grazie = lazy(() => import("./pages/Grazie"));

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
const RenderBagnoGalleryDetail = lazy(() => import("./pages/app/RenderBagnoGalleryDetail"));
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
const ListinoVociManager = lazy(() => import("./pages/app/ListinoVociManager"));
const InternalCampaignsPage = lazy(() => import("./modules/ai-agents-internal/pages/InternalCampaignsPage"));
const InternalCallLogsPage = lazy(() => import("./modules/ai-agents-internal/pages/InternalCallLogsPage"));
const PreventivoTemplateList = lazy(() => import("./pages/app/PreventivoTemplateList"));
const PreventivoTemplateBuilder = lazy(() => import("./pages/app/PreventivoTemplateBuilder"));
const PreventivoHub = lazy(() => import("./pages/app/PreventivoHub"));
const PreventivoAgentSetup = lazy(() => import("./pages/app/PreventivoAgentSetup"));

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Layout radice: provider globali + router utilities + <Outlet/>.
 * Con vite-react-ssg il router è fornito dall'entry (main.tsx), quindi qui
 * NON c'è più <BrowserRouter> — al suo posto <Outlet/> per le rotte figlie.
 */
function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ScrollToTop />
          <SubdomainRouter />
          <MetaPixelPageView />
          <AuthProvider>
            <ImpersonationProvider>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </ImpersonationProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // ── Pagine pubbliche (prerenderizzate) ──
      { index: true, element: <Index /> },
      { path: "servizi", element: <SafeRoute><Servizi /></SafeRoute> },
      {
        path: "servizi/:slug",
        element: <SafeRoute><ServizioDetail /></SafeRoute>,
        getStaticPaths: () => SERVIZI.map((s) => `/servizi/${s.slug}`),
      },
      { path: "soluzioni", element: <SafeRoute><Solutions /></SafeRoute> },
      { path: "per-chi-e", element: <SafeRoute><PerChiE /></SafeRoute> },
      {
        path: "per-chi-e/:slug",
        element: <SafeRoute><PerChiEDetail /></SafeRoute>,
        getStaticPaths: () => perChiECategories.map((c) => `/per-chi-e/${c.slug}`),
      },
      { path: "chi-siamo", element: <SafeRoute><ChiSiamo /></SafeRoute> },
      { path: "come-funziona", element: <SafeRoute><ComeFunziona /></SafeRoute> },
      { path: "garanzia", element: <SafeRoute><Garanzia /></SafeRoute> },
      { path: "blog", element: <SafeRoute><Blog /></SafeRoute> },
      {
        path: "blog/:slug",
        element: <SafeRoute><BlogPost /></SafeRoute>,
        getStaticPaths: () => blogPosts.map((p) => `/blog/${p.slug}`),
      },
      { path: "privacy-policy", element: <SafeRoute><LegalPage doc="privacy" /></SafeRoute> },
      { path: "cookie-policy", element: <SafeRoute><LegalPage doc="cookie" /></SafeRoute> },
      { path: "termini-di-servizio", element: <SafeRoute><LegalPage doc="termini" /></SafeRoute> },
      { path: "edilizia-in-cloud", element: <SafeRoute><EdiliziaInCloud /></SafeRoute> },
      { path: "grazie", element: <SafeRoute><Grazie /></SafeRoute> },

      // ── Rotte client-only (auth / offerte / share) — NON prerenderizzate ──
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path: "forgot-password", element: <SafeRoute><ForgotPassword /></SafeRoute> },
      { path: "reset-password", element: <SafeRoute><ResetPassword /></SafeRoute> },
      { path: "s/:token", element: <SafeRoute><PublicShareViewer /></SafeRoute> },
      { path: "accetta-invito", element: <SafeRoute><AccettaInvito /></SafeRoute> },

      // ── SuperAdmin ──
      {
        element: <AuthGuard requiredRole="superadmin" />,
        children: [
          {
            element: <Shell />,
            children: [
              { path: "superadmin", element: <SafeRoute><SuperAdminDashboard /></SafeRoute> },
              { path: "superadmin/companies", element: <SafeRoute><Companies /></SafeRoute> },
              { path: "superadmin/companies/new", element: <SafeRoute><CreateCompany /></SafeRoute> },
              { path: "superadmin/companies/:id", element: <SafeRoute><CompanyDetail /></SafeRoute> },
              { path: "superadmin/whatsapp", element: <SafeRoute><WhatsAppAdminPage /></SafeRoute> },
              { path: "superadmin/templates", element: <SafeRoute><SATemplatesPage /></SafeRoute> },
              { path: "superadmin/team", element: <SafeRoute><TeamPage /></SafeRoute> },
              { path: "superadmin/settings", element: <SafeRoute><SASettingsPage /></SafeRoute> },
              { path: "superadmin/analytics", element: <SafeRoute><GlobalAnalyticsPage /></SafeRoute> },
              { path: "superadmin/api-keys", element: <SafeRoute><ApiKeysPage /></SafeRoute> },
              { path: "superadmin/logs", element: <SafeRoute><SystemLogsPage /></SafeRoute> },
              { path: "superadmin/platform-settings", element: <SafeRoute><PlatformSettingsPage /></SafeRoute> },
              { path: "superadmin/render-config", element: <SafeRoute><RenderConfig /></SafeRoute> },
              { path: "superadmin/monitoring", element: <SafeRoute><MonitoringPage /></SafeRoute> },
            ],
          },
        ],
      },

      // ── Company (app) ──
      {
        element: <AuthGuard requiredRole="company" />,
        children: [
          {
            element: <Shell />,
            children: [
              { path: "app", element: <SafeRoute><AppDashboard /></SafeRoute> },
              { path: "app/onboarding", element: <SafeRoute><OnboardingPage /></SafeRoute> },
              // ── Agenti AI ──
              { path: "app/agents", element: <SafeRoute><FeatureGate featureId="agente_vendita"><AgentsPage /></FeatureGate></SafeRoute> },
              { path: "app/agents/new", element: <SafeRoute><FeatureGate featureId="agente_vendita"><CreateAgent /></FeatureGate></SafeRoute> },
              { path: "app/agents/new/:slug", element: <SafeRoute><FeatureGate featureId="agente_vendita"><AgentTemplateWizard /></FeatureGate></SafeRoute> },
              { path: "app/agents/:id", element: <SafeRoute><FeatureGate featureId="agente_vendita"><AgentDetail /></FeatureGate></SafeRoute> },
              { path: "app/conversations", element: <SafeRoute><FeatureGate featureId="agente_vendita"><ConversationsPage /></FeatureGate></SafeRoute> },
              { path: "app/campaigns", element: <SafeRoute><FeatureGate featureId="agente_vendita"><CampaignsPage /></FeatureGate></SafeRoute> },
              { path: "app/campaigns/new", element: <SafeRoute><FeatureGate featureId="agente_vendita"><CreateCampaignPage /></FeatureGate></SafeRoute> },
              { path: "app/campaigns/:id", element: <SafeRoute><FeatureGate featureId="agente_vendita"><CampaignDetailPage /></FeatureGate></SafeRoute> },
              { path: "app/scheduled-calls", element: <SafeRoute><FeatureGate featureId="agente_vendita"><ScheduledCalls /></FeatureGate></SafeRoute> },
              { path: "app/call-monitor", element: <SafeRoute><FeatureGate featureId="agente_vendita"><CallMonitor /></FeatureGate></SafeRoute> },
              { path: "app/phone-numbers", element: <SafeRoute><FeatureGate featureId="agente_vendita"><PhoneNumbersPage /></FeatureGate></SafeRoute> },
              { path: "app/phone-numbers/buy", element: <SafeRoute><FeatureGate featureId="agente_vendita"><BuyPhoneNumberPage /></FeatureGate></SafeRoute> },
              // ── CRM ──
              { path: "app/contacts", element: <SafeRoute><FeatureGate featureId="crm_avanzato"><ContactsPage /></FeatureGate></SafeRoute> },
              { path: "app/contacts/import", element: <SafeRoute><FeatureGate featureId="crm_avanzato"><ImportContactsPage /></FeatureGate></SafeRoute> },
              { path: "app/contacts/:id", element: <SafeRoute><FeatureGate featureId="crm_avanzato"><ContactDetailPage /></FeatureGate></SafeRoute> },
              { path: "app/lists", element: <SafeRoute><FeatureGate featureId="crm_avanzato"><ContactListsPage /></FeatureGate></SafeRoute> },
              { path: "app/lists/:id", element: <SafeRoute><FeatureGate featureId="crm_avanzato"><ContactListDetailPage /></FeatureGate></SafeRoute> },
              // ── Preventivi ──
              { path: "app/preventivi", element: <SafeRoute><FeatureGate featureId="generatore_preventivi"><PreventiviList /></FeatureGate></SafeRoute> },
              { path: "app/preventivi/nuovo", element: <SafeRoute><FeatureGate featureId="generatore_preventivi"><NuovoPreventivo /></FeatureGate></SafeRoute> },
              { path: "app/preventivi/:id", element: <SafeRoute><FeatureGate featureId="generatore_preventivi"><PreventivoDetail /></FeatureGate></SafeRoute> },
              { path: "app/preventivo-hub", element: <SafeRoute><FeatureGate featureId="generatore_preventivi"><PreventivoHub /></FeatureGate></SafeRoute> },
              { path: "app/agente-preventivo-setup", element: <SafeRoute><FeatureGate featureId="generatore_preventivi"><PreventivoAgentSetup /></FeatureGate></SafeRoute> },
              { path: "app/preventivo-kb", element: <SafeRoute><FeatureGate featureId="knowledge_base"><KnowledgeBasePreventivo /></FeatureGate></SafeRoute> },
              { path: "app/preventivi/listino", element: <SafeRoute><FeatureGate featureId="generatore_preventivi"><ListinoVociManager /></FeatureGate></SafeRoute> },
              { path: "app/preventivi/templates", element: <SafeRoute><FeatureGate featureId="generatore_preventivi"><PreventivoTemplateList /></FeatureGate></SafeRoute> },
              { path: "app/preventivi/templates/nuovo", element: <SafeRoute><FeatureGate featureId="generatore_preventivi"><PreventivoTemplateBuilder /></FeatureGate></SafeRoute> },
              { path: "app/preventivi/templates/:id", element: <SafeRoute><FeatureGate featureId="generatore_preventivi"><PreventivoTemplateBuilder /></FeatureGate></SafeRoute> },
              { path: "app/impostazioni/template-preventivo", element: <SafeRoute><FeatureGate featureId="generatore_preventivi"><TemplatePreventivo /></FeatureGate></SafeRoute> },
              { path: "app/knowledge-base", element: <SafeRoute><FeatureGate featureId="knowledge_base"><KnowledgeBasePage /></FeatureGate></SafeRoute> },
              // ── Render ──
              { path: "app/render", element: <SafeRoute><FeatureGate featureId="render_infissi"><RenderHub /></FeatureGate></SafeRoute> },
              { path: "app/render/new", element: <SafeRoute><FeatureGate featureId="render_infissi"><RenderNew /></FeatureGate></SafeRoute> },
              { path: "app/render/gallery", element: <SafeRoute><FeatureGate featureId="render_infissi"><RenderGallery /></FeatureGate></SafeRoute> },
              { path: "app/render/gallery/:id", element: <SafeRoute><FeatureGate featureId="render_infissi"><RenderGalleryDetail /></FeatureGate></SafeRoute> },
              { path: "app/render-bagno", element: <SafeRoute><FeatureGate featureId="render_bagno"><RenderBagnoHub /></FeatureGate></SafeRoute> },
              { path: "app/render-bagno/new", element: <SafeRoute><FeatureGate featureId="render_bagno"><RenderBagnoNew /></FeatureGate></SafeRoute> },
              { path: "app/render-bagno/gallery/:id", element: <SafeRoute><FeatureGate featureId="render_bagno"><RenderBagnoGalleryDetail /></FeatureGate></SafeRoute> },
              { path: "app/render-facciata", element: <SafeRoute><FeatureGate featureId="render_facciata"><RenderFacciataHub /></FeatureGate></SafeRoute> },
              { path: "app/render-facciata/new", element: <SafeRoute><FeatureGate featureId="render_facciata"><RenderFacciataNew /></FeatureGate></SafeRoute> },
              { path: "app/render-persiane", element: <SafeRoute><FeatureGate featureId="render_persiane"><RenderPersianeHub /></FeatureGate></SafeRoute> },
              { path: "app/render-persiane/new", element: <SafeRoute><FeatureGate featureId="render_persiane"><RenderPersianeNew /></FeatureGate></SafeRoute> },
              { path: "app/render-pavimento", element: <SafeRoute><FeatureGate featureId="render_pavimento"><RenderPavimentoHub /></FeatureGate></SafeRoute> },
              { path: "app/render-pavimento/new", element: <SafeRoute><FeatureGate featureId="render_pavimento"><RenderPavimentoNew /></FeatureGate></SafeRoute> },
              { path: "app/render-stanza", element: <SafeRoute><FeatureGate featureId="render_stanza"><RenderStanzaHub /></FeatureGate></SafeRoute> },
              { path: "app/render-stanza/new", element: <SafeRoute><FeatureGate featureId="render_stanza"><RenderStanzaNew /></FeatureGate></SafeRoute> },
              { path: "app/render-tetto", element: <SafeRoute><FeatureGate featureId="render_tetto"><RenderTettoHub /></FeatureGate></SafeRoute> },
              { path: "app/render-tetto/new", element: <SafeRoute><FeatureGate featureId="render_tetto"><RenderTettoNew /></FeatureGate></SafeRoute> },
              // ── Automazioni ──
              { path: "app/automations", element: <SafeRoute><FeatureGate featureId="automazioni_ai"><Automations /></FeatureGate></SafeRoute> },
              // ── Libere (no feature gate) ──
              { path: "app/analytics", element: <SafeRoute><AnalyticsPage /></SafeRoute> },
              { path: "app/credits", element: <SafeRoute><CreditsPage /></SafeRoute> },
              { path: "app/settings", element: <SafeRoute><SettingsPage /></SafeRoute> },
              { path: "app/integrations", element: <SafeRoute><Integrations /></SafeRoute> },
              { path: "app/templates", element: <SafeRoute><TemplatesPage /></SafeRoute> },
              { path: "app/templates/:slug", element: <SafeRoute><TemplateDetailPage /></SafeRoute> },
              { path: "app/templates/:slug/setup", element: <SafeRoute><TemplateSetupPage /></SafeRoute> },
              { path: "app/whatsapp", element: <SafeRoute><WhatsAppPage /></SafeRoute> },
              { path: "app/cantieri", element: <SafeRoute><CantierePage /></SafeRoute> },
              { path: "app/cantieri/configurazione", element: <SafeRoute><CantiereConfig /></SafeRoute> },
              { path: "app/cantieri/:id", element: <SafeRoute><CantiereDetail /></SafeRoute> },
              { path: "app/documenti", element: <SafeRoute><DocumentiScadenze /></SafeRoute> },
              { path: "app/presenze", element: <SafeRoute><FoglioPresenze /></SafeRoute> },
              // Area Vendite — Campagne Voce Interne
              { path: "app/vendite/campagne", element: <SafeRoute><InternalCampaignsPage /></SafeRoute> },
              { path: "app/vendite/registro", element: <SafeRoute><InternalCallLogsPage /></SafeRoute> },
            ],
          },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
];
