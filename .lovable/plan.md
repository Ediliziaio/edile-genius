

# Trasformare /offerta-unica in Landing Page di Vendita

## Obiettivo

Riscrivere `src/pages/OffertaUnica.tsx` da clone della homepage a una landing page di vendita dedicata, seguendo lo standard UX delle pagine `/offerta/*` (OfferHeader, AnimatedSection, countdown 7 giorni, noindex, DotPattern, HeroBlob) ma con focus su **lead generation → demo 15 minuti**.

## Struttura della pagina

```text
┌──────────────────────────────────────────────┐
│  OfferHeader (sticky, nav sezioni, CTA)      │
├──────────────────────────────────────────────┤
│  HERO                                        │
│  Badge: "🔒 Pagina riservata — 7 giorni"    │
│  Titolo: "Le imprese edili più avanzate      │
│   hanno già integrato l'AI..."               │
│  Sottotitolo focus su sostituzione ruoli     │
│  Countdown 7 giorni                          │
│  CTA: "Prenota Analisi Gratuita 15 Min"     │
│  3 pill: Setup 7gg / Garanzia 30gg / 24/7   │
├──────────────────────────────────────────────┤
│  LogoBarMini                                 │
├──────────────────────────────────────────────┤
│  IL PROBLEMA (3 card dolore)                 │
│  - Dipendenti improduttivi costano           │
│  - Chiamate perse, lead freddi               │
│  - Margini erosi da costi fissi              │
├──────────────────────────────────────────────┤
│  LA SOLUZIONE (checklist cosa facciamo)      │
│  - Analizziamo il tuo organico               │
│  - Identifichiamo figure sostituibili        │
│  - Attiviamo Agenti AI specializzati         │
├──────────────────────────────────────────────┤
│  RISULTATI (griglia 6 stat + CounterStat)    │
│  +40 appuntamenti, -€6.600, +€180K, etc.    │
├──────────────────────────────────────────────┤
│  CASO STUDIO (prima/dopo come AgentiVocale)  │
├──────────────────────────────────────────────┤
│  COME FUNZIONA (3 step: Analisi→Setup→Live)  │
├──────────────────────────────────────────────┤
│  FAQ (accordion, 6-8 domande)                │
├──────────────────────────────────────────────┤
│  GARANZIA (OfferGuarantee 30 giorni)         │
├──────────────────────────────────────────────┤
│  CTA FINALE (OfferCTABanner con form/WA)     │
├──────────────────────────────────────────────┤
│  Footer                                      │
└──────────────────────────────────────────────┘
```

## File da modificare

**`src/pages/OffertaUnica.tsx`** — Riscrittura completa:

- Rimuovere tutti gli import delle sezioni homepage (Hero, PainSection, Pricing, ecc.)
- Importare i componenti shared offerta: `AnimatedSection`, `OfferHeader`, `OfferBadge`, `OfferCTABanner`, `OfferCountdown`, `OfferGuarantee`, `LogoBarMini`, `SectionDivider`, `HeroBlob`, `DotPattern`, `useCountdown`, `useNoIndex`, `staggerContainer`, `staggerItem`
- Importare `CounterStat` per i KPI animati
- Aggiungere `useNoIndex()` per non indicizzare
- Aggiungere `useCountdown("offerta_unica_first_visit")` per il timer 7 giorni
- Costruire tutte le sezioni inline (come fanno AgentiVocale.tsx e PacchettoCompleto.tsx)
- Ogni CTA punta a `#cta-finale` con scroll smooth
- Nessun lazy loading necessario (pagina singola, contenuto inline)

