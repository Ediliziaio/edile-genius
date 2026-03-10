

## Piano: 6 Automazioni Edile Genius

Questo prompt richiede 6 automazioni complete. Data la complessità (6 tabelle DB, ~8 Edge Functions, ~6 pagine frontend, 4 job pg_cron), propongo di implementarle in blocchi.

### Panoramica delle 6 Automazioni

1. **Preventivi da Audio** — Registra audio sopralluogo, Whisper + GPT genera preventivo strutturato con PDF
2. **Scadenze Documenti** — Traccia DURC, patenti, certificati con alert automatici a 30/15/7 giorni
3. **Foglio Presenze** — Estrae ore lavorate dai report audio, genera foglio presenze mensile Excel
4. **Reminder Report 18:00** — pg_cron invia reminder Telegram ai cantieri senza report
5. **Alert Mancato Report** — Se nessun report dopo X ore dalla fine turno, alert urgente
6. **SAL (Stato Avanzamento Lavori)** — Milestone con target %, alert ritardo automatico

### Dipendenze e Secrets

Secrets necessari (da aggiungere via SuperAdmin come concordato):
- `OPENAI_API_KEY` — per Whisper + GPT-4o (automazione 1)
- `RESEND_API_KEY` — per email alert (automazioni 2, 5, 6)
- `TELEGRAM_BOT_TOKEN` — per reminder e alert Telegram (automazioni 4, 5, 6). Nota: il sistema cantieri attuale legge il token dal DB (`telegram_config`), ma le automazioni cron usano un token globale.

pg_cron + pg_net devono essere abilitati in Supabase Dashboard.

### Database (6 migrazioni in una)

| Tabella | Automazione | Descrizione |
|---------|-------------|-------------|
| `preventivi` | 1 | Voci JSONB, totali, stato, PDF, audio |
| `documenti_azienda` | 2 | Scadenze con flag alert 30/15/7/scaduto |
| `presenze_mensili` | 3 | Ore giornaliere JSONB per operaio/mese |
| `alert_mancato_report` | 5 | Tracking alert inviati per evitare duplicati |
| `sal_milestones` | 6 | Milestone SAL con target % e date |
| Estensione `cantieri` | 4,5 | +reminder_ora, +alert_mancato_report_ore, +fine_turno_ora |

Storage buckets: `preventivi-audio`, `preventivi-pdf`, `documenti-azienda`.

Trigger: `update_presenze_from_report` su `agent_reports` INSERT per aggiornare automaticamente le presenze.

### Edge Functions (8 funzioni)

| Funzione | Auto | JWT | Descrizione |
|----------|------|-----|-------------|
| `process-preventivo-audio` | 1 | yes | Whisper + GPT-4o → voci preventivo |
| `generate-preventivo-pdf` | 1 | yes | HTML template → salva in storage |
| `check-documenti-scadenze` | 2 | no | Cron: controlla scadenze, invia alert |
| `generate-foglio-presenze` | 3 | yes | Genera CSV presenze mensili |
| `send-cantiere-reminders` | 4 | no | Cron: reminder Telegram 18:00 |
| `check-mancati-report` | 5 | no | Cron: alert mancato report |
| `check-sal-ritardi` | 6 | no | Cron: controlla SAL in ritardo |

Le funzioni cron (verify_jwt=false) vengono chiamate da pg_cron.

### Frontend (6 pagine + componenti)

| Pagina | Route | Auto |
|--------|-------|------|
| `PreventiviList.tsx` | `/app/preventivi` | 1 |
| `NuovoPreventivo.tsx` | `/app/preventivi/nuovo` | 1 |
| `PreventivoDetail.tsx` | `/app/preventivi/:id` | 1 |
| `DocumentiScadenze.tsx` | `/app/documenti` | 2 |
| `FoglioPresenze.tsx` | `/app/presenze` | 3 |
| Tab SAL in CantiereDetail | `/app/cantieri/:id` (tab 4) | 6 |

Sidebar: nuova sezione "AUTOMAZIONI" con Preventivi, Documenti, Presenze.

### Ordine di implementazione suggerito

Data la dimensione, suggerisco di implementare in 3 blocchi:

**Blocco A** (Automazioni 1-2): Preventivi + Documenti Scadenze
- DB: tabelle `preventivi`, `documenti_azienda`, buckets, trigger numero_preventivo
- Edge Functions: `process-preventivo-audio`, `generate-preventivo-pdf`, `check-documenti-scadenze`
- Frontend: 4 pagine (PreventiviList, NuovoPreventivo, PreventivoDetail, DocumentiScadenze)

**Blocco B** (Automazioni 3-5): Presenze + Reminder + Alert
- DB: `presenze_mensili`, `alert_mancato_report`, estensione `cantieri`, trigger presenze
- Edge Functions: `generate-foglio-presenze`, `send-cantiere-reminders`, `check-mancati-report`
- Frontend: FoglioPresenze.tsx

**Blocco C** (Automazione 6): SAL
- DB: `sal_milestones`
- Edge Function: `check-sal-ritardi`
- Frontend: tab SAL in CantiereDetail

### Note tecniche

- pg_cron jobs richiedono `ALTER DATABASE postgres SET app.supabase_url/service_role_key` che non possiamo eseguire via migration (proibito). I job cron andranno configurati manualmente dall'utente nella SQL Editor di Supabase.
- Per il PDF preventivo: generazione HTML lato Edge Function + conversione PDF lato client con `html2pdf.js` (da aggiungere come dipendenza).
- Per l'Excel presenze: dati dal backend, generazione XLSX lato client con `xlsx` (SheetJS, da aggiungere).
- Il `TELEGRAM_BOT_TOKEN` per le automazioni cron serve come secret globale Supabase, separato dal token per-company nel DB.

Procediamo con il **Blocco A** (Preventivi + Documenti)?

