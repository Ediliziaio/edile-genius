

# Potenziare /offerta-unica: Sezioni Mancanti + Effetti + Copy Stile Hormozi/Kennedy/Abraham

## Analisi Attuale

La pagina ha una struttura base solida ma manca di:
- **Sezioni persuasive chiave**: Value Stack (Hormozi), "Per chi e/non per chi" (Kennedy), "Costo dell'inazione" (Abraham), Testimonial multipli, ROI Calculator inline
- **Effetti visivi**: Background piatti, nessuna animazione di sfondo, nessun elemento AI-themed
- **Immagini/visual AI**: Nessun waveform, circuiti, orbi luminosi

## Sezioni da Aggiungere (in ordine nella pagina)

### 1. Hero potenziato
- Aggiungere particelle/orbi animati con framer-motion (cerchi fluttuanti con blur verde)
- Aggiungere sotto il CTA una riga "🔴 Solo 7 posti disponibili questo mese" (scarcity Kennedy)

### 2. Nuova sezione: "Costo dell'Inazione" (dopo Problema)
- Titolo: "Ogni mese che aspetti, perdi €X.XXX"
- 3 righe con calcoli: costo chiamate perse/mese, costo dipendente improduttivo/anno, fatturato perso in 12 mesi
- Background con gradient rosso/arancio animato (pulse lento)
- CTA intermedio

### 3. Nuova sezione: "Per Chi È (e Per Chi NO)" (dopo Soluzione)
- Due colonne: "Perfetto per te se..." (check verdi) vs "NON è per te se..." (X rosse)
- Stile Dan Kennedy: qualificare il prospect, escludere chi non è serio
- Background con DotPattern + blob

### 4. Nuova sezione: "Value Stack" (dopo Risultati, stile Hormozi)
- Elenco di tutto ciò che ottengono con valore percepito in €
- Es: "Agente Vocale AI 24/7 (valore €3.200/mese)" ecc.
- Totale barrato → "Il tuo investimento: da €147/mese"
- Box con bordo primario brillante + shimmer animation

### 5. Nuova sezione: "Cosa Dicono i Clienti" (dopo Caso Studio)
- 3 testimonial card con stelle, nome, azienda, settore, quote
- Layout griglia responsive
- Background muted con floating orbs

### 6. Nuova sezione: "ROI Calculator Mini" (prima di FAQ)
- Slider semplice: "Quante chiamate ricevi al mese?" → calcolo risparmio annuo
- Risultato animato con CounterStat

### 7. Effetti Background su TUTTE le sezioni
- Sezioni alternate: floating gradient orbs (verde/blu) con motion animate
- Pattern a circuiti/grid AI-themed su sezioni scure
- Particelle fluttuanti nel Hero con loop infinito

## Dettaglio Tecnico

**File da modificare**: solo `src/pages/OffertaUnica.tsx`

- Aggiungere icone extra: `Users, TrendingUp, XCircle, Flame, MessageSquare, Phone, Sparkles`
- Aggiungere dati inline: `INACTION_COSTS`, `QUALIFICATION`, `VALUE_STACK`, `TESTIMONIALS`
- Ogni sezione usa `AnimatedSection` con `stagger` + `staggerItem`
- Background animati: `motion.div` con `animate={{ x, y, scale }}` + `transition={{ repeat: Infinity, duration: 8+ }}` per floating orbs
- Nessun nuovo file/componente necessario, tutto inline nel page component
- Aggiungere nav links per le nuove sezioni nell'array `NAV_LINKS`
- Aggiungere `useState` per lo slider del ROI calculator mini

## Struttura Finale della Pagina

```text
OfferHeader (sticky nav)
├── HERO (orbi animati + particelle + scarcity "7 posti")
├── LogoBarMini
├── IL PROBLEMA (3 card) [bg: gradient orbs]
├── COSTO DELL'INAZIONE (nuovo) [bg: red pulse gradient]
├── LA SOLUZIONE (3 step) [bg: dot pattern + blob]
├── PER CHI È / NON È (nuovo) [bg: floating orbs]
├── RISULTATI (6 stat) [bg: circuit pattern]
├── VALUE STACK (nuovo, Hormozi) [bg: shimmer border]
├── CASO STUDIO (prima/dopo)
├── TESTIMONIAL (nuovo, 3 card) [bg: muted + orbs]
├── COME FUNZIONA (3 step)
├── ROI CALCULATOR MINI (nuovo) [bg: gradient]
├── FAQ (accordion)
├── GARANZIA (scudo 3D)
└── CTA FINALE (OfferCTABanner)
```

