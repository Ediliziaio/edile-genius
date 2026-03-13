

# Render Tetto — Doc 1/5: Database + Prompt + Types

## Adaptation from Prompt

The prompt references `progetto_id REFERENCES progetti(id)` — the `progetti` table does not exist. This FK will be removed, matching the pattern of other render modules (stanza, facciata, etc.) which use only `user_id`.

The prompt also requests a single `render-tetto` bucket. Following the established pattern, I'll create **two** buckets: `tetto-originals` (private) and `tetto-results` (public), with proper per-user folder RLS on originals.

The `render_tetto_stili_pronti` table needs an `attivo` column read policy for authenticated users.

## Plan

### 1. SQL Migration

Create tables and storage following the stanza/facciata pattern:

- **`render_tetto_sessions`**: Same columns as prompt but **without** `progetto_id`. Add `status`, `config_json`, `prompt_user`, `prompt_system`, `prompt_version`, `original_image_path`, `original_image_width/height` to match stanza pattern.
- **`render_tetto_gallery`**: Gallery table with `session_id` FK, `result_image_url`, `original_image_url`, `config_snapshot`, `is_favorite`.
- **`render_tetto_stili_pronti`**: As specified, with authenticated SELECT policy.
- **Storage**: `tetto-originals` (private, user-folder RLS) + `tetto-results` (public read, auth write).
- **Indexes** on user_id + created_at.

### 2. Create TypeScript Types

**File**: `src/modules/render-tetto/types.ts`

As specified in the prompt — `AnalisiTetto`, `ConfigurazioneTetto`, `TipoManto`, `MaterialeGrondaia`, `ConfigLucernari`.

### 3. Create Prompt Builder

**File**: `src/modules/render-tetto/lib/buildPrompt.ts`

`buildTettoPrompt(config, analisi?)` with block dictionaries for all 12 manto types, finishes, gutter materials, skylight types. Returns structured prompt string.

### 4. Create System Prompt

**File**: `src/modules/render-tetto/lib/systemPrompt.ts`

`SYSTEM_PROMPT_TETTO` as specified.

### 5. Create Analysis Prompt

**File**: `src/modules/render-tetto/lib/analisiPrompt.ts`

`ANALISI_TETTO_PROMPT` as specified.

### 6. Create Default Config

**File**: `src/modules/render-tetto/lib/defaultConfig.ts`

`DEFAULT_CONFIG_TETTO` with tegole marsigliesi rosso mattone.

### 7. Update Supabase Types

Regenerate `src/integrations/supabase/types.ts` to include new tables.

### Files
- **Migration**: new SQL for tables + storage
- **Create**: `src/modules/render-tetto/types.ts`
- **Create**: `src/modules/render-tetto/lib/buildPrompt.ts`
- **Create**: `src/modules/render-tetto/lib/systemPrompt.ts`
- **Create**: `src/modules/render-tetto/lib/analisiPrompt.ts`
- **Create**: `src/modules/render-tetto/lib/defaultConfig.ts`
- **Edit**: `src/integrations/supabase/types.ts`

