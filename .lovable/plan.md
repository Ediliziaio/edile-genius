

# Generatore Preventivo AI — Doc 1/7: Architecture + DB + pgvector

## Critical Adaptations from Prompt

The prompt's SQL references tables that **don't exist** in this project:
- `aziende` → this project uses **`companies`**
- `azienda_members` → this project uses **`profiles.company_id`** + **`my_company()`** SQL function
- `progetti` → doesn't exist; the project uses `cantieri` for job sites

All SQL will be rewritten to use the existing schema conventions.

### Existing State
- **`preventivi` table**: Already exists with 60+ columns (company_id, voci JSONB, template_id, cliente_*, stato, pdf_url, etc.). Will add RAG-specific columns rather than recreating.
- **`preventivo_templates` table**: Already exists but is a **branding/layout config** table (logo, colors, fonts, default texts). The prompt's concept of "section-based templates" (ordered array of sections with configs) is new — will be added as a `sezioni` JSONB column to the existing table.
- **`preventivi-pdf` bucket**: Already exists (public). Only `preventivo-kb` bucket is needed.
- **pgvector extension**: Not enabled yet.

## Plan

### 1. Database Migration

**Enable pgvector:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Create `preventivo_kb_documenti` table** (company KB documents):
- Uses `company_id` referencing `companies(id)` (not `azienda_id`)
- Columns: nome, descrizione, file_url, file_type, file_size_kb, pagine, categoria, stato, errore_msg, indicizzato_at, chunks_count, tags, visibile
- RLS: `company_id = my_company()`

**Create `preventivo_kb_chunks` table** (vector embeddings):
- `company_id` + `documento_id` FK
- `embedding vector(768)` for Gemini text-embedding-004
- ivfflat index with `lists = 100`
- Category index for filtered RAG
- RLS: `company_id = my_company()`

**Add RAG columns to existing `preventivi` table:**
- `render_ids UUID[]` — selected render session IDs
- `foto_analisi_urls TEXT[]` — surface analysis photos
- `superfici_stimate JSONB` — AI surface estimates
- `sezioni_json JSONB` — generated section content
- `oggetto_lavori TEXT` — work description
- `indirizzo_cantiere TEXT` — job site address
- `note_interne TEXT` — internal notes

**Add `sezioni` JSONB column to existing `preventivo_templates`:**
- Stores the ordered array of `PreventivoSezione` objects
- Coexists with existing branding columns

**Create `search_kb_chunks()` SQL function:**
- Parameters: `p_company_id`, `p_embedding vector(768)`, `p_categoria`, `p_top_k`, `p_threshold`
- Returns matching chunks with cosine similarity score

**Create `preventivo-kb` storage bucket** (private, 50MB limit) + RLS policies.

### 2. Create TypeScript Types

**File: `src/modules/preventivo/types.ts`**
- All types from the prompt, adapted to use `company_id` instead of `azienda_id`
- `TipoSezione`, `PreventivoSezione`, `SectionConfig` (and all sub-configs)
- `PreventivoVoce`, `KBDocumento`, `AnalisiSuperfici`, `SuperficieStimata`
- `Preventivo`, `PreventivoTemplate`

### 3. Create Default Template

**File: `src/modules/preventivo/lib/defaultTemplate.ts`**
- `SEZIONI_DEFAULT` — 10 ordered sections with specific configs
- `TIPO_SEZIONE_META` — label, emoji, description, color for each section type
- Uses `crypto.randomUUID()` instead of `uuid` library (no extra dependency)

### Files
- **Migration**: Enable pgvector, create 2 new tables, alter 2 existing tables, create function, create bucket
- **Create**: `src/modules/preventivo/types.ts`
- **Create**: `src/modules/preventivo/lib/defaultTemplate.ts`

