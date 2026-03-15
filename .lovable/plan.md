

# Pagina Vendita Privata: Preventivatore AI

## Panoramica
Creare `src/pages/offerta/PreventivatoreAI.tsx` seguendo lo stesso pattern di `AgentiVocale.tsx` (AnimatedSection, useCountdown, header semplificato, Footer). Aggiungere route in `App.tsx`. Brand: "Edilizia.io" ovunque.

## File da creare

### `src/pages/offerta/PreventivatoreAI.tsx` (~650 righe)
Stessa architettura: `AnimatedSection`, `useCountdown` (key: `offerta_prev_first_visit`), header logo+CTA, Footer, noindex meta via useEffect.

9 sezioni dal brief:
1. **Hero** — Badge riservata, headline "Smetti di Perdere 2 Ore…", 3 mini-stat (30 sec, zero errori, PDF auto), CTA
2. **Il Problema** — Blocco narrativo con punti dolore ❌ (tempo, errori, IVA, detrazioni)
3. **La Soluzione** — 6 feature card in griglia 2×3 (Calcolo, IVA, Detrazioni, PDF, Varianti, Analytics)
4. **Come Funziona** — 4 step orizzontali: Seleziona, Configura, Verifica, Invia
5. **Confronto mercato** — Tabella comparativa Excel vs Software vs Edilizia.io
6. **Caso Studio** — Card testimonial serramentista, -96% tempo, +200% preventivi
7. **Pricing 4 tier** — Starter €47, Professional €97 (evidenziato), Business €197, Unlimited €347
8. **FAQ** — 5 domande in Accordion
9. **Garanzia + CTA finale** — Box verde 30gg + banner scuro con countdown

### `src/App.tsx` — 2 modifiche
- Import lazy: `const OffertaPreventivatoreAI = lazy(() => import("./pages/offerta/PreventivatoreAI"));`
- Route accanto alle altre offerte: `<Route path="/offerta/preventivatore-ai" element={<SafeRoute><OffertaPreventivatoreAI /></SafeRoute>} />`

## Note
- CTA → WhatsApp con messaggio precompilato per Preventivatore AI
- Tabella comparativa usa componente `Table` di shadcn
- Countdown localStorage key unica (`offerta_prev_first_visit`)

