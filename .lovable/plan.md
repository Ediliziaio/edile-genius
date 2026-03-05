

# Edilizia.io — Landing Page Completa

Landing page production-ready per agenzia AI verticale nel settore edile italiano, ispirata all'estetica JetHR (clean, bold, verde lime).

## Design System
- **Palette:** Verde lime (#3ECF6E) come brand principale, neutrali scuri per testo, accenti arancio/blu/oro
- **Font:** Plus Jakarta Sans (titoli 800, body 400-500) + JetBrains Mono (badge, labels)
- **Stile:** Card con border-radius 20-24px, ombre soft, spaziatura generosa, sfondo alternato bianco/grigio pallido
- **Animazioni:** Framer Motion per scroll-triggered entrances, floating elements, counter-up, accordion, custom cursor, scroll progress bar

## 13 Sezioni + Footer

1. **Announcement Bar** — Marquee verde con scarcity messaging + link demo
2. **Navbar** — Sticky con blur on scroll, logo "edilizia.io", menu centro, CTA destra
3. **Hero** — Due colonne: copy bold con CTA + card dashboard mockup flottante con pill animate e waveform visualizer
4. **Logo Bar / Social Proof** — Marquee loghi clienti + stat pillole (50+ aziende, 100k+ chiamate)
5. **Pain Section** — 5 accordion cards con problemi comuni del settore edile, dati evidenziati
6. **Soluzione — Due Prodotti** — Due grandi card affiancate: Agenti Vocali (card chiara) e Agenti AI Operativi (card scura)
7. **Use Cases Grid** — 6 card in griglia 3×2 con casi d'uso concreti (Inbound, Lead, Offerte, Reportistica, Assistenze, Call Center)
8. **ROI / Risparmio Economico** — Sezione scura con tabella comparativa OGGI vs CON AI + 3 stat grandi con counter animato
9. **Come Funziona** — Timeline 3 step orizzontale (Analisi → Training → Go Live) con connettori SVG animati
10. **Risultati / Social Proof** — Metriche animate + testimonial card scura con citazione
11. **Perché Edilizia.io** — 4 differentiator cards (Specializzazione, Voce Naturale, Setup Rapido, Evoluzione)
12. **Pricing** — 3 piani (Starter, Professional featured, Enterprise) con card centrale evidenziata
13. **Garanzia** — Card centrata con icona scudo, promessa rimborso 30 giorni
14. **CTA Finale** — Sezione scura con form contatto (nome, email, telefono, settore) + copy urgenza
15. **Footer** — 4 colonne (logo, servizi, azienda, contatti)

## Componenti Custom
- `WaveformVisualizer` — Barre sinusoidali animate nell'hero
- `FloatingCard` — Pill flottanti con animazione y-loop
- `CounterStat` — Counter animato al viewport trigger
- `AnimatedBadge` — Badge sezioni con entrata animata
- Custom cursor (dot + ring) nascosto su touch
- Scroll progress bar sotto navbar

## Note Tecniche
- Framer Motion per tutte le animazioni (verrà installato)
- Form con stati loading/success/error (webhook placeholder)
- Responsive: griglie → 1 colonna su mobile, titoli ridotti, pill hero nascoste
- Smooth scroll con offset navbar
- SEO meta tags configurati
- `prefers-reduced-motion` rispettato

