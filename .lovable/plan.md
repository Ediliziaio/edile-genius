

# Doc 2/7: Knowledge Base — Gap Analysis & Plan

## Already Implemented ✅

Almost everything from Doc 2 is already in place:

- **Edge Functions**: `extract-document-text`, `chunk-and-embed`, `embed-query` — all deployed and functional
- **Hook**: `useKnowledgeBase` with upload pipeline, delete, re-index, test search, polling
- **Page**: `KnowledgeBasePreventivo` with stats, drag-drop upload, category filter, RAG search test, document list
- **DB**: `search_kb_chunks` RPC, `preventivo_kb_documenti`, `preventivo_kb_chunks` tables
- **Storage**: `preventivo-kb` bucket exists
- **Constants**: `CATEGORIA_KB_META`, KB processing constants all defined

## Gaps to Fill

### 1. Extract `KnowledgeBaseManager` as reusable component
The doc specifies `src/components/preventivo/KnowledgeBaseManager.tsx` as a standalone component (used by the page and potentially embedded elsewhere). Currently all logic lives in the page file. Extract the UI into a component, keep the page as a thin wrapper.

### 2. Add confirm dialog on delete
Current delete has no confirmation. Doc specifies `AlertDialog` with chunk count warning.

### 3. Add chunk preview dialog
Doc specifies a "Preview Chunks" dialog showing the first 5 chunks of a document. Currently missing.

### 4. Install `react-dropzone`
Doc uses `useDropzone` for cleaner drag-drop UX with file type validation. Currently using native drag/drop events.

### 5. DOCX handling in edge function
Current `extract-document-text` only handles `pdf` and `txt`. Add a `docx` branch that also uses Gemini Vision (DOCX can be sent as inline data).

## Files to Modify

| File | Action |
|------|--------|
| `src/components/preventivo/KnowledgeBaseManager.tsx` | **Create** — Extract reusable component with confirm dialog, chunk preview, react-dropzone |
| `src/pages/app/KnowledgeBasePreventivo.tsx` | **Simplify** — Import and render `KnowledgeBaseManager` |
| `supabase/functions/extract-document-text/index.ts` | **Update** — Add DOCX support via Gemini Vision |
| `package.json` | **Add** `react-dropzone` dependency |

