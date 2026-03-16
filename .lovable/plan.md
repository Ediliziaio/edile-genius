

# Doc 1/7: Architettura DB, Tipi & Costanti — Piano di Implementazione

## Analisi dello Stato Attuale

Il progetto ha gia le fondamenta del sistema preventivo:

- **DB**: Le tabelle `preventivi`, `preventivo_kb_documenti`, `preventivo_kb_chunks`, `preventivo_templates` esistono gia in Supabase con `company_id` (non `azienda_id` come nel doc).
- **Tipi TS**: `src/modules/preventivo/types.ts` ha gia tipi per `PreventivoSezione`, `PreventivoVoce`, `KBDocumento`, `AnalisiSuperfici`, `Preventivo`, `PreventivoTemplate`.
- **Costanti**: `src/modules/preventivo/lib/defaultTemplate.ts` ha gia `SEZIONI_DEFAULT` e `TIPO_SEZIONE_META`.
- **Storage**: Bucket `preventivi-media` esiste gia; il doc chiede `preventivo-kb` e `preventivi-pdf`.

## Cosa Manca (da implementare)

### 1. Migrazione SQL: funzione `search_kb_chunks`
La funzione PL/pgSQL per similarity search via pgvector non esiste ancora. Serve per la ricerca semantica nei chunks KB.

### 2. Migrazione SQL: trigger `genera_numero_preventivo`
Il trigger per numerazione automatica `YYYY-NNNN` potrebbe non esistere (la colonna `numero_preventivo` esiste ma il trigger auto va verificato/aggiunto).

### 3. Migrazione SQL: trigger `update_updated_at`
Trigger generico per aggiornare `updated_at` su tutte le tabelle preventivo.

### 4. Storage bucket `preventivo-kb`
Bucket dedicato per documenti KB (PDF/DOCX) separato da `preventivi-media`.

### 5. Allineare tipi TS al doc
Aggiornare `src/modules/preventivo/types.ts` aggiungendo i tipi mancanti dal doc:
- `StatoPreventivo`, `StatoKBDocumento`, `CategoriaKB`, `ConfidenzaAnalisi` come type alias
- `ConfigCopertina`, `ConfigTestoLibero`, `ConfigRenderGallery`, `ConfigSchedeProdotti`, `ConfigTabellaPrezzi`, `ConfigFirmaCliente` (alcune gia presenti con nomi diversi)
- Tipo `garanzie` e `firma_cliente` e `superfici_computo` in `TipoSezione`

### 6. Allineare costanti al doc
Aggiornare `src/modules/preventivo/lib/defaultTemplate.ts`:
- Aggiungere `CATEGORIA_KB_META`, `STATO_PREVENTIVO_CONFIG`
- Aggiungere costanti: `IVA_OPTIONS`, `VALIDITA_PRESETS`, `KB_CHUNK_SIZE`, `KB_CHUNK_OVERLAP`, `KB_EMBEDDING_PAUSE_MS`
- Aggiungere sezioni mancanti a `SEZIONI_DEFAULT`: `garanzie`, `firma_cliente`, `superfici_computo`

## Approccio: Adattare il Doc al Progetto Esistente

Il doc usa `azienda_id` ovunque ma il DB reale usa `company_id`. **Non creeremo nuove tabelle** — adatteremo tipi e costanti per riflettere lo schema DB esistente, aggiungendo solo cio che manca.

## File da Modificare

| File | Azione |
|------|--------|
| `src/modules/preventivo/types.ts` | Aggiungere type alias mancanti, nuovi tipi sezione (`garanzie`, `firma_cliente`, `superfici_computo`), config interfaces mancanti |
| `src/modules/preventivo/lib/defaultTemplate.ts` | Aggiungere `CATEGORIA_KB_META`, `STATO_PREVENTIVO_CONFIG`, costanti KB, sezioni mancanti in `SEZIONI_DEFAULT` |
| Migrazione SQL (via Supabase) | `search_kb_chunks` function, `genera_numero_preventivo` trigger, `update_updated_at` trigger, bucket `preventivo-kb` |

## Note

- **Non** creiamo `src/types/preventivo.ts` e `src/constants/preventivo.ts` separati: i file esistono gia in `src/modules/preventivo/` e sono importati ovunque. Duplicarli creerebbe conflitti.
- Le migrazioni SQL vanno eseguite tramite il tool Supabase.
- I tipi in `src/integrations/supabase/types.ts` si aggiornano automaticamente dopo le migrazioni.

