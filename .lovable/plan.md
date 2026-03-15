

# Pagina Vendita Privata: Render AI

## Panoramica
Creare `src/pages/offerta/RenderAI.tsx` seguendo lo stesso pattern di `AgentiVocale.tsx` (AnimatedSection, useCountdown, header semplificato, Footer). Aggiungere la route in `App.tsx`.

## File da creare

### `src/pages/offerta/RenderAI.tsx` (~600 righe)
Stessa architettura di `AgentiVocale.tsx`: stesso `AnimatedSection`, `useCountdown` (con key `offerta_render_first_visit`), header logo+CTA, Footer.

8 sezioni dal brief:
1. **Hero** — Badge riservata, headline "Mostra al Cliente Come Starà Casa Sua", 3 mini-stat, CTA
2. **Before/After Grid** — 3 coppie placeholder (box colorati con testo descrittivo per infissi, bagno, facciata)
3. **Il Problema** — 2 colonne "Senza Render AI" (rosso) vs "Con Render AI" (verde) con liste ❌/✅
4. **Come Funziona** — 3 step orizzontali: Scatta, Scegli, Mostra
5. **Caso Studio** — Card testimonial serramentista, risultati +59% chiusure
6. **Pricing 4 tier** — Starter €67, Professional €127 (evidenziato), Business €247, Unlimited €447
7. **FAQ** — 5 domande in Accordion
8. **Garanzia + CTA finale** — Box verde garanzia 30gg + banner scuro con countdown

### `src/App.tsx` — 2 modifiche
- Import lazy: `const OffertaRenderAI = lazy(() => import("./pages/offerta/RenderAI"));`
- Route pubblica accanto a quella agente vocale: `<Route path="/offerta/render-ai" element={<SafeRoute><OffertaRenderAI /></SafeRoute>} />`

## Note
- Brand: "Edilizia.io" ovunque
- Meta noindex nofollow via useEffect
- CTA → WhatsApp con messaggio precompilato per Render AI
- Before/After: placeholder con div colorati e didascalie, pronte per immagini reali
- Countdown localStorage key diversa da agente vocale

