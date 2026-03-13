

# Analisi Bug Render Modules — Piano di Fix

## Moduli analizzati
7 moduli render: **Infissi**, **Bagno**, **Facciata**, **Persiane**, **Pavimento**, **Stanza**, **Tetto**

---

## BUG CRITICI (bloccano il funzionamento)

### 1. `generate-floor-render` e `generate-shutter-render` sono STUB — restituiscono sempre 501
Le Edge Function per **Pavimento** e **Persiane** non sono implementate. Restituiscono sempre un errore 501 "non implementata". Questo significa che i moduli Render Pavimento e Render Persiane **non possono generare alcun render**.

**Fix**: Implementare entrambe le Edge Function seguendo lo stesso pattern di `generate-roof-render` (auth, AI Gateway call con Gemini image model, upload risultato, deduct credits).

### 2. `analyze-floor-photo` e `analyze-shutter-photo` restituiscono dati STUB
Queste Edge Function non chiamano l'AI — restituiscono dati fittizi hardcoded. L'utente vede un'analisi falsa che non corrisponde alla foto caricata.

**Fix**: Implementare le chiamate AI con Gemini Vision (come `analyze-roof-photo`) per analisi reale.

### 3. Render Stanza — manca `company_id` nella sessione e nella gallery
`RenderStanzaNew.tsx` (riga 511) crea la sessione con solo `user_id` e `tipo_stanza`, **senza `company_id`**. Allo stesso modo la gallery insert (riga 660) non include `company_id`. Questo rompe l'isolamento multi-tenant e le query RLS.

**Fix**: Importare `useCompanyId` e includere `company_id` nelle insert di sessione e gallery.

### 4. Render Bagno — risposta AI estratta dal campo sbagliato
`generate-bathroom-render` (riga 123) cerca `data.choices[0].message.images[0].image_url.url` ma il modello Gemini ritorna l'immagine in `choices[0].message.content` (come array con `image_url` o `inlineData`). Questo causa **sempre** l'errore "No image returned from AI".

**Fix**: Aggiornare il parsing della risposta per estrarre l'immagine da `choices[0].message.content` (come fanno `generate-roof-render` e `generate-room-render`).

### 5. Render Tetto — `unwrapEdge` non gestisce `{ data, error }` di `invoke()`
In `useRenderTetto.ts` riga 210, `unwrapEdge` riceve il risultato diretto di `supabase.functions.invoke()` che è `{ data, error }`. Ma la funzione non controlla `error` prima di unwrappare. Se la funzione edge fallisce, l'errore viene silentemente ignorato.

**Fix**: Controllare `result.error` prima di chiamare `unwrapEdge(result)`, oppure passare `result.data` a `unwrapEdge`.

---

## BUG MEDI (UX degradata)

### 6. Memory leak: `URL.createObjectURL` senza `revokeObjectURL`
Tutti e 7 i moduli render creano object URL per le anteprime foto ma **nessuno** chiama `URL.revokeObjectURL()` al cleanup. Ogni upload accumula blob URL in memoria.

**Fix**: Aggiungere `useEffect` cleanup o revoke al cambio file in tutti i moduli.

### 7. Render Persiane — doppio object URL creato per rilevamento dimensioni
`RenderPersianeNew.tsx` riga 143 crea un **secondo** `URL.createObjectURL(file)` per leggere le dimensioni, che non viene mai rilasciato. Stesso problema in `RenderFacciataNew.tsx` riga 157.

**Fix**: Riutilizzare il primo `previewUrl` già creato per il rilevamento dimensioni.

### 8. Render Stanza — `originalUrl` mai impostato correttamente
Riga 553: `setOriginalUrl((payload as any).originalUrl || null)` — la Edge Function `analyze-room-photo` **non restituisce** un campo `originalUrl`. Quindi `originalUrl` è sempre `null`, e nella gallery insert viene salvato come stringa vuota.

**Fix**: Dopo l'upload su storage, generare il public URL e salvarlo come `originalUrl`.

### 9. Render Persiane — `data.result_url` invece di `renderPayload`
Riga 329: `result_image_url: data.result_url` usa `data` (il raw response) invece di `renderPayload` (l'unwrapped). Se il formato envelope cambia, questo si rompe.

**Fix**: Usare `resultUrl` (già estratto alla riga 323) per l'update della sessione.

### 10. Render Infissi — salva `preview` (blob URL) come `original_url` nella gallery
Riga 426: `original_url: preview` — `preview` è un `blob:` URL locale che non funziona dopo il refresh della pagina o su un altro dispositivo.

**Fix**: Usare `uploadedPhotoUrl` (il public URL dallo storage) invece di `preview`.

---

## BUG MINORI

### 11. Render Pavimento — `result_image_url` non restituito dalla Edge Function stub
Riga 164: cerca `payload.result_image_url` ma la edge function stub non la restituisce mai (nemmeno quando sarà implementata — `generate-roof-render` restituisce `result_url`).

### 12. Render Facciata — doppio URL.createObjectURL nel detect dimensioni
Riga 157 crea un secondo blob URL mai rilasciato.

### 13. Nessun modulo gestisce errori 429/402 dal AI Gateway lato client
Solo le Edge Function gestiscono rate limit/credits, ma i toast lato client mostrano messaggi generici.

---

## Piano di implementazione

### Fase 1 — Fix critici (Edge Functions)
- **Implementare** `generate-floor-render` con logica AI reale (copiando pattern da `generate-roof-render`)
- **Implementare** `generate-shutter-render` con logica AI reale
- **Implementare** `analyze-floor-photo` con Gemini Vision reale
- **Implementare** `analyze-shutter-photo` con Gemini Vision reale
- **Fixare** parsing risposta in `generate-bathroom-render` (riga 123)

### Fase 2 — Fix critici (Frontend)
- **Aggiungere** `company_id` a `RenderStanzaNew.tsx` (sessione e gallery)
- **Fixare** `useRenderTetto.ts` error handling nel `unwrapEdge`
- **Fixare** `RenderNew.tsx` gallery save: usare `uploadedPhotoUrl` al posto di `preview`
- **Fixare** `RenderPersianeNew.tsx` session update: usare `resultUrl` al posto di `data.result_url`

### Fase 3 — Fix medi
- **Aggiungere** `URL.revokeObjectURL` cleanup in tutti i 7 moduli
- **Fixare** `RenderStanzaNew.tsx` `originalUrl` per salvare il vero URL dallo storage
- **Eliminare** i doppi `createObjectURL` in Persiane e Facciata
- **Aggiungere** gestione errori 429/402 nei toast client

### File interessati
- **Edit**: `supabase/functions/generate-floor-render/index.ts`
- **Edit**: `supabase/functions/generate-shutter-render/index.ts`
- **Edit**: `supabase/functions/analyze-floor-photo/index.ts`
- **Edit**: `supabase/functions/analyze-shutter-photo/index.ts`
- **Edit**: `supabase/functions/generate-bathroom-render/index.ts`
- **Edit**: `src/pages/app/RenderStanzaNew.tsx`
- **Edit**: `src/hooks/useRenderTetto.ts`
- **Edit**: `src/pages/app/RenderNew.tsx`
- **Edit**: `src/pages/app/RenderPersianeNew.tsx`
- **Edit**: `src/pages/app/RenderFacciataNew.tsx`
- **Edit**: `src/pages/app/RenderPavimentoNew.tsx`
- **Edit**: `src/pages/app/RenderBagnoNew.tsx`
- **Edit**: `src/pages/app/RenderTettoNew.tsx`

