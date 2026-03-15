import { usePageSEO } from "@/hooks/usePageSEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import {
  Zap, Target, FileText, CheckCircle2, XCircle, ArrowRight, Calculator,
  BarChart3, RefreshCw, Landmark, Send, Settings2, Search,
} from "lucide-react";
import Footer from "@/components/sections/Footer";
import CounterStat from "@/components/custom/CounterStat";
import {
  AnimatedSection, OfferHeader, OfferBadge, OfferGuarantee, OfferCTABanner,
  LogoBarMini, PricingCard, SectionDivider, HeroBlob, DotPattern,
  OfferSectionNav, SetupFreeBanner,
  useCountdown, useNoIndex, staggerContainer, staggerItem, StarRating,
} from "@/components/offerta/shared";

const scrollToCta = () => document.getElementById("cta-finale")?.scrollIntoView({ behavior: "smooth" });

const navLinks = [
  { label: "Il Problema", href: "#problema" },
  { label: "Soluzione", href: "#soluzione" },
  { label: "Come Funziona", href: "#come-funziona" },
  { label: "Confronto", href: "#confronto" },
  { label: "Caso Studio", href: "#caso-studio" },
  { label: "Prezzi", href: "#prezzi" },
  { label: "FAQ", href: "#faq" },
];

const features = [
  { icon: Zap, title: "Calcolo Istantaneo", text: "Seleziona prodotto, misure, varianti → preventivo calcolato in automatico con prezzi aggiornati, ricariche e sconti personalizzati." },
  { icon: Calculator, title: "IVA Intelligente", text: "L'AI identifica automaticamente l'aliquota IVA corretta (4%, 10%, 22%) in base al tipo di intervento, edificio, servizio e tipo di cliente. Niente più dubbi." },
  { icon: Landmark, title: "Detrazioni Fiscali", text: "Calcola in automatico Ecobonus, Bonus Ristrutturazione, Bonus Mobili. Mostra al cliente quanto risparmia — questo chiude le vendite." },
  { icon: FileText, title: "PDF Professionale", text: "PDF brandizzato con il tuo logo, contatti, condizioni di vendita, disegni tecnici e riepilogo detrazioni. Il cliente riceve un documento che trasmette autorevolezza." },
  { icon: RefreshCw, title: "Varianti e Alternative", text: "Genera varianti dello stesso preventivo (con/senza optional, materiali diversi, fasce di prezzo) con un click. Il cliente sceglie — tu chiudi." },
  { icon: BarChart3, title: "Analytics", text: "Dashboard con tasso di conversione per tipo di preventivo, margine medio, prodotti più venduti. Capisci COSA vendi di più e DOVE guadagni di più." },
];

const plans = [
  { name: "Starter", price: "€47", period: "/mese", setup: "€297 una tantum", extra: "Extra: €0,80/preventivo", features: ["50 preventivi/mese", "Calcolo varianti automatico", "IVA e detrazioni AI", "PDF base con logo", "1 utente"] },
  { name: "Professional", price: "€97", period: "/mese", setup: "€297 una tantum", extra: "Extra: €0,60/preventivo", badge: "⭐ Più scelto", features: ["150 preventivi/mese", "Tutto Starter +", "PDF professionale personalizzabile", "Varianti e alternative con 1 click", "Analytics base", "3 utenti"], highlighted: true },
  { name: "Business", price: "€197", period: "/mese", setup: "€297 una tantum", extra: "Extra: €0,50/preventivo", features: ["400 preventivi/mese", "Tutto Professional +", "Dashboard analytics completa", "Integrazione Render AI", "Gestione multi-fornitore", "5 utenti"] },
  { name: "Unlimited", price: "€347", period: "/mese", setup: "€297 una tantum", extra: "Extra: €0,40/preventivo", features: ["1.000 preventivi/mese", "Tutto Business +", "Utenti illimitati", "Listini multi-brand", "Report marginalità avanzato", "Supporto dedicato"] },
];

const faqs = [
  { q: "Posso caricare i listini dei miei fornitori?", a: "Sì. Puoi caricare listini in Excel o CSV. Il sistema importa prezzi, varianti, accessori e li tiene aggiornati. Supportiamo i principali formati usati dai produttori di infissi italiani." },
  { q: "Funziona solo per serramenti?", a: "No. Il preventivatore funziona per qualsiasi prodotto edile: serramenti, porte interne, porte blindate, persiane, tende da sole, fotovoltaico, climatizzazione, ristrutturazioni. Basta configurare il catalogo prodotti." },
  { q: "Come fa a sapere l'IVA giusta?", a: "L'AI ti guida con una procedura in 3 domande (tipo intervento, tipo edificio, tipo cliente) e applica automaticamente l'aliquota corretta secondo la normativa vigente. Aggiornato con le ultime disposizioni fiscali." },
  { q: "I miei commerciali riusciranno a usarlo?", a: "Se sanno usare WhatsApp, sanno usare il Preventivatore AI. L'interfaccia è pensata per chi lavora in cantiere, non per informatici. Selezioni, clicchi, invii." },
  { q: "Posso allegare il render AI al preventivo?", a: "Sì, se hai attivato anche il modulo Render AI. Il render viene allegato automaticamente al PDF del preventivo. Questo aumenta drasticamente il tasso di chiusura." },
];

const comparisonRows = [
  { label: "Tempo per preventivo", excel: "30 min – 2 ore", software: "10-15 minuti", edilizia: "30 secondi" },
  { label: "Calcolo IVA automatico", excel: "❌ Manuale", software: "⚠️ Parziale", edilizia: "✅ Automatico + AI" },
  { label: "Detrazioni fiscali", excel: "❌ Manuale", software: "⚠️ Solo alcuni", edilizia: "✅ Tutte, aggiornate" },
  { label: "PDF brandizzato", excel: "❌ Artigianale", software: "✅ Base", edilizia: "✅ Professionale + render" },
  { label: "Analytics vendite", excel: "❌ Nessuna", software: "⚠️ Base", edilizia: "✅ Dashboard AI completa" },
  { label: "Integrazione CRM", excel: "❌", software: "❌", edilizia: "✅ Nativa (Edilizia.io)" },
  { label: "Costo", excel: "€0 (ma quanto tempo perdi?)", software: "€50-150/mese", edilizia: "Da €47/mese" },
];

export default function OffertaPreventivatoreAI() {
  usePageSEO({ title: "Offerta Preventivatore AI — Edilizia.io", description: "Preventivi professionali in 30 secondi con calcolo IVA, detrazioni e PDF automatico. Offerta riservata." });
  useNoIndex();
  const countdown = useCountdown("offerta_prev_first_visit");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OfferHeader ctaText="Attiva il Preventivatore AI" onCtaClick={scrollToCta} navLinks={navLinks} />

      {/* ===== HERO ===== */}
      <AnimatedSection className="relative py-20 md:py-28 overflow-hidden" stagger>
        <HeroBlob />
        <DotPattern />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div variants={staggerItem}><OfferBadge>🔒 Pagina riservata — Offerta valida per 7 giorni</OfferBadge></motion.div>

          <motion.h1 variants={staggerItem} className="mx-auto mt-6 max-w-4xl text-3xl font-extrabold font-display leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Smetti di Perdere 2 Ore a Fare un Preventivo.
            <br className="hidden md:block" />
            <span className="text-primary">L'AI Lo Fa in 30 Secondi.</span>
          </motion.h1>

          <motion.p variants={staggerItem} className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Preventivi professionali con calcolo automatico di varianti, detrazioni fiscali, IVA agevolata e PDF brandizzato con il tuo logo. Il cliente riceve un documento perfetto — tu risparmi mezza giornata.
          </motion.p>

          <motion.div variants={staggerItem} className="mt-6">
            <SetupFreeBanner setupCost="€297" expired={countdown.expired} />
          </motion.div>

          <motion.div variants={staggerItem} className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
            {[
              { icon: Zap, text: "Preventivo in 30 secondi" },
              { icon: Target, text: "Zero errori di calcolo" },
              { icon: FileText, text: "PDF professionale automatico" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground bg-card border border-border/60 rounded-full px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Icon className="h-4 w-4 text-primary" /></div>
                <span>{text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={staggerItem}>
            <Button size="lg" className="mt-10 text-base px-8 py-6 shadow-button-green hover:-translate-y-0.5 transition-all" onClick={scrollToCta}>
              Attiva il Preventivatore AI <ArrowRight className="ml-1" />
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">Attivo in giornata. Disdici quando vuoi.</p>
          </motion.div>
        </div>
      </AnimatedSection>

      <LogoBarMini />

      {/* ===== IL PROBLEMA ===== */}
      <AnimatedSection id="problema" className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold font-display md:text-4xl">Quante ore butti via ogni settimana in preventivi?</h2>
          <div className="mx-auto mt-12 max-w-3xl space-y-6 text-base leading-relaxed text-muted-foreground">
            <p>Pensaci un attimo.</p>
            <p>Ogni preventivo ti porta via 30 minuti — 2 ore se è complesso. Devi aprire il foglio Excel, cercare i prezzi aggiornati del fornitore, calcolare le varianti per colore e dimensione, verificare l'IVA corretta (4%? 10%? 22% — dipende dal tipo di intervento), controllare se rientra nell'Ecobonus o nel Bonus Ristrutturazione, aggiungere la posa, calcolare i totali…</p>
            <p>E poi formattare il tutto in un documento presentabile.</p>
            <p>Alla fine della settimana hai fatto 10-15 preventivi e hai perso 15-20 ore. Ore che potevi usare per vendere, per stare in cantiere, per far crescere l'azienda.</p>
            <p className="font-semibold text-foreground text-lg">E il bello? Il 60-70% di quei preventivi non diventerà mai un ordine.</p>
          </div>
          <div className="mx-auto mt-10 max-w-2xl space-y-3">
            {["Tempo sprecato su preventivi che non convertono", "Errori di calcolo che ti costano margine o credibilità", "Documenti poco professionali che non ti differenziano dalla concorrenza", "Detrazioni e IVA agevolata calcolate a mano — rischio di sbagliare", "Nessun modo di sapere quali preventivi convertono e perché"]
              .map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm bg-destructive/5 border border-destructive/10 rounded-lg px-4 py-2.5">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /><span>{item}</span>
                </div>
              ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ===== LA SOLUZIONE ===== */}
      <AnimatedSection id="soluzione" className="py-20 md:py-28" stagger>
        <div className="container mx-auto px-4">
          <motion.h2 variants={staggerItem} className="text-center text-2xl font-bold font-display md:text-4xl">
            Il Preventivatore AI che lavora come il tuo miglior commerciale
          </motion.h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <motion.div key={title} variants={staggerItem}>
                <Card className="h-full hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border-t-4 border-t-transparent hover:border-t-primary">
                  <CardHeader className="flex-row items-start gap-4 space-y-0">
                    <div className="rounded-full bg-primary/10 p-3"><Icon className="h-6 w-6 text-primary" /></div>
                    <CardTitle className="text-lg font-display">{title}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{text}</p></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ===== COME FUNZIONA ===== */}
      <AnimatedSection id="come-funziona" className="py-20 md:py-28 bg-muted/40" stagger>
        <div className="container mx-auto px-4">
          <motion.h2 variants={staggerItem} className="text-center text-2xl font-bold font-display md:text-4xl">Da richiesta a preventivo inviato: 30 secondi.</motion.h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 relative">
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
            {[
              { icon: Search, step: "1", title: "SELEZIONA", text: "Scegli il prodotto dal tuo catalogo già caricato (infissi, porte, persiane, accessori)." },
              { icon: Settings2, step: "2", title: "CONFIGURA", text: "Inserisci misure, colore, vetro, accessori. L'AI calcola prezzo base + varianti automaticamente." },
              { icon: CheckCircle2, step: "3", title: "VERIFICA", text: "L'AI applica IVA corretta, detrazioni, ricariche e sconti. Tu controlli il totale in un click." },
              { icon: Send, step: "4", title: "INVIA", text: "PDF professionale generato e inviato al cliente via email o WhatsApp. Salvato nel CRM con tracking apertura." },
            ].map(({ icon: Icon, step, title, text }) => (
              <motion.div key={step} variants={staggerItem} className="text-center relative z-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20 shadow-md">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-4 text-xs font-bold text-primary uppercase tracking-wider font-mono">Step {step}</div>
                <h3 className="mt-2 text-xl font-bold font-display">{title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ===== CONFRONTO MERCATO ===== */}
      <AnimatedSection id="confronto" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold font-display md:text-4xl">Quanto paghi oggi per fare preventivi?</h2>
          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-xl border shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Funzionalità</TableHead>
                  <TableHead className="text-center">Excel / Manuale</TableHead>
                  <TableHead className="text-center">Software Preventivi</TableHead>
                  <TableHead className="text-center font-bold text-primary bg-primary/5">Edilizia.io AI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((row) => (
                  <TableRow key={row.label} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-center text-sm">{row.excel}</TableCell>
                    <TableCell className="text-center text-sm">{row.software}</TableCell>
                    <TableCell className="text-center text-sm font-semibold text-primary bg-primary/5">{row.edilizia}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ===== CASO STUDIO ===== */}
      <AnimatedSection id="caso-studio" className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold font-display md:text-4xl">"Prima facevamo 15 preventivi a settimana. Adesso 15 al giorno."</h2>
          <Card className="mx-auto mt-12 max-w-3xl shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Azienda:</strong> Rivenditore serramenti — 4 commerciali</p>
                <p><strong className="text-foreground">Situazione:</strong> Ogni commerciale perdeva 1,5 ore al giorno in preventivi. Errori frequenti su IVA e detrazioni. Documenti non uniformi tra i venditori.</p>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-6" />
              <h3 className="font-bold text-lg font-display mb-4">Dopo 90 giorni con Preventivatore AI:</h3>
              <div className="grid gap-6 sm:grid-cols-3 mb-6">
                <CounterStat value={96} prefix="-" suffix="%" label="Tempo per preventivo" duration={1.5} />
                <CounterStat value={200} prefix="+" suffix="%" label="Preventivi inviati" duration={1.5} />
                <CounterStat value={44} prefix="+" suffix="%" label="Conversione" duration={1.5} />
              </div>
              <div className="rounded-lg bg-muted/60 p-4 border border-border/50">
                <StarRating />
                <blockquote className="mt-2 text-sm italic text-muted-foreground">
                  "Prima facevamo 15 preventivi a settimana per commerciale. Adesso ne facciamo 15 al giorno. E sono tutti perfetti."
                </blockquote>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      {/* ===== PRICING ===== */}
      <AnimatedSection id="prezzi" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold font-display md:text-4xl">Quanto costa fare preventivi perfetti?</h2>

          <div className="mx-auto mt-6 max-w-xl">
            <SetupFreeBanner setupCost="€297" expired={countdown.expired} />
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <PricingCard
                key={plan.name}
                {...plan}
                setupFree={!countdown.expired}
                onCta={() => window.open(`https://wa.me/3900000000?text=${encodeURIComponent(`Ciao, vorrei attivare il piano ${plan.name} del Preventivatore AI di Edilizia.io`)}`, "_blank")}
              />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
            💡 Fai i conti: se un commerciale risparmia 1,5 ore al giorno in preventivi, in un mese sono <strong>30 ore recuperate</strong>. A €25/ora di costo aziendale, risparmi <strong>€750/mese</strong>. Il piano Professional si ripaga 7 volte.
          </p>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ===== FAQ ===== */}
      <AnimatedSection id="faq" className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold font-display md:text-4xl mb-12">Domande frequenti</h2>
          <Accordion type="single" collapsible className="mx-auto max-w-3xl">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </AnimatedSection>

      {/* ===== GARANZIA + CTA ===== */}
      <AnimatedSection className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <OfferGuarantee title="Garanzia 30 Giorni">
            <p>Se il preventivatore non ti fa risparmiare almeno 5 ore a settimana, ti rimborsiamo il setup. Zero rischio.</p>
          </OfferGuarantee>
        </div>
      </AnimatedSection>

      <OfferCTABanner
        headline="Ogni preventivo fatto a mano è tempo rubato alla vendita."
        subtitle="Attiva il Preventivatore AI oggi. Da domani i tuoi preventivi si fanno da soli."
        ctaText="Attiva il Preventivatore AI Ora"
        ctaOnClick={() => window.open(`https://wa.me/3900000000?text=${encodeURIComponent("Ciao, vorrei attivare il Preventivatore AI di Edilizia.io")}`, "_blank")}
        countdown={countdown}
      />

      <Footer />
    </div>
  );
}
