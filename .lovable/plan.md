

# Doc 4/7: AI Engine (RAG + Gemini Vision) — Gap Analysis & Plan

## Already Implemented

All three edge functions and the hook exist and are functional:

- **`analizza-superfici-preventivo`**: Receives photo URLs, calls Gemini Vision, returns surface analysis JSON, saves to `superfici_stimate`. Working.
- **`genera-sezione-preventivo`**: Full RAG pipeline — builds embedding query, calls `search_kb_chunks` RPC, constructs type-specific prompts (presentazione_azienda, analisi_progetto, descrizione_lavori, schede_prodotti, note_finali), calls Gemini, saves to `sezioni_json`. Working.
- **`genera-preventivo-completo`**: Orchestrator that filters AI/KB sections, calls `genera-sezione-preventivo` sequentially with 800ms pause, manages stato lifecycle. Working.
- **`usePreventivo` hook**: Polling during generation, surface analysis, single/all section generation, voci management, field updates. Working.

The `GEMINI_API_KEY` secret is **not configured** in Supabase secrets (not in the secrets list). This is a blocker for all AI functionality.

## Gaps to Fill

### 1. Missing `GEMINI_API_KEY` secret
The secret is referenced by 5 edge functions but is not in the configured secrets. Needs to be added.

### 2. Missing prompts for `condizioni_contrattuali`, `garanzie`, `superfici_computo`
The `genera-sezione-preventivo` function handles `presentazione_azienda`, `analisi_progetto`, `descrizione_lavori`, `schede_prodotti`, `note_finali` — but falls through to a generic default for the 3 new section types added in Doc 1. Add specialized prompts with anti-hallucination rules.

### 3. No shared `_shared/embedding.ts` utility
Each function duplicates embedding logic. Doc 4 proposes a shared utility. However, since all existing functions work independently, this is optional. Low priority.

### 4. `analizza-superfici-preventivo` response shape alignment
The doc proposes `voci_computo_suggerite` in the response but the existing function returns `suggerimenti_voci`. The hook (`usePreventivo`) references `suggerimenti_voci` indirectly via `AnalisiSuperfici` type. Need to verify type alignment.

## Plan

### Step 1: Add `GEMINI_API_KEY` secret
Use the secrets tool to prompt the user to add their Gemini API key.

### Step 2: Add missing prompts to `genera-sezione-preventivo`
Add cases for `condizioni_contrattuali`, `garanzie`, `superfici_computo` in the switch statement, following the same anti-hallucination pattern as existing prompts.

### Step 3: Verify type alignment
Check `AnalisiSuperfici` type matches the edge function response shape. Fix any mismatches.

## Files to Modify

| File | Action |
|------|--------|
| `supabase/functions/genera-sezione-preventivo/index.ts` | Add 3 missing section prompt cases |
| Supabase secrets | Add `GEMINI_API_KEY` |

No new files or DB changes needed. The architecture is complete.

