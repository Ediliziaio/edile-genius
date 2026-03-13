

# Fix: Edge Function usa prompt builder sbagliato — manca dichiarazione REPLACE vs KEEP

## Problema
Il render trasforma elementi che dovrebbero restare invariati (es. il WC diventa una vasca) perché l'Edge Function `generate-bathroom-render` usa un **prompt builder inline semplificato** (v1.0.0) che:

1. **Non ha il Block B "SELECTIVE REPLACEMENT DECLARATION"** — il blocco critico che dice all'AI "✅ REPLACE: WALL TILES" e "🚫 KEEP EXACTLY: TOILET & BIDET". Senza questo, l'AI interpreta liberamente cosa cambiare.
2. **Include blocchi per elementi con azione "mantieni"** — ad esempio se `config.vasca` ha dei valori default (tipo, forma, materiale), il builder li include come specifiche di sostituzione anche se l'utente non li ha selezionati.
3. **Manca la fisica dei materiali** (TILE_PHYSICS), le regole dettagliate per doccia/vasca/sanitari, e il negative prompt.

Il frontend costruisce il prompt corretto con `bathroomPromptBuilder.ts` (13 blocchi A-K + Layout + Quality Suffix + negative prompt), ma questo viene usato solo per debug — l'Edge Function ignora il prompt del client e ne costruisce uno proprio, molto più debole.

## Soluzione
Sostituire il prompt builder inline dell'Edge Function con una copia completa della logica di `bathroomPromptBuilder.ts`. L'Edge Function deve:

1. Leggere `session.configurazione` come `ConfigurazioneBagno` tipizzata
2. Usare lo stesso builder con Block B (REPLACE vs KEEP), Block H (sanitari con regole WC/bidet), e tutti i dizionari materiali
3. Includere il `BATHROOM_SYSTEM_PROMPT` completo (con le 10 regole) come system prompt
4. Appendere il `QUALITY_SUFFIX` e il `BATHROOM_NEGATIVE_PROMPT` nel prompt utente

### Dettagli tecnici
- **File**: `supabase/functions/generate-bathroom-render/index.ts`
- **Azione**: Eliminare la funzione `buildBathroomPrompt` inline (righe 194-366) e sostituirla con una copia fedele della logica di `src/modules/render-bagno/lib/bathroomPromptBuilder.ts` adattata per Deno (rimuovere `export`, usare tipi inline)
- **Blocchi critici da portare**:
  - `buildBlock_B` con `sostituzione` → dichiarazione REPLACE/KEEP
  - `buildBlock_E` con logica `azione: mantieni/sostituisci/rimuovi` per doccia
  - `buildBlock_F` con logica `azione` per vasca
  - `buildBlock_G` con logica `azione` per vanity
  - `buildBlock_H` con logica sanitari (WC sospeso/a terra, bidet)
  - `buildBlock_I` con logica rubinetteria
  - Dizionari `TILE_PHYSICS`, helper functions (posa, fuga, shower type, etc.)
  - `BATHROOM_SYSTEM_PROMPT`, `BATHROOM_NEGATIVE_PROMPT`, `QUALITY_SUFFIX`
- **Prompt version**: aggiornare a `"bagno-2.0.0"`
- **Rideploy** della Edge Function dopo la modifica

### Impatto atteso
L'AI riceverà il blocco "🚫 KEEP EXACTLY: TOILET & BIDET" e non trasformerà più il WC in una vasca o altri elementi non selezionati dall'utente.

