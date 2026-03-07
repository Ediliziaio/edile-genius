

# Piano: Config ID Meta nel SuperAdmin + Auto-Refresh Token

## 1. Config ID Meta nel SuperAdmin

### Problema
Il flusso Embedded Signup usa `config_id: undefined`. Meta permette di creare un "Configuration" nella dashboard dell'app che pre-seleziona soluzioni (WhatsApp, messaggistica), limita permessi e personalizza il flusso. Il SuperAdmin deve poter impostare questo `config_id`.

### Modifiche

**Database**: aggiungere colonna `meta_config_id` a `superadmin_whatsapp_config` (text, nullable, default null).

**`PlatformSettings.tsx`**: aggiungere campo "Meta Config ID" nel form WhatsApp API (opzionale), salvarlo con le altre credenziali.

**`whatsapp-get-app-id/index.ts`**: restituire anche `meta_config_id` nella risposta.

**`WhatsApp.tsx` — `ConnectNumberDialog`**: usare il `config_id` ricevuto dalla edge function nel `FB.login()` al posto di `undefined`.

## 2. Auto-Refresh Token Meta

### Problema
I token long-lived Meta durano ~60 giorni. Quando scadono, le API smettono di funzionare senza avviso.

### Soluzione
Creare una edge function `whatsapp-refresh-tokens` che:
1. Legge tutti i `whatsapp_waba_config` con `access_token_encrypted`
2. Decifra ogni token (AES-256-GCM)
3. Chiama `GET /v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app_id}&client_secret={app_secret}&fb_exchange_token={token}` per ottenere un nuovo long-lived token
4. Se OK → cifra il nuovo token e aggiorna il record + `token_refreshed_at`
5. Se errore → logga e aggiorna `token_refresh_error` sul record
6. Schedulabile via `pg_cron` ogni 30 giorni

### Database
- Aggiungere a `whatsapp_waba_config`: `token_refreshed_at` (timestamptz, nullable), `token_refresh_error` (text, nullable)

### File

| File | Azione |
|------|--------|
| **Migration SQL** | Aggiunge `meta_config_id` a `superadmin_whatsapp_config`, `token_refreshed_at` + `token_refresh_error` a `whatsapp_waba_config` |
| `supabase/functions/whatsapp-refresh-tokens/index.ts` | Nuova — refresh automatico di tutti i token |
| `supabase/functions/whatsapp-get-app-id/index.ts` | Aggiunge `meta_config_id` alla risposta |
| `src/pages/superadmin/PlatformSettings.tsx` | Aggiunge campo "Meta Config ID (opzionale)" nel form WA |
| `src/pages/app/WhatsApp.tsx` | Usa `config_id` dinamico da edge function |
| `supabase/config.toml` | Aggiunge entry `whatsapp-refresh-tokens` |

### Flusso refresh token

```text
pg_cron (ogni 30 giorni) → whatsapp-refresh-tokens
    │
    ▼
Legge tutti whatsapp_waba_config
    │
    ▼
Per ogni record:
  ├── Decifra token (AES-256-GCM)
  ├── Chiama Meta Graph API exchange
  ├── Se OK → cifra nuovo token, salva + token_refreshed_at
  └── Se errore → salva token_refresh_error
```

