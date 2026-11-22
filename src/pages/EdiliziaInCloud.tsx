import { usePageSEO } from "@/hooks/usePageSEO";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

/* Brand EdiliziaInCloud (navy + arancione) — usati solo per gli accenti di questo prodotto. */
const EIC_NAVY = "#1e355e";
const EIC_ORANGE = "#f36f21";
const EIC_URL = "https://www.ediliziaincloud.com";

/** Logo EdiliziaInCloud ricostruito: mark cloud+griglia + wordmark bicolore. */
function EicLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-11 w-11 shrink-0" aria-hidden="true">
        <rect x="4" y="4" width="92" height="92" rx="20" fill={EIC_NAVY} />
        <path
          d="M30 44a13 13 0 0 1 25-4 10 10 0 0 1 13 10"
          fill="none"
          stroke={EIC_ORANGE}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <g fill="none" stroke="#fff" strokeWidth="5">
          <rect x="26" y="52" width="34" height="26" rx="2" />
          <path d="M26 63h34M37 52v26M48 52v26" />
        </g>
        <rect x="64" y="58" width="8" height="20" rx="1.5" fill={EIC_ORANGE} />
      </svg>
      <span className="font-display text-2xl font-extrabold tracking-tight">
        <span style={{ color: EIC_NAVY }}>Edilizia</span>
        <span style={{ color: EIC_ORANGE }}>InCloud</span>
      </span>
    </div>
  );
}

/* ── Sitelink dati reali (ediliziaincloud.com) ── */
const moduleGroups: { title: string; blurb: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Cantieri & Commesse",
    blurb: "Pianifica, monitora e controlla ogni cantiere in tempo reale, dallo smartphone.",
    links: [
      { label: "Gestione cantieri", href: `${EIC_URL}/funzionalita/gestione-cantieri/` },
      { label: "Margini di cantiere", href: `${EIC_URL}/funzionalita/margini-cantiere/` },
      { label: "Giornale dei lavori", href: `${EIC_URL}/funzionalita/giornale-lavori/` },
      { label: "App cantiere mobile", href: `${EIC_URL}/funzionalita/app-cantiere-mobile/` },
      { label: "Foto di cantiere", href: `${EIC_URL}/funzionalita/foto-cantiere/` },
      { label: "Sicurezza cantiere", href: `${EIC_URL}/funzionalita/sicurezza-cantiere/` },
    ],
  },
  {
    title: "Fatturazione & Fisco",
    blurb: "Fatture elettroniche, DDT e adempimenti fiscali gestiti senza commercialista fisso al fianco.",
    links: [
      { label: "Fatturazione elettronica", href: `${EIC_URL}/funzionalita/fatturazione-elettronica/` },
      { label: "DDT digitali", href: `${EIC_URL}/funzionalita/ddt-digitali/` },
      { label: "Cassetto SDI", href: `${EIC_URL}/funzionalita/cassetto-sdi/` },
      { label: "Registro IVA", href: `${EIC_URL}/funzionalita/registro-iva/` },
      { label: "Contabilità fiscale", href: `${EIC_URL}/funzionalita/contabilita-fiscale/` },
      { label: "Ritenute di garanzia", href: `${EIC_URL}/funzionalita/ritenute-garanzia/` },
    ],
  },
  {
    title: "Finanza & Margini",
    blurb: "Sai sempre quanto guadagni davvero: cassa, scadenze e previsionale sotto controllo.",
    links: [
      { label: "Cruscotto aziendale", href: `${EIC_URL}/funzionalita/cruscotto-aziendale/` },
      { label: "Prima nota", href: `${EIC_URL}/funzionalita/prima-nota/` },
      { label: "Tesoreria", href: `${EIC_URL}/funzionalita/tesoreria/` },
      { label: "Scadenzario", href: `${EIC_URL}/funzionalita/scadenzario/` },
      { label: "Cassa cantiere", href: `${EIC_URL}/funzionalita/cassa-cantiere/` },
      { label: "Finanziamenti cantieri", href: `${EIC_URL}/funzionalita/finanziamenti-cantieri/` },
    ],
  },
  {
    title: "Preventivi & Render AI",
    blurb: "Preventivi professionali in minuti e render fotorealistici per chiudere più contratti.",
    links: [
      { label: "Preventivi edilizia", href: `${EIC_URL}/funzionalita/preventivi-edilizia/` },
      { label: "Quote Builder AI", href: `${EIC_URL}/funzionalita/quote-builder-ai/` },
      { label: "Render infissi", href: `${EIC_URL}/funzionalita/render-infissi/` },
      { label: "Render bagni", href: `${EIC_URL}/funzionalita/render-bagni/` },
      { label: "Render ristrutturazioni", href: `${EIC_URL}/funzionalita/render-ristrutturazioni/` },
      { label: "Render tetti", href: `${EIC_URL}/funzionalita/render-tetti/` },
    ],
  },
  {
    title: "Acquisti, Magazzino & Subappalti",
    blurb: "Ordini, materiali e subappaltatori tracciati per non perdere marginalità sui costi.",
    links: [
      { label: "Ordini d'acquisto", href: `${EIC_URL}/funzionalita/ordini-acquisto/` },
      { label: "Magazzino di cantiere", href: `${EIC_URL}/funzionalita/magazzino-cantiere/` },
      { label: "Gestione subappalti", href: `${EIC_URL}/funzionalita/gestione-subappalti/` },
      { label: "Manutenzione impianti", href: `${EIC_URL}/funzionalita/manutenzione-impianti/` },
    ],
  },
  {
    title: "HR & Personale",
    blurb: "Presenze, timbrature GPS, cedolini e ferie di operai e tecnici in un unico posto.",
    links: [
      { label: "HR & personale", href: `${EIC_URL}/funzionalita/hr-personale/` },
      { label: "Timbrature GPS", href: `${EIC_URL}/funzionalita/timbrature-gps/` },
      { label: "Cedolini paga", href: `${EIC_URL}/funzionalita/cedolini-paga/` },
      { label: "Ferie e permessi", href: `${EIC_URL}/funzionalita/ferie-permessi/` },
    ],
  },
  {
    title: "CRM, Marketing & AI",
    blurb: "Trasforma i lead in contratti con CRM, automazioni e agenti AI che lavorano per te.",
    links: [
      { label: "CRM edilizia", href: `${EIC_URL}/funzionalita/crm-edilizia/` },
      { label: "Pipeline vendite", href: `${EIC_URL}/funzionalita/pipeline-vendite/` },
      { label: "Agenti AI", href: `${EIC_URL}/funzionalita/agenti-ai/` },
      { label: "Automazioni", href: `${EIC_URL}/funzionalita/automazioni/` },
      { label: "WhatsApp marketing", href: `${EIC_URL}/funzionalita/whatsapp-marketing/` },
      { label: "Portale clienti", href: `${EIC_URL}/funzionalita/portale-clienti/` },
    ],
  },
];

const perChi = [
  { label: "Imprese edili", href: `${EIC_URL}/per/imprese-edili/` },
  { label: "Impiantisti", href: `${EIC_URL}/per/impiantisti/` },
  { label: "Ristrutturatori", href: `${EIC_URL}/per/ristrutturatori/` },
  { label: "Serramentisti", href: `${EIC_URL}/per/serramentisti/` },
  { label: "Fotovoltaico", href: `${EIC_URL}/per/fotovoltaico/` },
  { label: "Piccole imprese", href: `${EIC_URL}/per/piccole-imprese/` },
  { label: "Medie imprese", href: `${EIC_URL}/per/medie-imprese/` },
  { label: "Grandi imprese", href: `${EIC_URL}/per/grandi-imprese/` },
  { label: "Commercialisti edilizia", href: `${EIC_URL}/per/commercialista-edilizia/` },
];

const confronti = [
  { label: "EdiliziaInCloud vs Excel", href: `${EIC_URL}/confronto/vs-excel/` },
  { label: "EdiliziaInCloud vs PriMus", href: `${EIC_URL}/confronto/vs-primus/` },
  { label: "EdiliziaInCloud vs TeamSystem", href: `${EIC_URL}/confronto/vs-teamsystem/` },
  { label: "EdiliziaInCloud vs Edilnet", href: `${EIC_URL}/confronto/vs-edilnet/` },
  { label: "EdiliziaInCloud vs Buildertrend", href: `${EIC_URL}/confronto/vs-buildertrend/` },
];

const startLinks = [
  { label: "Prova la demo gratuita", href: `${EIC_URL}/demo/`, primary: true },
  { label: "Vedi funzionalità complete", href: `${EIC_URL}/funzionalita/` },
  { label: "Prezzi e piani", href: `${EIC_URL}/prezzi/` },
  { label: "Pianifica la migrazione", href: `${EIC_URL}/pianifica-migrazione/` },
  { label: "Casi studio", href: `${EIC_URL}/casi-studio/` },
  { label: "Integrazioni", href: `${EIC_URL}/integrazioni/` },
];

const faqs = [
  {
    q: "Che cos'è EdiliziaInCloud?",
    a: "EdiliziaInCloud è il gestionale cloud con intelligenza artificiale per le imprese edili italiane. Riunisce in un'unica piattaforma la gestione dei cantieri, la fatturazione elettronica, i preventivi, il controllo dei margini, la finanza, il personale e il CRM, accessibile da computer e da app mobile direttamente in cantiere.",
  },
  {
    q: "Che differenza c'è tra edilizia.io ed EdiliziaInCloud?",
    a: "Sono due strumenti complementari dello stesso gruppo AEDIX: edilizia.io sviluppa sistemi AI su misura per imprese edili e studi tecnici (automazione, preventivi, render, gare d'appalto, documenti, cantiere), mentre EdiliziaInCloud è il gestionale che manda avanti l'azienda (cantieri, fatture, margini, personale). Insieme coprono l'intero ciclo: dal primo contatto alla consegna del lavoro.",
  },
  {
    q: "EdiliziaInCloud gestisce la fatturazione elettronica verso SDI?",
    a: "Sì. EdiliziaInCloud emette e riceve fatture elettroniche via Sistema di Interscambio (attive e passive), gestisce DDT digitali, cassetto SDI, registro IVA e ritenute di garanzia, così l'impresa edile resta in regola senza rincorrere scadenze e documenti.",
  },
  {
    q: "Serve installare qualcosa o è tutto in cloud?",
    a: "EdiliziaInCloud è 100% in cloud: non richiede installazioni né server. Si accede da browser e da app mobile dedicata per il cantiere, con i dati sincronizzati in tempo reale tra ufficio e squadre operative.",
  },
  {
    q: "Posso passare da Excel o da un altro gestionale a EdiliziaInCloud?",
    a: "Sì. EdiliziaInCloud è pensato come alternativa a Excel e ai gestionali tradizionali come PriMus, TeamSystem o Edilnet, con un percorso di migrazione assistita che porta dati e anagrafiche nel nuovo sistema senza fermare l'attività.",
  },
  {
    q: "EdiliziaInCloud è adatto anche alle piccole imprese edili?",
    a: "Sì. EdiliziaInCloud è modulare e si adatta a piccole, medie e grandi imprese, oltre che a impiantisti, serramentisti, ristrutturatori e installatori fotovoltaico: si parte dai moduli che servono e si aggiungono gli altri quando l'azienda cresce.",
  },
];

export default function EdiliziaInCloud() {
  const seoTags = usePageSEO({
    title: "EdiliziaInCloud: il Gestionale Cloud con AI per Imprese Edili | Edilizia.io",
    description:
      "Cos'è EdiliziaInCloud, il gestionale cloud con AI per imprese edili: cantieri, fatturazione elettronica, preventivi, margini, personale e CRM in un'unica piattaforma. Guida completa e link utili.",
    canonical: "/edilizia-in-cloud",
    jsonLd: [
      {
        "@type": "SoftwareApplication",
        name: "EdiliziaInCloud",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, iOS, Android",
        url: EIC_URL,
        description:
          "Gestionale cloud con intelligenza artificiale per imprese edili italiane: gestione cantieri, fatturazione elettronica, preventivi, controllo margini, finanza, personale e CRM.",
        offers: { "@type": "Offer", priceCurrency: "EUR", availability: "https://schema.org/InStock" },
        publisher: { "@type": "Organization", name: "AEDIX", url: "https://aedix.it" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://edilizia.io" },
          { "@type": "ListItem", position: 2, name: "EdiliziaInCloud", item: "https://edilizia.io/edilizia-in-cloud" },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      {seoTags}
      <Navbar />

      {/* ── HERO ── */}
      <section className="pt-24 pb-16 md:pt-28 md:pb-20" style={{ background: "linear-gradient(180deg,#f4f7fb 0%,transparent 100%)" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <EicLogo className="justify-center mb-8" />
          <span
            className="inline-block font-mono text-[11px] uppercase tracking-wider px-3 py-1 rounded-full font-bold mb-6"
            style={{ background: `${EIC_ORANGE}1a`, color: EIC_ORANGE }}
          >
            Il gestionale del gruppo AEDIX
          </span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: EIC_NAVY }}>
            EdiliziaInCloud: il gestionale cloud con AI
            <br className="hidden md:block" /> che manda avanti la tua impresa edile
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Cantieri, fatturazione elettronica, preventivi, margini, personale e CRM in un'unica
            piattaforma cloud, accessibile anche dallo smartphone in cantiere. Meno Excel, meno
            fogli sparsi, meno sorprese a fine mese.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={`${EIC_URL}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-display font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ background: EIC_NAVY }}
            >
              Vai a EdiliziaInCloud <ArrowUpRight size={18} />
            </a>
            <a
              href={`${EIC_URL}/demo/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-display font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ background: EIC_ORANGE }}
            >
              Prova la demo gratuita <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 pb-24">
        {/* ── Cos'è ── */}
        <section className="py-4">
          <div className="rounded-2xl border-l-4 bg-muted/40 p-6" style={{ borderColor: EIC_ORANGE }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: EIC_ORANGE }}>
              In sintesi
            </h2>
            <p className="text-[17px] leading-relaxed text-foreground">
              EdiliziaInCloud è il gestionale cloud con intelligenza artificiale pensato
              esclusivamente per le imprese edili italiane. In un'unica piattaforma riunisce
              gestione cantieri, fatturazione elettronica, preventivi, controllo dei margini,
              finanza, gestione del personale e CRM — con app mobile per il cantiere e dati
              sincronizzati in tempo reale tra ufficio e squadre.
            </p>
          </div>
        </section>

        <section className="py-10">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-4">
            Cos'è EdiliziaInCloud (e perché è diverso dai gestionali generici)
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              La maggior parte delle imprese edili gestisce l'azienda con un mosaico di strumenti
              scollegati: Excel per i preventivi, un altro software per le fatture, WhatsApp per il
              cantiere, il commercialista per la contabilità e la memoria del titolare per tutto il
              resto. Il risultato è sempre lo stesso: dati che non tornano, margini che si scoprono
              solo a lavoro finito e ore perse a rincorrere documenti.
            </p>
            <p>
              <strong className="text-foreground">EdiliziaInCloud</strong> nasce per chiudere questo
              caos. Non è un gestionale generico adattato all'edilizia: parla la lingua del SAL, del
              preventivo a misura, della ritenuta di garanzia, del subappalto e del DURC. Ogni
              modulo è costruito sul modo reale in cui lavora un'impresa di costruzioni, così il
              titolare vede in tempo reale quanto sta guadagnando su ogni cantiere e cosa rischia di
              erodere il margine.
            </p>
            <p>
              Essendo 100% in cloud, EdiliziaInCloud non richiede installazioni né server: si usa da
              browser in ufficio e da app mobile in cantiere, con foto, rapportini, timbrature e
              stato lavori aggiornati per tutti nello stesso momento.
            </p>
          </div>
        </section>

        {/* ── Moduli con sitelink ── */}
        <section className="py-6">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-3">
            Tutto il gestionale in un'unica piattaforma
          </h2>
          <p className="text-muted-foreground mb-8">
            EdiliziaInCloud è modulare: attivi ciò che ti serve e aggiungi il resto quando cresci.
            Ecco le aree principali, con i link diretti a ogni funzionalità.
          </p>
          <div className="space-y-6">
            {moduleGroups.map((g) => (
              <div key={g.title} className="rounded-2xl border border-border p-6">
                <h3 className="font-display text-lg font-bold text-foreground">{g.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{g.blurb}</p>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                      >
                        <Check size={15} style={{ color: EIC_ORANGE }} className="shrink-0" />
                        <span className="group-hover:underline">{l.label}</span>
                        <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Per chi ── */}
        <section className="py-10">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-3">
            Pensato per il tuo mestiere
          </h2>
          <p className="text-muted-foreground mb-6">
            EdiliziaInCloud si adatta al settore e alla dimensione della tua azienda, dalla ditta
            individuale al general contractor.
          </p>
          <div className="flex flex-wrap gap-2">
            {perChi.map((p) => (
              <a
                key={p.href}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {p.label}
                <ArrowUpRight size={13} className="opacity-50" />
              </a>
            ))}
          </div>
        </section>

        {/* ── Confronto ── */}
        <section className="py-6">
          <div className="rounded-2xl p-6 md:p-8" style={{ background: `${EIC_NAVY}0d` }}>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-3">
              Meglio di Excel e dei gestionali tradizionali
            </h2>
            <p className="text-muted-foreground mb-6">
              Fatto per l'edilizia, non un software generico riadattato. Confronta EdiliziaInCloud
              con gli strumenti che usi oggi:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {confronti.map((c) => (
                <a
                  key={c.href}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-border bg-background px-5 py-3.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {c.label}
                  <ArrowUpRight size={15} className="opacity-50" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── Sinergia edilizia.io + EiC ── */}
        <section className="py-10">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-4">
            edilizia.io + EdiliziaInCloud: acquisisci e gestisci
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">edilizia.io</strong> e{" "}
              <strong className="text-foreground">EdiliziaInCloud</strong> fanno parte dello stesso
              gruppo, AEDIX, e risolvono due metà dello stesso problema. edilizia.io sviluppa i
              sistemi AI su misura: agenti vocali, preventivi, render, gare d'appalto, documenti
              tecnici e cantiere, per imprese edili e studi tecnici.
            </p>
            <p>
              EdiliziaInCloud prende il testimone da lì in poi: una volta acquisito il cliente,
              gestisce il preventivo definitivo, il cantiere, i materiali, la fatturazione e i
              margini fino alla consegna. Il lead intercettato dall'AI diventa un cantiere sotto
              controllo, senza passaggi manuali e senza dati che si perdono per strada.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="/soluzioni"
                className="inline-flex items-center gap-2 rounded-xl border border-primary bg-primary/5 px-5 py-3 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
              >
                Scopri gli agenti AI di edilizia.io <ArrowRight size={16} />
              </a>
              <a
                href={`${EIC_URL}/funzionalita/agenti-ai/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold text-foreground hover:border-primary transition-colors"
              >
                Agenti AI in EdiliziaInCloud <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
        </section>

        {/* ── Come iniziare ── */}
        <section className="py-6">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-6">
            Come iniziare con EdiliziaInCloud
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {startLinks.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl px-5 py-4 text-sm font-bold transition-all hover:-translate-y-0.5"
                style={
                  s.primary
                    ? { background: EIC_ORANGE, color: "#fff" }
                    : { border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }
                }
              >
                {s.label}
                <ArrowUpRight size={16} className={s.primary ? "" : "opacity-50"} />
              </a>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-10">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-6">
            Domande frequenti su EdiliziaInCloud
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-2">{f.q}</h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA finale ── */}
        <section className="py-6">
          <div className="rounded-2xl p-8 md:p-10 text-center" style={{ background: EIC_NAVY }}>
            <EicLogo className="justify-center mb-5 [&_span]:!text-white" />
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white">
              Porta la tua impresa edile nel cloud
            </h2>
            <p className="mt-3 text-white/70 max-w-xl mx-auto">
              Cantieri, fatture e margini sotto controllo in un'unica piattaforma. Prova
              EdiliziaInCloud con una demo gratuita, senza impegno.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href={`${EIC_URL}/demo/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-display font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all"
                style={{ background: EIC_ORANGE }}
              >
                Prova la demo gratuita <ArrowRight size={18} />
              </a>
              <a
                href={`${EIC_URL}/prezzi/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 font-display font-bold text-white hover:bg-white/10 transition-all"
              >
                Vedi i prezzi <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
