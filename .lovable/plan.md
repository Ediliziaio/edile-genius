

# Riscrivere la pagina Tariffe: minimalista, solo valore + CTA demo

## Concetto

Eliminare tutta la complessità attuale (pacchetti, moduli, toggle, tabella comparativa). Tenere solo:
1. **Hero** con messaggio "Il tuo Agente AI a partire da €147/mese" + sottotitolo sui risultati
2. **Griglia 6 stat cards** (stesse della homepage Pricing: +40 appuntamenti, −€6.600 costi, +€180K fatturato, +30% lead, −70% tempi, €79.200 risparmio)
3. **Calcolatore ROI** (già presente, funziona bene — mantenerlo)
4. **Social proof stats + FAQ** (mantenere)
5. **CTA finale** forte: "Prenota Dimostrazione Gratuita 15 Minuti"

Rimuovere: toggle pacchetti/moduli, array `pacchetti`, array `moduli`, tabella comparativa, tutte le card piani.

## Modifiche in `src/pages/Tariffe.tsx`

- **Eliminare**: `pacchetti`, `moduli`, `comparisonRows`, toggle `view` state, sezione cards pacchetti/moduli, sezione tabella comparativa
- **Hero**: Titolo → "Il Tuo Agente AI a Partire da €147/mese", sottotitolo → focus su risultati concreti, badge "Nessun vincolo · Disdici quando vuoi · Setup in 48 ore"
- **Sezione risultati**: Griglia 2x3 con stat cards identiche alla homepage (Calendar +40, TrendingDown −€6.600, TrendingUp +€180K, Users +30%, Clock −70%, PiggyBank €79.200) + CTA "Prenota Demo Gratuita 15 Min"
- **Calcolatore ROI**: Mantenerlo identico
- **FAQ + proof stats**: Mantenerli identici
- **CTA finale**: Mantenerlo identico

Un solo file da modificare: `src/pages/Tariffe.tsx`

