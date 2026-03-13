

# Doc 4/7: AI Engine (Superfici + RAG + Sezioni)

## Key Adaptations from Prompt

- The prompt references `progetti(nome, tipo)` and `progetto_render_sessions` tables — these **don't exist**. Will use `cantieri(nome)` for project context and skip render session joins.
- `search_kb_chunks` RPC uses `p_company_id` (not `p_azienda_id`) — already correct in DB.
- The prompt's `genera-sezione-preventivo` does a broken `supabase.rpc('jsonb_set')` call — will use the simpler read-merge-write pattern it falls back to.
- `GEMINI_API_KEY` is not yet configured as a secret (user deferred). Edge functions will be created but won't work until the key is added.
- The `usePreventivo` hook references `preventivo.sconto_percentuale` and `voci_json` / `totale_netto` / `totale_lordo` columns that don't exist. Will adapt to actual DB columns: `voci` (JSONB), `subtotale`, `sconto_globale_percentuale`, `iva_percentuale`, `totale_finale`.
- All edge functions need CORS headers (missing from the prompt).

## Plan

### 1. Create Edge Function: `analizza-superfici-preventivo`
- Accepts `fotoUrls[]`, `oggettoCantiere`, `preventivoId`
- Downloads up to 5 photos, converts to base64, sends to Gemini 2.5 Flash Vision
- Returns structured JSON: `superfici[]` with mq estimates + confidence, `suggerimenti_voci[]`
- Saves result to `preventivi.superfici_stimate`
- CORS headers + auth via `getUser(token)`

### 2. Create Edge Function: `genera-sezione-preventivo`
- Accepts section config, project context, companyId
- RAG pipeline: builds query → generates embedding → `search_kb_chunks` RPC → assembles KB context
- Type-specific prompts for: `presentazione_azienda`, `analisi_progetto`, `descrizione_lavori`, `schede_prodotti`, `note_finali`
- Anti-hallucination system prompt
- Saves to `preventivi.sezioni_json` via read-merge-write
- Tracks `chunks_usati` per section

### 3. Create Edge Function: `genera-preventivo-completo`
- Orchestrator: loads preventivo + cantiere context
- Filters active AI/KB sections, calls `genera-sezione-preventivo` sequentially with 800ms pause
- Updates stato: `generazione` → `pronto`
- Returns success count + errors

### 4. Create Hook: `src/hooks/usePreventivo.ts`
- `useQuery` for preventivo data with 2s polling during `generazione` stato
- `analizzaSuperfici(fotoUrls)`: invokes surface analysis edge function
- `generaSezione()`: single section generation with progress tracking
- `generaTutte()`: full generation via orchestrator
- `updateVoci()`: recalculates totals using actual DB columns (`subtotale`, `sconto_globale_percentuale`, `iva_percentuale`, `totale_finale`)
- `updateCampo()`: generic field updater
- `progresseSezioni` state map for UI feedback

### 5. Update `supabase/config.toml`
Add 3 new functions with `verify_jwt = false`.

### Files
- **Create**: `supabase/functions/analizza-superfici-preventivo/index.ts`
- **Create**: `supabase/functions/genera-sezione-preventivo/index.ts`
- **Create**: `supabase/functions/genera-preventivo-completo/index.ts`
- **Create**: `src/hooks/usePreventivo.ts`
- **Edit**: `supabase/config.toml` (3 entries)

