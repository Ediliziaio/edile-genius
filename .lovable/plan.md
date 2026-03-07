

# Piano: Modulo Render AI — Visualizzatore Infissi & Serramenti

Questo e un modulo completamente nuovo e molto ampio (50+ pagine di spec). Lo implemento in fasi incrementali. Data la complessita, questa prima implementazione copre il **nucleo funzionale completo**: database, routing, pagine UI, edge functions core, e configurazione SuperAdmin.

---

## Fase 1 — Database (Migration SQL)

5 nuove tabelle + RLS + seed + trigger:

| Tabella | Scopo |
|---|---|
| `render_provider_config` | Configurazione provider AI (SuperAdmin) |
| `render_infissi_presets` | Catalogo preset infissi (globali + per azienda) |
| `render_sessions` | Ogni richiesta render = 1 sessione |
| `render_gallery` | Render salvati/definitivi con sharing |
| `render_credits` | Crediti render per azienda (separati da voce) |

Include:
- RLS policies (PERMISSIVE) per SuperAdmin e company
- Trigger `set_updated_at` su `render_sessions`
- Trigger `init_render_credits` su insert `companies` (5 render gratis)
- Seed: 20+ preset globali (materiali, colori, stili, vetri, persiane) con `prompt_fragment`
- Seed: provider config per `openai_gpt_image` (default) e `gemini_flash`
- Storage buckets: `render-originals`, `render-results`

## Fase 2 — Routing & Sidebar

Nuove routes company:
- `/app/render` — Hub Render AI
- `/app/render/new` — Wizard nuovo render (4 step)
- `/app/render/gallery` — Galleria render salvati
- `/app/render/gallery/:id` — Dettaglio render

Nuova route SuperAdmin:
- `/superadmin/render-config` — Configurazione provider AI

Sidebar: nuova sezione **"STRUMENTI VENDITA"** con "Render AI" (badge NUOVO)

## Fase 3 — Pagine UI

### Hub Render (`/app/render`)
- Hero con descrizione modulo
- Slider prima/dopo di esempio
- Come funziona (4 step)
- Ultimi render (da `render_gallery`)
- Widget crediti render

### Wizard Nuovo Render (`/app/render/new`)
Mobile-first (max-w-[480px]), 4 step con progress dots:

1. **Carica Foto** — Upload/camera, validazione (tipo, dimensione, min 600px), preprocessing, analisi AI automatica (opzionale)
2. **Configura Infisso** — Selezione materiale, colore, stile telaio, vetro, persiana da preset DB. Dettagli opzionali (ante, dimensioni, note). Link contatto/progetto
3. **Elaborazione** — Schermata immersiva con progress animato, messaggi status rotanti, polling status sessione
4. **Risultati** — BeforeAfterSlider, confronto varianti, salva in galleria, condividi WhatsApp, genera PDF

### Galleria (`/app/render/gallery`)
- Grid con filtri (search, contatto, periodo)
- Card con thumbnail prima/dopo, config summary
- Azioni: scarica, condividi, WhatsApp, elimina

### SuperAdmin Config (`/superadmin/render-config`)
- Card per ogni provider (OpenAI GPT-Image, Gemini, Fal.ai, DALL-E 3, Kimi)
- Toggle attivo/default, API key status, modello, qualita, timeout
- Costi: reale, markup, addebitato
- Stats render generati

## Fase 4 — Edge Functions

### `generate-render` (CORE)
- Auth + verifica crediti render
- Carica sessione + config provider default
- Scarica immagine originale da Storage
- Genera render per provider (GPT-Image-1, Gemini Flash, Fal.ai, DALL-E 3)
- Salva risultati su Storage + aggiorna sessione
- Scala crediti, calcola costi, audit log

### `analyze-window-photo`
- Usa GPT-4o Vision o Gemini per analizzare la foto
- Restituisce: tipo finestra, materiale attuale, dimensioni stimate, stile edificio, condizioni luce

## Fase 5 — Librerie Client

### `src/modules/render/lib/promptBuilder.ts`
- `buildRenderPrompt(config, provider)` — costruisce system/user/negative prompt per provider
- `validatePhoto(file)` — validazione tipo, dimensione
- `preprocessImage(file, provider)` — ridimensionamento ottimale per provider

### `src/components/render/BeforeAfterSlider.tsx`
- Slider interattivo prima/dopo con drag handle

---

## File da creare

| File | Descrizione |
|---|---|
| Migration SQL | 5 tabelle + RLS + seed + trigger |
| `src/pages/app/RenderHub.tsx` | Hub principale |
| `src/pages/app/RenderNew.tsx` | Wizard 4 step |
| `src/pages/app/RenderGallery.tsx` | Galleria render |
| `src/pages/app/RenderGalleryDetail.tsx` | Dettaglio render |
| `src/pages/superadmin/RenderConfig.tsx` | Config provider SuperAdmin |
| `src/components/render/BeforeAfterSlider.tsx` | Slider prima/dopo |
| `src/modules/render/lib/promptBuilder.ts` | Costruttore prompt AI |
| `supabase/functions/generate-render/index.ts` | Edge function render |
| `supabase/functions/analyze-window-photo/index.ts` | Edge function analisi foto |

## File da modificare

| File | Modifica |
|---|---|
| `src/App.tsx` | Aggiungere 5 nuove routes |
| `src/components/layout/Sidebar.tsx` | Sezione "STRUMENTI VENDITA" + "Render AI" |
| `supabase/config.toml` | 2 nuove edge functions |

---

## Note implementative
- Le API keys dei provider render (OpenAI, Gemini, Fal.ai) vanno aggiunte come Supabase secrets quando l'utente le fornisce
- I bucket Storage `render-originals` e `render-results` verranno creati via migration o manualmente
- Il modulo e completamente separato dal sistema voce/agenti esistente
- Crediti render separati dai crediti voce

