

# Pagina Vendita Privata: Pacchetto Completo

## Panoramica
Creare `src/pages/offerta/PacchettoCompleto.tsx` seguendo lo stesso pattern delle altre 3 pagine offerta (AnimatedSection, useCountdown, header semplificato, Footer). Aggiungere route in `App.tsx`. Brand: "Edilizia.io".

## File da creare

### `src/pages/offerta/PacchettoCompleto.tsx` (~750 righe)
Stessa architettura: `AnimatedSection`, `useCountdown` (key: `offerta_pacchetto_first_visit`), header logo+CTA, Footer, noindex meta via useEffect.

8 sezioni:
1. **Hero** — Badge riservata, headline "Smetti di Comprare gli Attrezzi Uno alla Volta", 3 mini-stat, CTA scroll a pricing
2. **Confronto Killer** — Due blocchi rosso/verde: singoli moduli (€685/mese, 5 setup) vs Pacchetto Crescita (€497/mese, 1 setup), risparmio €2.256/anno evidenziato
3. **Perché l'integrazione** — 4 scenari workflow (Lead 21:30, Appuntamento, Cantiere, Fine Mese) con frecce → e confronto "CON I SINGOLI MODULI"
4. **3 Pacchetti** — Essenziale €297, Crescita €497 (evidenziato), Dominio €997 + nota Enterprise
5. **Testimonial** — 3 card brevi con citazioni
6. **FAQ** — 5 domande in Accordion
7. **Garanzia Doppia** — Box verde con 2 punti garanzia
8. **CTA Finale** — Banner scuro con countdown + link secondario a /tariffe

### `src/App.tsx` — 2 modifiche
- Import lazy: `const OffertaPacchettoCompleto = lazy(() => import("./pages/offerta/PacchettoCompleto"));`
- Route: `<Route path="/offerta/pacchetto-completo" element={<SafeRoute><OffertaPacchettoCompleto /></SafeRoute>} />`

## Note
- CTA → WhatsApp con messaggio precompilato per pacchetto completo
- Link "Torna alla pagina Pricing" punta a `/tariffe`
- Sezione 2 (confronto killer) usa massimo contrasto visuale rosso/verde con Card
- Sezione 3 (workflow) usa layout timeline con icone e frecce tra step

