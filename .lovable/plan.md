

# Fix Criticita Knowledge Base

## Problemi identificati

1. **Doppio insert**: Il frontend (`KnowledgeBase.tsx` righe 125-146 per URL, 161-181 per text) inserisce prima nel DB, poi chiama la edge function che inserisce di nuovo (riga 239-250). Risultato: record duplicati.

2. **PDF parsing rudimentale**: La edge function (righe 180-188) usa una regex `\(([^)]+)\)` su dati binari — non funziona sulla maggior parte dei PDF.

3. **DOCX/MD non gestiti**: Il backend (riga 189-191) li tratta come `[File] nome` senza estrarre contenuto. MD e' testo puro, DOCX richiede parsing XML.

4. **Nessuna validazione SSRF sugli URL**: Un utente puo' inserire `http://169.254.169.254/...` o `http://localhost:...` per accedere a risorse interne.

## Piano di fix

### 1. Frontend — Rimuovere doppio insert (`KnowledgeBase.tsx`)

**`addUrl()`** (righe 120-153): Rimuovere l'insert diretto nel DB. Chiamare solo la edge function con `name`, `type`, `source_url`, `company_id`, `agent_id`. La edge function crea il record.

**`addText()`** (righe 156-190): Stesso pattern — rimuovere insert DB, passare tutto alla edge function.

**`uploadFileToStorage()`** (righe 212-266): L'upload in storage resta nel frontend, ma l'insert DB viene rimosso. La edge function riceve `file_path`, `name`, `type`, `company_id` e crea sia il record DB che processa il file.

### 2. Edge function — Validazione SSRF (`add-knowledge-doc/index.ts`)

Aggiungere funzione `isSafeUrl(url)` che blocca:
- IP privati: `10.x`, `172.16-31.x`, `192.168.x`, `127.x`, `169.254.x`
- Hostname: `localhost`, `metadata.google`, `[::1]`
- Risolvere il hostname e verificare che l'IP risolto non sia privato

Applicare prima della creazione del record e prima del sync a ElevenLabs.

### 3. Edge function — Parsing PDF reale

Sostituire la regex con `pdf-parse` (via esm.sh) o, come approccio piu' robusto per Deno, usare `pdf.js` (`pdfjs-dist`). In alternativa, dato che siamo in Deno e le librerie PDF sono pesanti, estrarre il testo con un approccio basato su operatori PDF TJ/Tj che e' piu' affidabile della regex attuale.

Approccio scelto: parsing degli operatori PDF `TJ`, `Tj`, `'`, `"` dal content stream. Questo copre la maggior parte dei PDF con testo (non scansionati). Per PDF scansionati, fallback al label.

### 4. Edge function — Gestione MD e DOCX

- **MD**: Leggere come testo UTF-8 (gia' supportato per `.txt`, basta aggiungere `ext === "md"`)
- **DOCX**: I file DOCX sono ZIP contenenti `word/document.xml`. Usare `JSZip` via esm.sh per estrarre il XML, poi regex per estrarre il testo dai tag `<w:t>`.
- **JSON**: Leggere come testo UTF-8 (come `.txt`)

### 5. Edge function — Gestione `doc_id` per URL/text (evitare doppio insert)

Aggiungere supporto per ricevere `doc_id` anche per type `url` e `text` (non solo `file`), cosi' il frontend puo' passare un doc_id esistente oppure lasciarlo vuoto per creare un nuovo record. Ma dato che rimuoviamo l'insert dal frontend, la edge function creera' sempre il record — non serve `doc_id` per URL/text.

Per il flow `file`, il frontend continua a passare `doc_id` solo se il record DB esiste gia'. Ma con il fix, il frontend non inserisce piu' il record, quindi la edge function deve gestire il caso "file senza doc_id": creare il record e poi processare.

### File modificati

| File | Modifica |
|------|----------|
| `supabase/functions/add-knowledge-doc/index.ts` | SSRF validation, PDF parsing migliorato, DOCX/MD support, gestione creazione record per tutti i tipi |
| `src/pages/app/KnowledgeBase.tsx` | Rimuovere insert DB da `addUrl()`, `addText()`, `uploadFileToStorage()` — delegare tutto alla edge function |

