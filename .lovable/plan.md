

# Sanitari sempre configurabili — WC e bidet selezionabili anche senza "sostituzione completa"

## Problema attuale
Il pannello WC & Bidet appare solo quando `sostituzione.sanitari = true` (riga 901). Se l'utente non attiva esplicitamente il toggle sanitari, non può scegliere tipo WC o azione bidet e il prompt dice "MODERNIZE" generico — l'AI decide da sola.

## Soluzione

### 1. UI: mostrare sempre il pannello WC & Bidet nello step di configurazione
- Rimuovere il guard `{sostituzione.sanitari && ...}` (riga 901) e mostrare sempre la card WC & Bidet
- Quando `sostituzione.sanitari` è false, mostrare il pannello con un titolo tipo "🚽 WC & Bidet (personalizza stile)" per chiarire che non è una sostituzione completa ma una scelta di tipo
- Aggiungere anche l'opzione `azione_wc` nel pannello (attualmente c'è solo `wc_tipo` ma non la scelta mantieni/sostituisci per il WC)

### 2. Prompt: usare sempre la configurazione sanitari nel Block H
- Modificare `buildBlock_H` nell'Edge Function: anche quando `sostituzione.sanitari = false`, generare comunque le specifiche WC/bidet basate su `configSanitari` invece di restituire "KEPT AS ORIGINAL"
- Se `sostituzione.sanitari = false` ma l'utente ha configurato tipo WC e azione bidet, il Block H includerà le specifiche con nota "upgrade to specified type while keeping position"

### 3. Block B: terza categoria per sanitari configurati ma non in sostituzione completa
- Se `sostituzione.sanitari = false` ma `configSanitari` ha valori diversi dai default, classificare come `🔄 UPGRADE TYPE: TOILET & BIDET` invece di generico "MODERNIZE"

### File da modificare
- `src/pages/app/RenderBagnoNew.tsx` — rimuovere guard condizionale, mostrare sempre pannello sanitari
- `supabase/functions/generate-bathroom-render/index.ts` — aggiornare Block H e Block B per usare sempre configSanitari + redeploy

