

# Piano: Test Connessione Meta WhatsApp API

## Cosa fare

Aggiungere al tab "WhatsApp API" in PlatformSettings.tsx:

1. **Validazione campi** — disabilita il salvataggio se mancano campi obbligatori (App ID, App Secret)
2. **Button "Testa Connessione"** — chiama Meta Graph API `GET /v21.0/app?access_token={app_id}|{app_secret}` tramite una edge function proxy per verificare che le credenziali siano valide
3. **Stato connessione visivo** — card con icona verde/rossa e ultimo test riuscito (stessa UI del tab ElevenLabs)

## Implementazione

### 1. Edge Function `whatsapp-test-connection/index.ts` (nuovo)
- Riceve `{ meta_app_id, meta_app_secret }` dal frontend
- Chiama `https://graph.facebook.com/v21.0/{meta_app_id}?access_token={meta_app_id}|{meta_app_secret}&fields=id,name`
- Se OK → restituisce `{ success: true, app_name: "..." }`
- Se errore → restituisce `{ success: false, error: "..." }`
- Auth: verifica JWT superadmin

### 2. Modifica `PlatformSettings.tsx`
- Aggiungere stato `waTesting`, `waTestResult` (success/fail/null), `waLastTestedAt`
- Card stato connessione in cima al tab WhatsApp (come ElevenLabs)
- Button "Testa Connessione" che invoca la edge function
- Validazione: disabilita "Salva" se `waAppId` o `waAppSecret` vuoti

### 3. `supabase/config.toml`
- Aggiungere `[functions.whatsapp-test-connection]` con `verify_jwt = false`

### File da creare/modificare
| File | Azione |
|------|--------|
| `supabase/functions/whatsapp-test-connection/index.ts` | Nuovo — proxy test Meta Graph API |
| `src/pages/superadmin/PlatformSettings.tsx` | Aggiungere card stato + button test + validazione |
| `supabase/config.toml` | Aggiungere entry per la nuova function |

