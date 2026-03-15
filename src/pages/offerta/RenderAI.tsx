import { usePageSEO } from "@/hooks/usePageSEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import {
  Zap, Camera, DollarSign, CheckCircle2, XCircle, ArrowRight, Palette, Sparkles, Image,
} from "lucide-react";
import Footer from "@/components/sections/Footer";
import CounterStat from "@/components/custom/CounterStat";
import {
  AnimatedSection, OfferHeader, OfferBadge, OfferGuarantee, OfferCTABanner,
  LogoBarMini, PricingCard, SectionDivider, HeroBlob, DotPattern,
  useCountdown, useNoIndex, staggerContainer, staggerItem, StarRating,
} from "@/components/offerta/shared";

const scrollToCta = () => document.getElementById("cta-finale")?.scrollIntoView({ behavior: "smooth" });

const beforeAfterPairs = [
  { before: "Foto finestra vecchia in alluminio", after: "Render fotorealistico con infisso nuovo in PVC effetto legno, tapparella, davanzale", caption: "Render infisso PVC effetto rovere — generato in 8 secondi" },
  { before: "Foto bagno datato con piastrelle anni '80", after: "Render bagno moderno con doccia walk-in, mobile sospeso, specchio LED", caption: "Render bagno completo — generato in 12 secondi" },
  { before: "Foto facciata con cappotto rovinato", after: "Render facciata con cappotto nuovo, persiane coordinate, fotovoltaico sul tetto", caption: "Render esterno con fotovoltaico — generato in 15 secondi" },
];

const plans = [
  { name: "Starter", price: "€67", period: "/mese", setup: "€97 una tantum", extra: "Extra render: €2,50 cad.", features: ["30 render/mese", "Render infissi e stanze", "Galleria render salvati", "Esportazione PDF", "Supporto email"] },
  { name: "Professional", price: "€127", period: "/mese", setup: "€197 una tantum", extra: "Extra render: €2,00 cad.", badge: "⭐ Più scelto", features: ["80 render/mese", "Render infissi, stanze ed esterni", "Galleria con condivisione cliente", "PDF brandizzato per preventivi", "Before/After automatico", "Supporto prioritario"], highlighted: true },
  { name: "Business", price: "€247", period: "/mese", setup: "€297 una tantum", extra: "Extra render: €1,80 cad.", features: ["200 render/mese", "Tutti i tipi di render", "Alta risoluzione (1536px)", "Galleria condivisa team", "Integrazione preventivatore", "Ottimizzazione stili mensile", "5 utenti"] },
  { name: "Unlimited", price: "€447", period: "/mese", setup: "€397 una tantum", extra: "Extra render: €1,50 cad.", features: ["500 render/mese", "Tutto Business +", "Render prioritari (coda dedicata)", "Stili custom per brand", "10 utenti", "Account Manager"] },
];

const faqs = [
  { q: "Funziona davvero con gli infissi? Sono precisi?", a: "Sì. L'AI è addestrata su centinaia di migliaia di immagini architettoniche. Riconosce finestre, porte, persiane e le sostituisce nell'immagine mantenendo prospettiva, illuminazione e ombre. Non è un fotomontaggio — è un render fotorealistico generato da AI. Il risultato è sufficientemente preciso per vendere, non per produrre." },
  { q: "Posso usarlo durante l'appuntamento dal cliente?", a: "Assolutamente. È pensato esattamente per quello. Scatti la foto con il telefono, selezioni il prodotto, e in 10 secondi mostri il render sul tablet o sullo smartphone. L'effetto sul cliente è immediato." },
  { q: "Il render è abbastanza realistico da mostrare al cliente finale?", a: "Sì. La qualità è paragonabile a render professionali da €200-300. Non è perfetto al pixel come un render 3D fatto a mano da un architetto, ma per la vendita è più che sufficiente — e lo hai in 10 secondi invece che in 10 giorni." },
  { q: "Posso mettere il render nel preventivo?", a: "Sì. Puoi esportare ogni render in PDF e allegarlo al preventivo. Se usi il Preventivatore AI di Edilizia.io, il render viene allegato automaticamente." },
  { q: "E per i bagni e le facciate funziona uguale?", a: "Sì. L'AI genera render per interni (bagni, cucine, stanze), esterni (facciate, coperture, fotovoltaico) e infissi specifici. Ogni tipo ha stili e opzioni dedicate." },
];

export default function OffertaRenderAI() {
  usePageSEO({ title: "Offerta Render AI — Edilizia.io", description: "Render fotorealistici in 10 secondi per chiudere più vendite. Offerta riservata." });
  useNoIndex();
  const countdown = useCountdown("offerta_render_first_visit");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OfferHeader ctaText="Attiva Render AI" onCtaClick={scrollToCta} />

      {/* ===== HERO ===== */}
      <AnimatedSection className="relative py-20 md:py-28 overflow-hidden" stagger>
        <HeroBlob />
        <DotPattern />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div variants={staggerItem}>
            <OfferBadge>🔒 Pagina riservata — Offerta valida per 7 giorni</OfferBadge>
          </motion.div>

          <motion.h1 variants={staggerItem} className="mx-auto mt-6 max-w-4xl text-3xl font-extrabold font-display leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Mostra al Cliente Come Starà Casa Sua.
            <br className="hidden md:block" />
            <span className="text-primary">Prima Ancora di Iniziare i Lavori.</span>
          </motion.h1>

          <motion.p variants={staggerItem} className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Render fotorealistici di infissi, bagni, facciate e stanze complete. In 10 secondi. Senza renderista, senza software 3D, senza aspettare 2 settimane.
          </motion.p>

          <motion.div variants={staggerItem} className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
            {[
              { icon: Zap, text: "Render in 10 secondi" },
              { icon: Camera, text: "Qualità fotorealistica" },
              { icon: DollarSign, text: "Da €0,67 a render (vs €200+)" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground bg-card border border-border/60 rounded-full px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={staggerItem}>
            <Button size="lg" className="mt-10 text-base px-8 py-6 shadow-button-green hover:-translate-y-0.5 transition-all" onClick={scrollToCta}>
              Attiva Render AI <ArrowRight className="ml-1" />
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">Attivo in giornata. Disdici quando vuoi.</p>
          </motion.div>
        </div>
      </AnimatedSection>

      <LogoBarMini />

      {/* ===== BEFORE/AFTER ===== */}
      <AnimatedSection className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold font-display md:text-4xl">Da una foto del cantiere al render del risultato finale</h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {beforeAfterPairs.map((pair, i) => (
              <motion.div
                key={i}
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 p-4 hover:shadow-md transition-shadow">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                        <Image className="h-6 w-6 text-destructive/50" />
                      </div>
                      <p className="mt-3 text-xs text-destructive font-bold uppercase tracking-wider">PRIMA</p>
                      <p className="mt-1 text-[10px] text-muted-foreground leading-tight">{pair.before}</p>
                    </div>
                  </div>
                  <div className="flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 hover:shadow-md transition-shadow">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <Sparkles className="h-6 w-6 text-primary/50" />
                      </div>
                      <p className="mt-3 text-xs text-primary font-bold uppercase tracking-wider">DOPO</p>
                      <p className="mt-1 text-[10px] text-muted-foreground leading-tight">{pair.after}</p>
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground italic">{pair.caption}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ===== IL PROBLEMA ===== */}
      <AnimatedSection className="py-20 md:py-28" stagger>
        <div className="container mx-auto px-4">
          <motion.h2 variants={staggerItem} className="text-center text-2xl font-bold font-display md:text-4xl">
            Il tuo cliente non compra quello che non può immaginare
          </motion.h2>

          <div className="mx-auto mt-12 max-w-4xl grid gap-6 md:grid-cols-2">
            <motion.div variants={staggerItem} className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 hover:shadow-md transition-shadow">
              <h3 className="mb-4 font-bold text-destructive text-lg font-display">Senza Render AI</h3>
              <ul className="space-y-3 text-sm">
                {["Il cliente vede solo un campione di colore e un catalogo PDF", "Non riesce a immaginare il risultato nel SUO ambiente", "Chiede tempo per \"pensarci\" — e non torna più", "Confronta il tuo preventivo con quello del concorrente solo sul prezzo", "Se vuoi un render professionale: €200-500 a render, 5-10 giorni di attesa"]
                  .map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /><span>{item}</span>
                    </li>
                  ))}
              </ul>
            </motion.div>
            <motion.div variants={staggerItem} className="rounded-xl border border-primary/20 bg-primary/5 p-6 hover:shadow-md transition-shadow">
              <h3 className="mb-4 font-bold text-primary text-lg font-display">Con Render AI</h3>
              <ul className="space-y-3 text-sm">
                {["Mostri al cliente ESATTAMENTE come starà il risultato a casa sua", "Il cliente si emoziona — vede il suo bagno nuovo, i suoi infissi", "L'effetto \"wow\" elimina l'obiezione \"ci penso\"", "Giustifichi il tuo prezzo premium mostrando il valore visivamente", "Render fotorealistico in 10 secondi, direttamente in appuntamento"]
                  .map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{item}</span>
                    </li>
                  ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ===== COME FUNZIONA ===== */}
      <AnimatedSection className="py-20 md:py-28 bg-muted/40" stagger>
        <div className="container mx-auto px-4">
          <motion.h2 variants={staggerItem} className="text-center text-2xl font-bold font-display md:text-4xl">
            3 click. 10 secondi. Un render che chiude la vendita.
          </motion.h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
            {[
              { icon: Camera, step: "1", title: "SCATTA", text: "Scatta una foto dell'ambiente attuale con lo smartphone. La finestra da sostituire, il bagno da ristrutturare, la facciata da rifare." },
              { icon: Palette, step: "2", title: "SCEGLI", text: "Seleziona il prodotto: tipo di infisso, colore, materiale, stile del bagno, colore facciata. Oppure descrivi a parole cosa vuoi ottenere." },
              { icon: Sparkles, step: "3", title: "MOSTRA", text: "In 10 secondi hai il render fotorealistico. Mostralo al cliente sul tablet o invialo via WhatsApp. Salva nella galleria e allega al preventivo PDF." },
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

      {/* ===== CASO STUDIO ===== */}
      <AnimatedSection className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold font-display md:text-4xl">"Da quando uso i render, chiudo il 35% in più."</h2>

          <Card className="mx-auto mt-12 max-w-3xl shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Azienda:</strong> Serramentista in Lombardia</p>
                <p><strong className="text-foreground">Settore:</strong> Infissi PVC/Alluminio</p>
                <p><strong className="text-foreground">Situazione:</strong> Preventivi sempre confrontati solo sul prezzo. Il cliente non percepiva la differenza tra un infisso da €8.000 e uno da €5.000.</p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-6" />

              <h3 className="font-bold text-lg font-display mb-4">Risultati dopo 60 giorni:</h3>
              <div className="grid gap-6 sm:grid-cols-3 mb-6">
                <CounterStat value={59} prefix="+" suffix="%" label="Tasso di chiusura" duration={1.5} />
                <CounterStat value={12} prefix="+" suffix="%" label="Prezzo medio" duration={1.5} />
                <CounterStat value={92} suffix="%" label="Clienti wow effect" duration={1.5} />
              </div>

              <div className="rounded-lg bg-muted/60 p-4 border border-border/50">
                <StarRating />
                <p className="mt-2 text-sm italic text-muted-foreground">
                  "I clienti mi dicono: sei l'unico che mi ha fatto VEDERE come verranno le finestre a casa mia. Questo vale più di qualsiasi sconto."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ===== PRICING ===== */}
      <AnimatedSection className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold font-display md:text-4xl">Meno di un caffè a render. Più vendite a fine mese.</h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <PricingCard key={plan.name} {...plan} onCta={scrollToCta} />
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-primary/30 bg-primary/5 p-4 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Fai i conti:</strong> se un singolo render ti aiuta a chiudere anche solo 1 commessa in più al mese da €8.000, il pacchetto si ripaga 10 volte.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* ===== FAQ ===== */}
      <AnimatedSection className="py-20 md:py-28">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center text-2xl font-bold font-display md:text-4xl">Domande frequenti</h2>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </AnimatedSection>

      {/* ===== GARANZIA ===== */}
      <AnimatedSection className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto px-4">
          <OfferGuarantee title="Garanzia 30 Giorni">
            <p>Prova i Render AI per 30 giorni. Se non migliora il tuo tasso di chiusura, ti rimborsiamo il setup.<br />Zero rischio.</p>
          </OfferGuarantee>
        </div>
      </AnimatedSection>

      {/* ===== CTA FINALE ===== */}
      <OfferCTABanner
        headline="Ogni preventivo senza render è una vendita più difficile."
        subtitle="Attiva i Render AI oggi. Domani chiudi con le immagini."
        ctaText="Attiva Render AI Ora"
        ctaOnClick={() => window.open("https://wa.me/393000000000?text=Ciao%2C%20vorrei%20attivare%20i%20Render%20AI%20di%20Edilizia.io", "_blank")}
        countdown={countdown}
      />

      <Footer />
    </div>
  );
}
