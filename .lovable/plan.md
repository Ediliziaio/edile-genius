

# Prompt 1 — Knowledge Base: Upload File PDF/TXT reale

## Cosa fare

Rendere funzionante l'upload di file (PDF, TXT, CSV) nel tab "File" del dialog "Aggiungi Documento" nella pagina `/app/knowledge-base`.

## Modifiche

### 1. Creare bucket Storage `knowledge-docs`
Migration SQL per creare il bucket con policy RLS per company users e superadmin.

### 2. Aggiornare `src/pages/app/KnowledgeBase.tsx`
- Aggiungere state: `uploadFile`, `uploadProgress`, `uploading`
- Nel tab "File": sostituire il pulsante disabilitato con un drag-and-drop zone funzionante + input file
- Al click "Carica File":
  1. Validare dimensione (max 10MB) e tipo (.pdf/.txt/.csv)
  2. Upload su Supabase Storage bucket `knowledge-docs` path `{companyId}/{uuid}-{filename}`
  3. Mostrare progress bar durante upload
  4. Inserire record in `ai_knowledge_docs` con `type="file"`, `file_path`, `size_bytes`, `status="processing"`
  5. Invocare Edge Function `add-knowledge-doc` con `{ doc_id, company_id, file_path, type: "file", name }`
  6. Toast conferma con nome file
- Nella lista documenti: mostrare `<Loader2>` spinner animato accanto ai doc con `status="processing"`

### 3. Aggiornare Edge Function `supabase/functions/add-knowledge-doc/index.ts`
Aggiungere un ramo per `type === "file"`:
- Accettare parametro `doc_id` (opzionale) per aggiornare un record esistente invece di crearne uno nuovo
- Se `type === "file"` e `file_path` presente:
  1. Scaricare il file da Storage con `supabase.storage.from("knowledge-docs").download(file_path)`
  2. Per TXT/CSV: leggere il testo direttamente (`new TextDecoder().decode(bytes)`)
  3. Per PDF: estrarre testo base (decode UTF-8, fallback su "PDF - contenuto binario")
  4. Aggiornare il record con `content_preview` (primi 500 char) e `status="ready"`
  5. In caso di errore: `status="error"`
- Se `doc_id` presente, usare update invece di insert

### 4. Config TOML
Aggiungere `[functions.add-knowledge-doc] verify_jwt = false` se non presente.

## File coinvolti
- `src/pages/app/KnowledgeBase.tsx` — UI upload funzionante
- `supabase/functions/add-knowledge-doc/index.ts` — elaborazione file
- `supabase/config.toml` — JWT config
- Migration SQL — bucket + policy

