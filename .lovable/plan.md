

# Miglioramento Pagina "Come Funziona"

## Problema attuale
La pagina e' piatta e informativa. Manca impatto emotivo, social proof, urgency e persuasione. Rispetto alla Garanzia e Tariffe (gia' migliorate), e' la pagina piu' debole. I 3 step + ImplementationSteps sono ridondanti (dicono la stessa cosa due volte).

## Piano di riscrittura

### 1. Hero potenziato
- Badge "OPERATIVO IN 14 GIORNI"
- H1 piu' aggressivo: "Mentre Tu Leggi Questa Pagina, Un Tuo Competitor Sta Gia' Usando L'AI. Tu Quanto Vuoi Aspettare?"
- Sottotitolo con reason-why + 3 mini-stat inline (14 giorni setup, 0 competenze tecniche, 100% gestito da noi)

### 2. Sezione "Il Problema" (prima dei 3 step)
- "Perche' Le Altre Soluzioni Ti Hanno Deluso": 3 card con problemi comuni (software complicati, consulenti generici, mesi di implementazione) con icone XCircle rosse

### 3. I 3 Step — Redesign visivo
- Rimuovere layout grid-cols attuale, passare a layout verticale con **linea connettore** verde verticale tra i 3 step
- Ogni step: numero grande a sinistra, card con titolo + descrizione + checklist + risultato atteso in grassetto verde ("Risultato: Agente configurato e testato")
- Aggiungere un "deliverable" concreto per ogni step

### 4. Rimuovere ImplementationSteps (ridondante)
- I 4 step di ImplementationSteps dicono le stesse cose dei 3 step. Integrare i dettagli migliori dentro i 3 step principali e togliere il componente

### 5. Sezione "Cosa Ti Consegniamo" — Value Stack
- H2: "Ecco Cosa Ricevi. Gratis. Prima Di Pagare Qualsiasi Cosa."
- Lista di deliverable concreti con valore percepito (es. "Audit processo vendita — valore €2.000", "Configurazione agente personalizzato — valore €3.500", etc.)
- Totale valore stack vs costo reale

### 6. Sezione "Domande Frequenti" — 4 FAQ
- "Devo avere competenze tecniche?" → No, facciamo tutto noi
- "Quanto tempo devo dedicare?" → 30 min call iniziale, poi zero
- "E se non mi piace il risultato?" → Garanzia 30 giorni (link a /garanzia)
- "Funziona per il mio settore specifico?" → Solo edilizia, niente generalisti

### 7. CTA Finale potenziato
- Stile dark come Garanzia (bg-neutral-900)
- H2: "Ogni Giorno Che Aspetti, Paghi Uno Stipendio In Piu'."
- P.S. strategico
- CTA button grande

## File da modificare
- **`src/pages/ComeFunziona.tsx`** — riscrittura completa

