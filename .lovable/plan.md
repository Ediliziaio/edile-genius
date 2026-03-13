
Diagnosi (perché succede)
- Il backend `generate-bathroom-render` sta rispondendo correttamente con `200` e payload standardizzato:  
  `{"ok": true, "data": { "success": true, "result_url": "..." }}`
- Nel frontend (`RenderBagnoNew.tsx`) la verifica è ancora `result?.result_url` (shape vecchio), quindi `undefined`.
- Risultato: la UI entra nel ramo errore e mostra “Render non riuscito” anche quando il render è stato generato.
- C’è lo stesso mismatch anche su `analyze-bathroom-photo`: l’analisi viene letta dal livello sbagliato e salvata wrappata, riducendo qualità/coerenza del prompt.

Piano di fix
1) Normalizzare la lettura delle risposte Edge Function in `RenderBagnoNew.tsx`
- Aggiungere parser compatibile con entrambi i formati:
  - nuovo: `{ ok, data, request_id }`
  - legacy: `{ ...payload }`
- Uso pratico:
  - `const payload = result?.data ?? result`
  - successo solo se `payload?.result_url` esiste.

2) Correggere `startRender()`
- Sostituire il check attuale:
  - da `!result?.result_url`
  - a `!payload?.result_url`
- Salvare `setRenderUrl(payload.result_url)`.

3) Correggere `handleFotoSelect()` per analisi
- Leggere analisi con fallback:
  - `analysisData?.data?.analysis ?? analysisData?.analysis ?? analysisData`
- Salvare in stato/sessione solo l’oggetto analisi “flat”, non l’envelope completo.

4) Migliorare messaggio errore reale
- Se `invoke` ritorna errore non-2xx, mostrare messaggio server (`error.message` + eventuale body JSON) invece di fallback generico.
- Obiettivo: distinguere davvero `403 Access denied` da errori UI di parsing.

Verifica end-to-end (obbligatoria)
- Rifare il flusso completo su `/app/render-bagno/new`:
  1. upload foto
  2. analisi completata
  3. genera render
  4. risposta network 200
  5. passaggio a step “Risultato” con immagine visibile (non schermata errore)
- Verificare anche che `render_bagno_sessions.analisi_bagno` sia salvato senza wrapper `ok/data`.

Dettagli tecnici
- File coinvolto: `src/pages/app/RenderBagnoNew.tsx` (solo frontend).
- Nessuna modifica DB/migrazione necessaria per questo bug specifico.
- Il `403` che hai visto è un errore backend autentico quando presente; il problema che stai vedendo ora nello screenshot è invece un falso negativo di parsing lato UI.
