

# Pagina Tariffe — Calcolatore di Risparmio Interattivo

## Concept
Pagina dedicata `/tariffe` ispirata ad Agicap: niente prezzi fissi visibili, ma un **calcolatore interattivo** che mostra quanto l'azienda risparmia e guadagna con Edilizia.io. L'utente inserisce i propri dati aziendali e vede in tempo reale i risultati. Il focus è sul valore, non sul costo.

## Struttura della pagina

### 1. Hero
- Badge "TARIFFE PERSONALIZZATE"
- H1: "Non Ti Diciamo Quanto Costa. Ti Mostriamo Quanto Risparmi."
- Sottotitolo: ogni azienda è diversa, il prezzo è calibrato sui tuoi numeri reali

### 2. Calcolatore Interattivo (sezione principale)
Card grande con 4 slider/input per configurare il proprio scenario:
- **Numero dipendenti da sostituire** (1-10, slider)
- **Stipendio lordo medio/mese** (€1.400-€3.500, slider)
- **Lead mensili gestiti** (10-200, slider)
- **Tasso di conversione attuale** (1%-15%, slider)

**Risultati in tempo reale** (panel affiancato o sotto):
- 💰 **Risparmio annuo su personale** — calcolo: (dipendenti × stipendio × 13 × 1.45) - costo AI stimato
- 📈 **Fatturato aggiuntivo stimato** — calcolo: lead persi recuperati × valore medio commessa
- ⏱ **Ore/anno liberate** — calcolo: dipendenti × ore ripetitive × 220 giorni
- 📊 **ROI stimato primo anno** — rapporto risparmio/investimento

### 3. Sezione "Cosa Include Ogni Piano"
3 colonne (Starter / Professional / Enterprise) senza prezzi, solo feature list con check marks. Riutilizzo dati da `Pricing.tsx` esistente. CTA: "Richiedi il Tuo Preventivo Personalizzato"

### 4. Sezione "Perché Nessun Prezzo Fisso?"
3 card con reason-why:
- "Ogni azienda ha un organico diverso"
- "Il risparmio dipende dal tuo settore"
- "Preferiamo mostrarti i numeri prima di chiederti soldi"

### 5. Social Proof + CTA Finale
- Barra statistiche (500+ aziende, 97% rinnovo, €2.3M risparmiati)
- CTA form "Richiedi Preventivo Personalizzato" con link a `#cta-finale` o form inline

## File da creare/modificare
- **Creare**: `src/pages/Tariffe.tsx` — pagina completa con calcolatore
- **Modificare**: `src/App.tsx` — aggiungere route `/tariffe`
- **Modificare**: `src/components/sections/Navbar.tsx` — aggiungere link "Tariffe" nel menu

## Note tecniche
- Riutilizzo pattern slider da `CostCalculator.tsx` (stesso `SliderCard` component)
- Animazioni `framer-motion` con `useInView` + `staggerChildren`
- Calcoli in `useMemo` reattivi agli slider
- Responsive: su mobile i risultati vanno sotto gli slider
- I piani feature list riprendono i dati già in `Pricing.tsx`

