

# PROMPT 4 — Fix Sicurezza Critiche

## Obiettivo
Correggere 7 vulnerabilità critiche nelle Edge Functions di Edile Genius.

## Vulnerabilità da correggere

### 1. App Secret WhatsApp esposto in URL
**File**: `supabase/functions/whatsapp-connect-number/index.ts` (riga 45), `whatsapp-refresh-tokens/index.ts` (riga 56)
**Problema**: Il secret viene passato in query params, registrato nei log
**Fix**: Usare POST con body JSON per lo scambio token

### 2. Token WhatsApp inviato criptato a Meta API
**File**: `supabase/functions/whatsapp-send/index.ts` (riga 39)
**Problema**: Usa `access_token_encrypted` direttamente senza decriptare
**Fix**: Aggiungere decriptazione AES-256-GCM prima di chiamare Meta

### 3. API Key CRM salvate in chiaro
**File**: `supabase/functions/crm-sync/index.ts` (righe 203-204)
**Problema**: Chiavi API salvate in plaintext
**Fix**: Criptare al salvataggio, decriptare al recupero usando `_shared/crypto.ts`

### 4. analyze-window-photo senza autenticazione
**File**: `supabase/functions/analyze-window-photo/index.ts`
**Problema**: Nessuna verifica JWT — chiunque può consumare crediti OpenAI
**Fix**: Aggiungere validazione Bearer token all'inizio

### 5. elevenlabs-outbound-call usa pattern auth sbagliato
**File**: `supabase/functions/elevenlabs-outbound-call/index.ts` (righe 21)
**Problema**: Usa `getClaims()` che funziona solo con service_role
**Fix**: Usare pattern standard `supabase.auth.getUser()` con anon key

### 6. generate-render scala crediti prima di validare
**File**: `supabase/functions/generate-render/index.ts` (riga 193)
**Problema**: Crediti detratti prima del successo del render
**Fix**: Spostare deduzione crediti dopo upload immagine riuscito

### 7. WebhookHandler HMAC opzionale su WhatsApp
**File**: `supabase/functions/whatsapp-webhook/index.ts` (righe 65-75)
**Problema**: Se `WHATSAPP_APP_SECRET` non è settato, salta verifica HMAC
**Fix**: Rendere HMAC obbligatorio — restituire 401 se signature mancante/invalida

## File modificati

| File | Modifiche |
|------|-----------|
| `supabase/functions/_shared/crypto.ts` | Creare utility encrypt/decrypt AES-256-GCM |
| `supabase/functions/whatsapp-connect-number/index.ts` | POST al posto di GET per token exchange |
| `supabase/functions/whatsapp-refresh-tokens/index.ts` | POST al posto di GET per token refresh |
| `supabase/functions/whatsapp-send/index.ts` | Decriptare token prima di usarlo |
| `supabase/functions/crm-sync/index.ts` | Criptare/decriptare API key |
| `supabase/functions/analyze-window-photo/index.ts` | Aggiungere autenticazione JWT |
| `supabase/functions/elevenlabs-outbound-call/index.ts` | Fix pattern auth |
| `supabase/functions/generate-render/index.ts` | Deduzione crediti condizionale |
| `supabase/functions/whatsapp-webhook/index.ts` | HMAC obbligatorio |

## Note tecniche
- La chiave `ENCRYPTION_KEY` (64 char hex) deve essere configurata come Supabase Secret
- Per Meta OAuth, l'endpoint `oauth/access_token` supporta sia GET che POST — passeremo a POST
- Timing-safe comparison HMAC già implementato in `whatsapp-webhook`, ma va reso obbligatorio

