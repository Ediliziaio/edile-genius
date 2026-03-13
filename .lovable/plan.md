

# Piano: Modulo Render Bagno — Doc 1/5

## Panoramica

Creare il modulo "Render Bagno" come secondo modulo render parallelo a "Render Infissi". Comprende: routing, sidebar, hub page, database (3 tabelle + 2 bucket + seed presets), e 2 edge function (analisi foto + generazione render).

## Differenze chiave rispetto al prompt dell'utente

Il prompt dell'utente contiene alcune incongruenze con l'architettura esistente che verranno corrette:

1. **Edge function `analyze-bathroom-photo`**: Useremo il **Lovable AI Gateway** (`ai.gateway.lovable.dev`) con `LOVABLE_API_KEY` come fa `analyze-window-photo`, non l'API Gemini diretta con `GEMINI_API_KEY` (che non esiste nei secrets).
2. **Edge function `generate-bathroom-render`**: Seguiremo lo stesso pattern di `generate-render` (sessione Supabase, signed URL, provider config, audit log), non il pattern semplificato proposto.
3. **Crediti**: Il sistema usa `render_credits` per `company_id` (non `user_id`), con RPC `deduct_render_credit(_company_id)`. Manterremo questo pattern.
4. **Tabelle**: Aggiungeremo `company_id` alle tabelle sessioni e gallery (il sistema è multi-tenant per azienda, non per utente).
5. **Presets `vanity_colore`**: Le colonne `name`/`value` sono invertite nel seed; verranno corrette.

## Modifiche

### 1. Migrazione Database
- Tabelle: `render_bagno_presets`, `render_bagno_sessions` (con `company_id`), `render_bagno_gallery` (con `company_id`)
- RLS: per user_id + company visibility (superadmin PERMISSIVE)
- Storage: `bagno-originals` (privato), `bagno-results` (pubblico) + policies
- Seed: ~90 presets (piastrelle, doccia, vasca, vanity, rubinetteria, pareti, illuminazione)

### 2. Routing (`App.tsx`)
- Lazy import `RenderBagnoHub` e `RenderBagnoNew`
- Route `/app/render-bagno` e `/app/render-bagno/new`

### 3. Sidebar (`SidebarNav.tsx`)
- Aggiungere "Render Bagno" con icona `Bath` nella sezione "STRUMENTI AI" (stesso `visibilityKey: "render"`)

### 4. Hub Page (`RenderBagnoHub.tsx`)
- Layout simile a `RenderHub.tsx` con 4 step, crediti widget, gallery recente

### 5. Edge Function `analyze-bathroom-photo`
- Pattern identico a `analyze-window-photo`: CORS, auth JWT, Lovable AI Gateway, model `google/gemini-2.5-flash`
- Prompt analisi bagno con JSON strutturato (30+ campi)

### 6. Edge Function `generate-bathroom-render`
- Pattern identico a `generate-render`: auth, sessione, signed URL, crediti, Lovable AI Gateway con `google/gemini-3.1-flash-image-preview`, upload risultato, audit log
- Prompt builder dedicato per bagno (piastrelle, doccia, vasca, mobili, rubinetteria)

### 7. `config.toml`
- Aggiungere entries per le 2 nuove funzioni con `verify_jwt = false`

## Ordine implementazione

1. Migrazione DB (tabelle + storage + seed)
2. Hub page + routing + sidebar
3. Edge function `analyze-bathroom-photo`
4. Edge function `generate-bathroom-render`
5. Deploy + config.toml

