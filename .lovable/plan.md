

# Pagina Vendita Privata: Agente Vocale AI

## Panoramica
Creare una landing page di vendita direct-response su `/offerta/agente-vocale`, non indicizzata e non linkata nel menu. Header semplificato (solo logo + CTA). 8 sezioni con copy completo dal brief, brand "Edilizia.io".

## File da creare

### 1. `src/pages/offerta/AgentiVocale.tsx` (~600 righe)
Pagina completa con le 8 sezioni:

1. **Hero con urgenza** — Badge "Pagina riservata", headline, 3 mini-stat, CTA, nota setup
2. **Il Problema** — 3 card dolore (chiamate perse, costo/chiamata, lead non richiamati)
3. **La Soluzione** — Lista feature con check verdi + box evidenziato "In pratica"
4. **Caso Studio** — Card prima/dopo con colonne rosso/verde + risultato centrato
5. **Pricing 4 tier** — Starter €147, Professional €297 (evidenziato), Business €497, Enterprise €997+
6. **FAQ vendita** — 6 domande in Accordion shadcn
7. **Garanzia** — Box verde con 30 giorni soddisfatti o rimborsati
8. **CTA finale con urgenza** — Banner scuro + countdown 7 giorni (localStorage)

Tecniche:
- `usePageSEO` con noindex via meta tag aggiuntivo in `useEffect`
- Header semplificato inline (logo + CTA button, no Navbar completo)
- Footer standard
- Countdown: salva `firstVisit` in localStorage, calcola differenza 7 giorni
- Animazioni: `framer-motion` `useInView` per fade-in sezioni
- CTA puntano a `#cta-finale` (scroll) o link esterno
- Componenti: `Card`, `Button`, `Badge`, `Accordion`, `Separator`

### 2. `src/App.tsx` — 2 modifiche
- Aggiungere import lazy: `const OffertaAgenteVocale = lazy(() => import("./pages/offerta/AgentiVocale"));`
- Aggiungere route pubblica (prima delle route SuperAdmin): `<Route path="/offerta/agente-vocale" element={<SafeRoute><OffertaAgenteVocale /></SafeRoute>} />`

## Note
- Nessun link aggiunto alla Navbar — pagina accessibile solo via URL diretto
- Meta robots noindex nofollow aggiunto via useEffect nel componente
- Brand: "Edilizia.io" ovunque, mai "Edil Genius"
- Mobile-first: tutte le griglie stack su mobile, card full-width

