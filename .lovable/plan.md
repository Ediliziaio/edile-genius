

# Audit Completo — Render + Agenti AI — Bug Report e Piano Fix

## Sistemi analizzati
- **7 moduli Render**: Infissi, Bagno, Facciata, Persiane, Pavimento, Stanza, Tetto
- **Sistema Agenti AI**: Creazione, aggiornamento, chiamate outbound, webhook post-call

---

## BUG CRITICI

### 1. `generate-render` (Infissi) — parsing immagine fragile
**Riga 529**: `data.choices[0].message.images[0].image_url.url` — cerca SOLO nel campo `images`. Se il modello Gemini restituisce l'immagine in `content` (come array o stringa data:image), il render fallisce con "No image returned from AI". Tutti gli altri moduli (Bagno, Facciata, Stanza, Tetto, Pavimento, Persiane) hanno già il parsing multi-formato. Questo è l'unico modulo rimasto con il parsing vecchio.

**Fix**: Aggiornare `generate-render/index.ts` (righe 528-530) con lo stesso pattern multi-formato usato dagli altri moduli.

### 2. Stanza — `stanza-originals` è bucket PRIVATO, `getPublicUrl` restituisce URL inaccessibile
**Riga 568**: `supabase.storage.from('stanza-originals').getPublicUrl(origPath)` — il bucket `stanza-originals` è **privato** (vedi storage-buckets). Il `publicUrl` restituito non funziona, quindi `originalUrl` è sempre un URL che dà 403. La gallery salva questo URL rotto come `original_image_url`.

**Fix**: Usare `createSignedUrl` con durata lunga, oppure salvare il path con prefisso `storage:/stanza-originals/` come fa il modulo Bagno.

### 3. Stanza — `original_image_path`, `original_image_width`, `original_image_height` probabilmente non esistono nello schema
**Righe 533-539**: Il FE scrive campi come `original_image_path`, `original_image_width`, `original_image_height` nella tabella `render_stanza_sessions`, ma queste colonne probabilmente non esistono nello schema DB (non sono nella dichiarazione originale). L'update silenziosamente fallisce o viene ignorato.

**Fix**: Verificare schema e aggiungere colonne via migrazione, oppure rimuovere gli update a campi inesistenti.

### 4. update-agent — nessuna verifica tenant
**Riga 30**: `update-agent` legge l'agente con `serviceClient` senza verificare che l'utente appartenga alla stessa `company_id` dell'agente. Qualsiasi utente autenticato può aggiornare qualsiasi agente conoscendo l'ID.

**Fix**: Aggiungere verifica `profile.company_id === currentAgent.company_id` (o bypass per superadmin).

### 5. create-elevenlabs-agent — nessuna verifica che l'utente appartenga a `company_id`
**Riga 32**: Accetta un `company_id` dal body senza verificare che il chiamante appartenga effettivamente a quella company. Un utente potrebbe creare agenti in company altrui.

**Fix**: Verificare `profile.company_id === body.company_id`.

---

## BUG MEDI

### 6. Bagno — `originale_url` salva path fittizio `storage:/bagno-originals/...`
**Riga 445**: Salva `storage:/bagno-originals/${originalPath}` come URL originale nella gallery. Questo formato custom non è interpretato da nessun componente frontend per mostrare l'immagine. Il Before/After slider non può mostrare l'originale.

**Fix**: Generare un signed URL di lunga durata (1 anno) o usare un endpoint dedicato per risolvere i path `storage:/`.

### 7. Facciata — gallery non salva `original_url`
Ho verificato che nella precedente iterazione era stata segnalata la mancanza del salvataggio di `original_url` nella gallery facciata. Bisogna verificare se il fix è stato applicato.

### 8. Persiane/Pavimento — nessun cleanup `revokeObjectURL` nel reset
I moduli Persiane e Pavimento non hanno cleanup dell'object URL quando l'utente resetta e carica una nuova foto. Memory leak su uso ripetuto.

### 9. Varianti Generator — hardcoded su `generate-room-render`
**`useVariantiGenerator.ts` riga 48**: Chiama sempre `generate-room-render` indipendentemente dal `sourceModulo`. Le varianti per Tetto, Facciata, Bagno, ecc. non funzionano perché usano la edge function sbagliata.

**Fix**: Mappare `sourceModulo` all'edge function corretta.

---

## BUG MINORI

### 10. Tutti i moduli render — nessun toast specifico per errori 402/429
I toast mostrano errori generici. L'utente non capisce se ha finito i crediti o se è rate-limited.

### 11. Agent — ElevenLabs sync in update-agent non è bloccante ma fallisce silenziosamente
Se la PATCH a ElevenLabs fallisce, l'agente è aggiornato nel DB locale ma non su ElevenLabs. Non c'è feedback all'utente.

### 12. Agent — `dynamic_variables` non validate
Le variabili dinamiche vengono passate direttamente a ElevenLabs senza sanitizzazione.

---

## Piano di implementazione

### Fase 1 — Fix critici backend
- **Edit** `supabase/functions/generate-render/index.ts`: Aggiornare parsing immagine (righe 528-530) con pattern multi-formato
- **Edit** `supabase/functions/update-agent/index.ts`: Aggiungere verifica tenant (company_id match)
- **Edit** `supabase/functions/create-elevenlabs-agent/index.ts`: Aggiungere verifica che l'utente appartenga a `company_id`

### Fase 2 — Fix critici frontend
- **Edit** `src/pages/app/RenderStanzaNew.tsx`: Sostituire `getPublicUrl` (bucket privato) con signed URL o path reference
- **Edit** `src/pages/app/RenderStanzaNew.tsx`: Rimuovere update a colonne inesistenti (`original_image_path`, etc.) o creare migrazione
- **Edit** `src/hooks/useVariantiGenerator.ts`: Mappare `sourceModulo` alla edge function corretta

### Fase 3 — Fix medi
- **Edit** `src/pages/app/RenderBagnoNew.tsx`: Risolvere il formato `storage:/` per l'originale (o usare signed URL)
- **Edit** tutti i moduli render: Aggiungere toast specifici per 402 (crediti) e 429 (rate limit)
- **Edit** `src/pages/app/RenderPersianeNew.tsx`, `RenderPavimentoNew.tsx`: Aggiungere `revokeObjectURL` al reset

### File da modificare
- `supabase/functions/generate-render/index.ts`
- `supabase/functions/update-agent/index.ts`
- `supabase/functions/create-elevenlabs-agent/index.ts`
- `src/pages/app/RenderStanzaNew.tsx`
- `src/pages/app/RenderBagnoNew.tsx`
- `src/hooks/useVariantiGenerator.ts`
- `src/pages/app/RenderPersianeNew.tsx`
- `src/pages/app/RenderPavimentoNew.tsx`

