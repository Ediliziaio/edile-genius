
Obiettivo: audit completo dei 7 sistemi Render (Infissi, Bagno, Facciata, Persiane, Pavimento, Stanza, Tetto), con bug list prioritaria e piano di fix/test end-to-end.

Stato test svolti (oggi)
- Test runtime Edge Functions: tentati 14 endpoint render via `curl_edge_functions` → tutti `401 Unauthorized` (sessione utente non autenticata nel preview).
- Browser test: `/app/render` reindirizza alla landing pubblica (non autenticato), quindi flussi app non eseguibili E2E al momento.
- Audit codice + DB eseguito in profondità (frontend, edge functions, schema, dati recenti).

Bug trovati (priorità alta)

1) Render Stanza — mismatch FE/DB + risultati vuoti
- FE inserisce `company_id` in `render_stanza_sessions` e `render_stanza_gallery`, ma nello schema queste colonne non esistono.
- FE non salva `original_image_path`/dimensioni nella sessione.
- FE marca `status=completed` anche con `finalUrl` nullo.
- Evidenza DB: sessioni recenti con `status=completed` ma `result_image_url` nullo; gallery con `original_image_url` e `result_image_url` vuoti.
- File: `src/pages/app/RenderStanzaNew.tsx`.

2) generate-room-render — robustezza e sicurezza insufficienti
- Non verifica ownership sessione/tenant.
- Non controlla crediti render e non scala credito.
- Parsing immagine incompleto (`message.images` non gestito).
- Nessun guard `no_image`: può rispondere OK con URL vuoto.
- Aggiorna sessione solo se base64 (se URL remoto, persistenza incompleta).
- File: `supabase/functions/generate-room-render/index.ts`.

3) analyze-floor-photo / analyze-shutter-photo — update colonne errate
- Tentano update `analisi_json`, ma:
  - `render_pavimento_sessions` usa `analysis_result`.
  - `render_persiane_sessions` non espone colonna analisi equivalente.
- Rischio: analisi non persistita.
- File: `supabase/functions/analyze-floor-photo/index.ts`, `supabase/functions/analyze-shutter-photo/index.ts`.

4) Sicurezza multi-tenant (Edge) non uniforme
- Floor/Shutter/Roof/Room analyze+generate aggiornano sessioni con service role senza verifica forte ownership tenant per `session_id`.
- File: funzioni render di pavimento/persiane/tetto/stanza.

5) Tetto/Stanza crediti non uniformi
- `generate-roof-render` e `generate-room-render` non allineati al pattern crediti (check + deduct su successo).
- File: `supabase/functions/generate-roof-render/index.ts`, `supabase/functions/generate-room-render/index.ts`.

Bug medi

6) Memory leak object URL (tutti i moduli)
- `URL.createObjectURL(...)` senza `URL.revokeObjectURL(...)`.
- File: `RenderNew`, `RenderBagnoNew`, `RenderFacciataNew`, `RenderPersianeNew`, `RenderPavimentoNew`, `RenderStanzaNew`, `useRenderTetto`.

7) Facciata — gallery incompleta
- `render_facciata_gallery` ha `original_url`, ma FE salva solo `render_url`.
- File: `src/pages/app/RenderFacciataNew.tsx`.

8) Bagno — originale in gallery con signed URL a scadenza
- Salvataggio `originale_url` con signed URL (1 anno), non permanente.
- File: `src/pages/app/RenderBagnoNew.tsx`.

9) Infissi — storico blob URL già presente in produzione
- Evidenza DB: record in `render_gallery.original_url` con `blob:...` (2 record).
- FE ora usa fallback `uploadedPhotoUrl || preview`; va rimosso fallback a blob.
- File: `src/pages/app/RenderNew.tsx`.

Design di implementazione (ordine consigliato)

Fase 1 — Blocchi critici backend (prima)
- Hardening `generate-room-render`: ownership tenant, check/deduct crediti, parsing immagini completo, guard `no_image`, persistenza coerente.
- Hardening `generate-roof-render`: check/deduct crediti + ownership.
- Correzione update analisi pavimento/persiane su colonne reali.
- Allineamento status analisi stanza (`analyzed` post-analisi).
- Aggiunta fallback parser immagine in funzioni fragili (facciata/infissi/room).

Fase 2 — Correzioni frontend dati
- Render Stanza:
  - rimuovere `company_id` da insert (oppure migrazione schema se davvero richiesto),
  - salvare `original_image_path`/dimensioni in sessione,
  - bloccare completamento se `finalUrl` mancante,
  - salvare gallery solo con URL validi.
- Facciata: salvare anche `original_url`.
- Bagno: strategia URL originale non expiring per gallery.
- Infissi: eliminare fallback blob in salvataggio gallery.

Fase 3 — Stabilità UX/memoria
- Cleanup `URL.revokeObjectURL` in tutti i moduli render.
- Gestione errori client specifica per `402/429` (toast mirati).
- Uniformare envelope parsing `{ok,data}` + fallback legacy.

Fase 4 — Test end-to-end (dopo login preview)
- Matrice E2E per 7 moduli:
  1) upload,
  2) analisi,
  3) generazione,
  4) persistenza sessione,
  5) salvataggio gallery,
  6) consumo crediti,
  7) regressione security (tenant isolation).
- Verifica DB post-test:
  - nessun `completed` senza `result_url`,
  - nessun URL `blob:` in gallery,
  - coerenza `company_id` dove previsto da schema,
  - decremento crediti solo su successo.

File principali da intervenire
- Frontend:
  - `src/pages/app/RenderStanzaNew.tsx`
  - `src/pages/app/RenderNew.tsx`
  - `src/pages/app/RenderFacciataNew.tsx`
  - `src/pages/app/RenderBagnoNew.tsx`
  - `src/pages/app/RenderPavimentoNew.tsx`
  - `src/pages/app/RenderPersianeNew.tsx`
  - `src/hooks/useRenderTetto.ts`
- Edge Functions:
  - `supabase/functions/generate-room-render/index.ts`
  - `supabase/functions/generate-roof-render/index.ts`
  - `supabase/functions/analyze-floor-photo/index.ts`
  - `supabase/functions/analyze-shutter-photo/index.ts`
  - `supabase/functions/analyze-room-photo/index.ts`
  - (opzionale hardening parser) `generate-facade-render`, `generate-render`

Nota operativa per completare i test runtime
- Per eseguire test E2E reali dei flussi `/app/render-*` e chiamate edge autenticate, serve sessione utente attiva nel preview (attualmente risulta non autenticata).
