

## Piano: Sistema Reportistica Cantieri via Telegram

L'utente conferma che aggiungerà le API key (OPENAI_API_KEY, RESEND_API_KEY) in seguito tramite l'interfaccia SuperAdmin. Procediamo con l'implementazione completa, leggendo le chiavi da `Deno.env.get()` nelle Edge Functions (come già fatto per ELEVENLABS_API_KEY).

Per la gestione delle API key da SuperAdmin, aggiungeremo una tab "Integrazioni" nelle PlatformSettings dove il SuperAdmin può salvare OPENAI_API_KEY e RESEND_API_KEY come Supabase secrets tramite la Edge Function `platform-config` (stesso pattern di `manage-n8n-config`).

### 1. Database Migration

Crea 4 nuove tabelle + estendi `agent_reports` + storage bucket:
- **`cantieri`** — siti costruzione (nome, indirizzo, committente, stato, email_report[], telegram_chat_ids[])
- **`cantiere_operai`** — operai (nome, ruolo, telefono, telegram_user_id/username, cantiere_id)
- **`telegram_sessions`** — stato conversazione Telegram per chat (pending_report_data, pending_foto_urls)
- **`telegram_config`** — config bot per company (bot_token, webhook_secret, attivo)
- **Estensione `agent_reports`** — +15 colonne (cantiere_id, operaio_id, trascrizione, audio_url, foto_urls[], lavori_eseguiti[], materiali_usati[], problemi[], avanzamento_percentuale, etc.)
- **Storage bucket** `cantiere-media` (privato)

RLS: company-scoped per cantieri/operai/config, superadmin per tutto.

### 2. Edge Functions (4 funzioni)

1. **`telegram-cantiere-webhook`** — Riceve messaggi Telegram, gestisce comandi (/start, /conferma, /annulla), scarica audio, trascrive con Whisper (OPENAI_API_KEY), struttura con GPT-4o-mini, salva foto in Storage, salva report. Legge bot_token dal DB `telegram_config`.

2. **`send-cantiere-report-email`** — Invia report HTML via Resend (RESEND_API_KEY).

3. **`setup-telegram-webhook`** — Registra webhook URL su Telegram API per il bot.

4. **Riscrittura `generate-report`** — Usa GPT-4o-mini invece del parsing regex attuale.

Config toml: tutte con `verify_jwt = false`.

### 3. SuperAdmin: Tab "Integrazioni" in PlatformSettings

Aggiungere una 7a tab "Integrazioni" con campi per salvare OPENAI_API_KEY e RESEND_API_KEY come Supabase secrets. Estendere la Edge Function `platform-config` con action `save_secret` (usa il Supabase Management API o semplicemente salva in `platform_config` come indicatore, dato che i secrets veri vanno impostati manualmente).

In pratica: mostrare campi con istruzioni chiare su dove andare per impostare i secrets in Supabase Dashboard, con link diretto.

### 4. Frontend (4 pagine + 1 componente + routing + sidebar)

1. **`Cantieri.tsx`** (`/app/cantieri`) — Lista cantieri con badge stato, KPI, dialog creazione
2. **`CantiereDetail.tsx`** (`/app/cantieri/:id`) — 3 tab: Report (timeline), Operai (lista + form), Statistiche (recharts)
3. **`CantiereConfig.tsx`** (`/app/cantieri/configurazione`) — Setup bot Telegram (istruzioni BotFather, campo token, pulsante attiva)
4. **`ReportDetailModal.tsx`** — Dialog con trascrizione, dati strutturati, galleria foto, player audio
5. **Sidebar** — Sezione "CANTIERI" con voci: I Cantieri, Configura Bot
6. **App.tsx** — 3 nuove route

### Ordine di implementazione

1. Migration DB
2. Edge Functions
3. Frontend (pagine + componenti + routing + sidebar)
4. Tab Integrazioni in SuperAdmin PlatformSettings

