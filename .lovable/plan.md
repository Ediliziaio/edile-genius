
Obiettivo: sbloccare subito `/app/render-stanza/new` (schermata vuota in step “Analisi”) e fare una sweep dei bug equivalenti negli altri moduli render.

Diagnosi confermata:
- Edge log mostra `analyze-room-photo` completata in ~5s, quindi non è bloccata lato server.
- In `RenderStanzaNew.tsx` la risposta di Edge Function viene letta come `analyzeData.analisi`, ma la funzione ritorna envelope `{ ok, data: { analisi } }`.
- Risultato: `analisi` diventa `undefined`, `step` passa a 2, ma UI renderizza `step === 2 && analisi` → pagina vuota.
- C’è anche mismatch colonne DB in salvataggio stanza (`result_url`, `interventi_eseguiti`, `config_json`) vs schema reale (`result_image_url`, `interventi`, `config_snapshot`).

Do I know what the issue is?
Sì: mismatch strutturale payload Edge Function (envelope vs flat) + guard UI incompleta + alcuni campi DB errati in Render Stanza.

Piano implementativo (fix completo):
1) Standardizzare il parsing delle risposte Edge (frontend)
- Introdurre helper condiviso (es. `src/lib/edgePayload.ts`) che unwrappa in modo sicuro:
  - formato nuovo: `{ ok, data }`
  - formato annidato legacy/stub: `{ ok, data: { ok, data } }`
  - formato flat legacy.
- Applicarlo in tutti i punti render che usano `supabase.functions.invoke`.

2) Fix bloccante Render Stanza
- File: `src/pages/app/RenderStanzaNew.tsx`
- `handleAnalyzeRoom`:
  - usare payload normalizzato;
  - validare `payload.analisi` prima di `setStep(2)`;
  - se manca analisi, mostrare errore e restare su step 1.
- Step 2 UI:
  - aggiungere fallback esplicito per `step===2 && !analisi` (loader/errore + CTA “Riprova analisi” e “Torna alla foto”), così non esiste più schermata bianca.
- `handleStartRender`:
  - usare payload normalizzato;
  - leggere `result_url`/`result_image_url` in fallback robusto.
- Correggere salvataggi DB stanza:
  - gallery insert con colonne corrette (`result_image_url`, `interventi`, `config_snapshot`, `original_image_url`);
  - session update con `result_image_url` (non `result_url`);
  - gestire e loggare errori `insert/update` invece di ignorarli.

3) Sweep “stesso bug” sugli altri moduli render
- `src/pages/app/RenderFacciataNew.tsx`:
  - parse envelope per `analyze-facade-photo` e `generate-facade-render`.
- `src/pages/app/RenderPersianeNew.tsx`:
  - parse envelope per `analyze-shutter-photo` e `generate-shutter-render`.
- `src/pages/app/RenderNew.tsx`:
  - parse envelope per `analyze-window-photo`.
- `src/pages/app/RenderPavimentoNew.tsx`:
  - usare helper normalizzato anche per caso annidato `data.data` (attuale stub).

4) Coerenza backend minima (per evitare doppio annidamento)
- `supabase/functions/analyze-floor-photo/index.ts`:
  - allineare output a `jsonOk(stubAnalysis, requestId)` (senza `ok/data` interno), mantenendo compatibilità grazie all’unwrapper lato frontend.

5) Verifica finale end-to-end (focus regressione)
- Render Stanza:
  - upload foto → analisi → step 2 visibile (non bianco) → step 3 → genera.
- Verifica DB:
  - `render_stanza_sessions.status` avanza correttamente;
  - `render_stanza_gallery` salva con colonne corrette.
- Smoke test moduli Facciata/Persiane/Infissi/Pavimento per confermare che non ci siano più mismatch payload.
