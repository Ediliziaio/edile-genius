
Obiettivo: risolvere definitivamente “Upload foto fallito” in `/app/render-bagno/new`.

Diagnosi (da log + rete):
- L’upload va su `bagno-originals/{companyId}/{sessionId}/originale.jpg`.
- La policy SELECT attuale di `bagno-originals` richiede invece `auth.uid() = folder[1]` (quindi si aspetta `userId` nel path, non `companyId`).
- Con `upsert: true`, lo storage può richiedere controlli aggiuntivi (SELECT/UPDATE) e la mismatch del path fa fallire con `new row violates row-level security policy`.
- Inoltre l’utente corrente è `superadmin` con `profiles.company_id = null`, quindi policy basate solo su `my_company()` non bastano senza eccezione superadmin.

Piano di fix:

1) Correggere le policy RLS di `storage.objects` per bucket `bagno-originals`
- Sostituire le policy correnti di quel bucket (`Upload foto bagno originali`, `Accesso privato bagno originali`, `Update bagno originals`, `Delete bagno originals`) con policy coerenti al path company-based.
- Regole nuove:
  - Company user: consenti solo se `folder[1] = my_company()`.
  - Superadmin: bypass con `has_role(auth.uid(), 'superadmin')` (eventualmente anche `superadmin_user` se usato nel progetto).
- Coprire tutti i comandi: INSERT, SELECT, UPDATE, DELETE con la stessa logica.

Schema logico policy:
- INSERT WITH CHECK:
  `bucket_id='bagno-originals' AND (folder[1]=my_company() OR has_role(...superadmin...))`
- SELECT/UPDATE/DELETE USING:
  stessa condizione sopra.
- UPDATE WITH CHECK:
  stessa condizione sopra.

2) Piccolo hardening frontend su upload
- In `RenderBagnoNew.tsx`, cambiare upload a `upsert: false` (path già univoco per sessione).
- Riduce dipendenze dal ramo UPDATE in upload e rende il comportamento più prevedibile.

3) Verifica end-to-end mirata
- Testare con utente company e con superadmin in impersonazione.
- Verifiche attese:
  - POST storage su `bagno-originals/...` -> 200/201
  - `createSignedUrl` subito dopo -> successo
  - invocazione `analyze-bathroom-photo` -> successo
  - passaggio allo step successivo senza toast errore.

Nota tecnica importante:
- Il fix precedente (aggiunta sola UPDATE/DELETE) era necessario ma non sufficiente: il collo di bottiglia resta la policy SELECT legacy basata su `auth.uid()` incompatibile col path `companyId/...`.
