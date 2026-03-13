

# Generatore Preventivo AI — Doc 2/7: KB Upload + Embedding Pipeline

## Key Adaptations

- The prompt uses `aziendaId` everywhere — this project uses `company_id` and `useCompanyId()` hook
- No `useAzienda` hook exists — will use existing `useCompanyId()`
- `GEMINI_API_KEY` is **not configured** as a secret — must be added before edge functions work
- DB tables (`preventivo_kb_documenti`, `preventivo_kb_chunks`) and `search_kb_chunks()` function already exist from Doc 1 migration
- The `preventivo-kb` storage bucket already exists (private)
- The prompt's `KnowledgeBaseManager` page references `useAzienda` — will replace with `useCompanyId()`

## Secrets Required

**GEMINI_API_KEY** must be added as a Supabase secret. The edge functions use Gemini for:
- PDF text extraction (Gemini 2.5 Flash vision)
- Text embedding (text-embedding-004, 768 dimensions)

## Plan

### 1. Add GEMINI_API_KEY secret
Request user to provide their Gemini API key.

### 2. Create Edge Function: `extract-document-text`
- Accepts `documentoId`, authenticates user
- Downloads file from `preventivo-kb` storage
- PDF: sends to Gemini 2.5 Flash as inline_data for OCR/extraction, returns page-by-page text
- TXT: decodes directly
- Updates document stato to `elaborazione` then returns extracted pages
- On error: updates stato to `errore` with message
- CORS headers, `verify_jwt = false` in config.toml

### 3. Create Edge Function: `chunk-and-embed`
- Accepts `documentoId`, `companyId`, `categoria`, `pagineTesto`
- Splits text into ~600 char chunks with 80 char overlap, breaking at sentence boundaries
- Generates embedding via Gemini text-embedding-004 (768 dim) with `RETRIEVAL_DOCUMENT` task type
- Rate limiting: 500ms pause every 5 embeddings
- Deletes old chunks (re-indexing), batch inserts in groups of 20
- Updates document: stato → `indicizzato`, chunks_count, indicizzato_at

### 4. Create Edge Function: `embed-query`
- Accepts `testo`, generates embedding with `RETRIEVAL_QUERY` task type
- Returns embedding string for use with `search_kb_chunks` RPC
- Lightweight function for client-side RAG queries

### 5. Create Hook: `src/hooks/useKnowledgeBase.ts`
- Uses `useCompanyId()` instead of prompt's `useAzienda`
- Query: fetches `preventivo_kb_documenti` ordered by created_at desc
- Auto-polling every 3s when documents are in `elaborazione`/`caricato` state
- `uploadDocumento()`: Storage upload → DB insert → extract-document-text → chunk-and-embed (4-step with progress)
- `eliminaDocumento()`: deletes from DB (cascade removes chunks)
- `reIndicizza()`: resets stato, re-runs extraction + embedding
- `testSearch()`: embed-query → search_kb_chunks RPC
- Stats computed from document list

### 6. Create Page: `src/pages/app/KnowledgeBasePreventivo.tsx`
KB management page with:
- Stats bar (total, indexed, processing, chunks)
- Drag & drop upload zone with category selector
- Upload progress indicators
- RAG test search panel (generates query embedding, calls search_kb_chunks, shows results with similarity %)
- Document list with category filter, status badges, re-index/delete actions

### 7. Add Route in App.tsx
- Lazy import + route at `/app/preventivo-kb`

### Files
- **Create**: `supabase/functions/extract-document-text/index.ts`
- **Create**: `supabase/functions/chunk-and-embed/index.ts`
- **Create**: `supabase/functions/embed-query/index.ts`
- **Create**: `src/hooks/useKnowledgeBase.ts`
- **Create**: `src/pages/app/KnowledgeBasePreventivo.tsx`
- **Edit**: `src/App.tsx` (add route)
- **Edit**: `supabase/config.toml` (add 3 functions)

