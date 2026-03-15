

# Trasformare "Piani e Prezzi" in "Quanto Puoi Risparmiare e Guadagnare"

## Concetto
Eliminare tutti i prezzi visibili (€297, €497, €997, €147, €67, ecc.) sia dalla homepage (`Pricing.tsx`) che dalla pagina Tariffe (`Tariffe.tsx`). Sostituirli con risultati concreti: appuntamenti generati, vendite chiuse, costi ridotti, margini aumentati. Ogni piano mostra il **valore che porta**, non il costo. Il CTA diventa "Prenota una Dimostrazione Gratuita di 15 Minuti".

## Modifiche

### 1. `src/components/sections/Pricing.tsx` (Homepage)
- Badge: "PIANI E PREZZI" → "QUANTO PUOI GUADAGNARE"
- Titolo: "Scegli Quanti Dipendenti Vuoi Sostituire" → "Scopri Quanto Puoi Risparmiare e Guadagnare"
- Rimuovere `price` da ogni piano. Al posto del prezzo, mostrare **risultati chiave**:
  - **Starter**: "+15 appuntamenti/mese", "−€2.200/mese di costi", "+30% lead qualificati"
  - **Professional** (featured): "+40 appuntamenti/mese", "−€6.600/mese di costi", "+€180K fatturato/anno recuperato"
  - **Enterprise**: "Risultati su misura per la tua azienda"
- Tutti i CTA → "Prenota Demo Gratuita 15 Min" con link a `#cta-finale`
- Aggiungere sotto le features una riga bold tipo "Risparmio stimato: €26.400/anno" per Starter, "€79.200/anno" per Professional

### 2. `src/pages/Tariffe.tsx`
- **Hero**: Titolo → "Scopri Quanto la Tua Azienda Può Risparmiare e Guadagnare con l'AI"
- **Pacchetti cards**: Rimuovere `price` e `period`. Sostituire con stat cards (tipo 3 mini-stat per piano): nuovi appuntamenti, costi ridotti, margine aumentato
- **Moduli singoli**: Rimuovere prezzi. Mostrare il beneficio: "Fino a 40 appuntamenti/mese in più" invece di "€147/mese"
- **Tabella comparativa**: Rimuovere i prezzi dalle intestazioni colonna ("Essenziale €297" → "Essenziale"). Mantenere le feature
- **Calcolatore ROI**: Già perfetto, mantenerlo com'è — è esattamente lo spirito giusto
- **CTA finale**: "Prenota una Dimostrazione Gratuita di 15 Minuti" (non 30), aggiungere "Ti mostriamo i numeri reali per la tua azienda in soli 15 minuti"
- **FAQ sul costo di setup**: Riformulare senza cifre, tipo "Il costo di setup dipende dal piano scelto e viene discusso durante la demo"

### File da modificare
- `src/components/sections/Pricing.tsx`
- `src/pages/Tariffe.tsx`

