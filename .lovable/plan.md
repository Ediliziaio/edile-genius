

## Bot Reportistica Cantieri — Piano di Implementazione

Questa funzionalità NON esiste nel codebase attuale. Le tabelle `cantieri`, `cantiere_operai`, `telegram_sessions`, `telegram_config` non esistono. Le pagine `/app/cantieri` non esistono. Le Edge Functions `telegram-cantiere-webhook`, `send-cantiere-report-email`, `setup-telegram-webhook` non esistono. Il `generate-report` usa parsing regex basico, non AI.

### Pre-requisiti: Secrets mancanti

Il progetto necessita di 2 nuovi secrets:
- **OPENAI_API_KEY** — per Whisper (trascrizione audio) e GPT-4o-mini (strutturazione report)
- **RESEND_API_KEY** — per invio email report (o in alternativa usare il sistema transactional email di Lovable)

Il `TELEGRAM_BOT_TOKEN` viene salvato nel DB (`telegram_config.bot_token`) e letto dalla Edge Function, quindi non serve come secret globale.

### Parte 1 — Database Migration

Crea 4 nuove tabelle e estendi `agent_reports`:

- **`cantieri`** — siti di costruzione con nome, indirizzo, committente, stato, email_report[], telegram_chat_ids[]
- **`cantiere_operai`** — operai associati con nome, ruolo, telefono, telegram_user_id/username
- **`telegram_sessions`** — stato conversazione per ogni chat Telegram (pending report, foto)
- **`telegram_config`** — configurazione bot Telegram per company (token, webhook_secret, orario invio)
- **Estensione `agent_reports`** — aggiunge 15+ colonne per cantiere_id, operaio_id, trascrizione, audio_url, foto_urls[], dati strutturati (operai_presenti, lavori, materiali, problemi, avanzamento), email tracking
- **Storage bucket** `cantiere-media` (privato) per audio e foto

RLS policies: company-scoped per cantieri/operai/config, superadmin-only per telegram_sessions.

### Parte 2 — Edge Functions (4 funzioni)

1. **`telegram-cantiere-webhook`** (~300 righe) — Cuore del sistema. Riceve messaggi Telegram, gestisce comandi (/start, /status, /conferma, /annulla), scarica audio, trascrive con Whisper, struttura con GPT-4o-mini, salva foto in Storage, conferma con operaio, salva report. Legge il bot token dal DB (non da secret globale).

2. **`send-cantiere-report-email`** — Invia report HTML via Resend ai destinatari configurati nel cantiere.

3. **`generate-report` (riscrittura)** — Sostituisce il parsing regex con GPT-4o-mini per strutturare report da trascrizioni.

4. **`setup-telegram-webhook`** — Registra il webhook URL su Telegram API per il bot della company.

Config toml: tutte con `verify_jwt = false` (Telegram non invia JWT).

### Parte 3 — Frontend (4 pagine + 1 componente)

1. **`Cantieri.tsx`** (`/app/cantieri`) — Lista cantieri con badge stato, mini KPI (operai, report, ultimo report), dialog creazione nuovo cantiere (nome, indirizzo, committente, date, email destinatari multi-tag).

2. **`CantiereDetail.tsx`** (`/app/cantieri/:id`) — 3 tab:
   - Report: timeline verticale con filtro data, click per dettaglio
   - Operai: lista con stato Telegram, form aggiunta, link invito
   - Statistiche: grafici recharts (report/giorno, avanzamento, ore per operaio)

3. **`CantiereConfig.tsx`** (`/app/cantieri/configurazione`) — Setup bot Telegram (istruzioni BotFather, campo token, pulsante attiva), associazione operai, email default.

4. **`ReportDetailModal.tsx`** — Dialog con trascrizione, dati strutturati, galleria foto, player audio, status email.

### Parte 4 — Navigazione

- Aggiungere sezione "CANTIERI" nella sidebar con icona HardHat: I Cantieri, Configura Bot
- 3 nuove route in App.tsx sotto le company routes

### Ordine di implementazione

1. Richiedere secrets (OPENAI_API_KEY, RESEND_API_KEY)
2. Migration DB
3. Edge Functions (telegram-cantiere-webhook, send-cantiere-report-email, setup-telegram-webhook, riscrittura generate-report)
4. Frontend (pagine + componenti + routing + sidebar)

