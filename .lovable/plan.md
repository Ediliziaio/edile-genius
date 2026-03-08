

# Fix: render-originals bucket non accessibile dall'AI Gateway

## Problema
Il bucket `render-originals` è **privato**. Quando la Edge Function `generate-render` passa l'URL pubblico dell'immagine al gateway AI (Gemini), questo riceve un 400 perché non può scaricare il file (accesso negato).

## Soluzione
Nella Edge Function `generate-render`, invece di passare l'URL pubblico, generare un **signed URL** temporaneo (valido 1 ora) che il gateway AI può utilizzare per scaricare l'immagine.

## File da modificare

**`supabase/functions/generate-render/index.ts`**
- Dopo aver caricato la session, generare un signed URL per `session.original_photo_url` usando `supabase.storage.from("render-originals").createSignedUrl(path, 3600)`
- Estrarre il path relativo dall'URL completo della foto
- Usare il signed URL al posto di `session.original_photo_url` nel payload inviato al gateway AI
- Applicare questa modifica in entrambi i branch del provider (openai e gemini)

