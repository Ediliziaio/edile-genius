

# Analisi Criticità Sistema — Terzo Ciclo

## Fix già applicati nei cicli precedenti

| Issue | Stato |
|-------|-------|
| Auth company check in `elevenlabs-outbound-call` | FIXATO |
| Auth `x-cron-secret` su `execute-scheduled-calls` | FIXATO (ma CRON_SECRET non configurato) |
| `contactNameCache` memory leak | FIXATO — ora in `useRef` con cleanup |
| BulkCallModal filter `status = 'active'` | FIXATO |
| Dashboard `twoHoursAgo` stale | FIXATO |
| CallMonitor `twoHoursAgo` stale | FIXATO |
| Best hour O(n²) | FIXATO |

---

## CRITICHE — Nuove o ancora presenti

### 1. `setup-telegram-webhook` — Zero autenticazione

Nessun check auth. Chiunque puo' chiamare la funzione con un `company_id` arbitrario e un bot token, registrando un webhook Telegram su qualsiasi azienda e leggendo i relativi dati cantiere. Anche il `bot_token` viene salvato in chiaro nel DB senza validazione del chiamante.

**Fix**: Aggiungere auth Bearer + verifica `profile.company_id === company_id`.

### 2. `send-cantiere-report-email` — Zero autenticazione

Nessun check auth. Accetta `report_id`, `destinatari`, `company_id` dal body e invia email a indirizzi arbitrari con il contenuto di qualsiasi report. Un attaccante puo' esfiltrare dati di cantiere di qualsiasi azienda.

**Fix**: Aggiungere auth + tenant check, oppure se chiamata solo internamente, aggiungere un secret header.

### 3. `generate-foglio-presenze` — Nessun tenant check

Ha auth (verifica user), ma accetta `company_id` dal body senza verificare che l'utente appartenga a quella company. Un utente autenticato di Company A puo' generare il foglio presenze di Company B.

**Fix**: Dopo auth, verificare `profile.company_id === company_id` (o superadmin).

### 4. `elevenlabs-import-phone-number` — Nessun tenant check

Ha auth, ma accetta `company_id` dal body senza verificare appartenenza. Un utente puo' importare numeri di telefono per conto di un'altra azienda.

**Fix**: Verificare `profile.company_id === company_id`.

### 5. `check-credits-before-call` — Nessun tenant check su `agentId`

Ha auth e risolve `company_id` dal profilo, ma l'`agentId` dal body non viene verificato. Interroga `agents` senza filtro `company_id`, potenzialmente esponendo configurazione (modello LLM/TTS) di agenti di altre aziende.

**Fix**: Aggiungere `.eq("company_id", profile.company_id)` alla query agent.

### 6. `launch_bulk_calls` SQL — SECURITY DEFINER + `my_company()` conflitto

Ancora presente. `my_company()` usa `auth.uid()`, che dentro `SECURITY DEFINER` gira come owner. Potrebbe bloccare tutti gli utenti o (peggio) bypassare il check.

**Fix**: Rimuovere `my_company()` check; la sicurezza è già garantita dal filtro `contacts.company_id = p_company_id` + il fatto che la funzione è `GRANT`ed solo a `authenticated`.

### 7. `monthly_billing_summary` — Nessuna RLS (Security Scan)

Tabella/vista con dati finanziari sensibili (costi reali, margini, nomi aziende) accessibile a tutti gli utenti autenticati. Qualsiasi utente puo' vedere i dati finanziari di tutte le aziende.

**Fix**: Aggiungere RLS policy con `company_id = get_user_company_id(auth.uid())` + superadmin override.

### 8. RLS policies su `{public}` invece di `{authenticated}` (Security Scan)

Le tabelle `webhooks`, `whatsapp_contacts`, `webhook_logs`, `n8n_executions`, `n8n_workflows`, `telegram_message_log` hanno policies che si applicano al ruolo `public` (include utenti anonimi). Attualmente sicuro perche' `auth.uid()` restituisce NULL, ma fragile.

**Fix**: Cambiare le policy da `public` a `authenticated`.

---

## MEDIE

### 9. Dashboard — `startOfMonth` ricalcolato ad ogni render

Righe 71-90: `startOfMonth` e `startOfPrevMonth` creati nel body del componente ad ogni render. Possono causare query con timestamp inconsistenti durante i re-render rapidi.

**Fix**: Spostare dentro `queryFn` o wrappare in `useMemo`.

### 10. Leaked Password Protection disabilitata (Security Scan)

Supabase non sta verificando le password contro database di credenziali compromesse.

**Fix**: Abilitare nelle impostazioni auth di Supabase.

### 11. `CRON_SECRET` non configurato

Il check in `execute-scheduled-calls` viene bypassato perche' la condizione è `if (cronSecret && ...)`. Senza il secret, la funzione resta pubblica.

---

## Piano di Fix

| # | File/Risorsa | Azione | Effort |
|---|-------------|--------|--------|
| 1 | `setup-telegram-webhook` | Aggiungere auth + tenant check | 10 min |
| 2 | `send-cantiere-report-email` | Aggiungere auth o secret header | 10 min |
| 3 | `generate-foglio-presenze` | Aggiungere tenant check | 5 min |
| 4 | `elevenlabs-import-phone-number` | Aggiungere tenant check | 5 min |
| 5 | `check-credits-before-call` | Filtro company_id su query agent | 2 min |
| 6 | Migrazione SQL | Fix `launch_bulk_calls`: rimuovere `my_company()` + `p_agent_id` TEXT→UUID | 10 min |
| 7 | Migrazione SQL | Aggiungere RLS a `monthly_billing_summary` | 5 min |
| 8 | Migrazione SQL | Cambiare policies da `public` a `authenticated` su 6 tabelle | 10 min |
| 9 | `Dashboard.tsx` | Spostare `startOfMonth` dentro `queryFn` | 2 min |
| 10 | Supabase Dashboard | Abilitare Leaked Password Protection | 1 min |

