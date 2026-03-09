

# Piano: Servizi AI completi + Calcolatore di Risparmio per ogni pagina "Per Chi È"

## Cosa cambia

### 1. Ampliare i dati in `src/data/perChiE.ts`

Aggiungere a ogni categoria (`PerChiECategory`) due nuovi campi:

- **`services`**: array di 6 servizi AI specifici per settore, ognuno con titolo, descrizione e icona:
  1. Agente Vocale AI (risposta telefonica H24)
  2. WhatsApp AI (gestione conversazioni e follow-up)
  3. Gestione Cantieri (coordinamento, aggiornamenti, scadenze)
  4. Gestione Documenti (DDT, certificazioni, pratiche)
  5. Generazione Preventivi Automatici (raccolta dati + output)
  6. Campagne Outbound (acquisizione attiva)

  Ogni servizio viene riadattato al linguaggio e alle esigenze specifiche del settore (es. per idraulici l'agente vocale gestisce emergenze notturne, per serramentisti raccoglie misure e tipologie infissi).

- **`calculator`**: parametri per il mini-calcolatore di risparmio specifico per settore:
  - `defaultStipendio` (varia per settore)
  - `defaultLeadMensili`
  - `costoMedioLead`
  - `tassoConversioneAttuale`
  - `valoreCommessaMedia`

### 2. Aggiornare `src/pages/PerChiEDetail.tsx`

Aggiungere 2 nuove sezioni tra ROI e Caso Studio:

**Sezione "I Nostri Servizi AI Per [Settore]"**
- Griglia 2x3 di card con icone lucide-react
- Ogni card mostra il servizio riadattato al settore
- Stile coerente con le card soluzioni esistenti (border primary, CheckCircle2)

**Sezione "Calcolatore di Risparmio"**
- Versione semplificata del CostCalculator della homepage
- 2-3 slider (stipendio dipendente, lead mensili, ore ripetitive)
- Box risultato con risparmio annuo stimato, ore liberate, lead recuperati
- Valori di default personalizzati per ogni settore tramite il campo `calculator` nei dati

### 3. Riadattare i 3 `solutions` esistenti

Riscrivere le 3 soluzioni attuali di ogni categoria per essere più specifiche e menzionare i servizi AI concreti (vocale, WhatsApp, preventivi automatici, gestione cantieri, documenti) invece di descrizioni generiche.

## File da modificare
- **`src/data/perChiE.ts`** — aggiungere `services` e `calculator` a ogni categoria + riscrivere `solutions`
- **`src/pages/PerChiEDetail.tsx`** — aggiungere sezione servizi AI e mini-calcolatore

