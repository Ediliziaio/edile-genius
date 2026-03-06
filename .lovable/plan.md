

# Sezione 7B — Calcolatrice Costi Interattiva

## Cosa costruire

Una nuova sezione interattiva con calcolatrice di confronto costi "Dipendente Umano vs Agente AI", posizionata tra ROISection e HowItWorks.

## File da creare/modificare

### 1. Creare `src/components/sections/CostCalculator.tsx`

Componente principale con 5 parti:

**Parte 1 — Header + 4 Slider di input** in griglia 2×2:
- Stipendio lordo (1400-3500, step 50, default 1800)
- N° attività/giorno (10-80, step 5, default 25)
- Ore perse/giorno (1-8, step 0.5, default 4)
- Anni anzianità (0-10, step 1, default 3)

Usa il componente `Slider` di Radix già presente, con styling personalizzato (track h-1, thumb verde 20px con shadow). Ogni slider in una card bg neutral-50, border neutral-200, radius 16px.

**Parte 2 — Confronto 2 colonne + VS centrale:**
- Card sinistra (Dipendente Umano): header rosso chiaro, 8 righe breakdown con formule reactive, box costi nascosti in fondo
- Divisore VS centrale (solo desktop): linea tratteggiata + cerchio "VS"
- Card destra (Agente AI): header verde chiaro, 8 righe breakdown reactive, box vantaggi in fondo

Formule calcolate con `useMemo` basate sui valori slider:
- Human: stipLordo×13 + INPS 30.35% + TFR 7.41% + IRAP 3.9% + formazione + pasto + tools + admin
- AI: canone scalato per volume (590/890/1190/1490) + setup ammortizzato 125/mese × 12

**Parte 3 — Saving Box** scuro (bg neutral-900):
3 colonne con risparmio annuo, % riduzione, ore liberate — tutti valori reactive.

**Parte 4 — Tabella Errori Umani:**
8 righe × 4 colonne (Tipo errore, Con Dipendente, Con AI, Impatto badge). Tabella con radius 20px, overflow hidden, shadow. Scroll orizzontale su mobile.

**Parte 5 — Nota metodologica:**
Card verde chiaro con disclaimer sui dati INPS/CCNL.

### 2. Modificare `src/pages/Index.tsx`

Importare `CostCalculator` e inserirlo tra `<ROISection />` e `<HowItWorks />`.

## Dettagli tecnici

- Usa `useState` per i 4 slider, `useMemo` per i calcoli derivati
- Formattazione euro con `toLocaleString('it-IT')`
- Framer Motion `useInView` per animazioni di entrata sezione
- Componente `AnimatedBadge` esistente per il badge header
- Slider Radix UI esistente con styling override (track sottile, thumb verde)
- Responsive: griglie collassano a 1 colonna, VS nascosto su mobile, tabella con overflow-x scroll
- `aria-label` e `aria-live="polite"` sui valori calcolati

