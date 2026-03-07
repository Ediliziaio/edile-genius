

# Piano: Flusso OAuth Meta Embedded Signup per le Aziende

## Problema attuale
Il dialog "Collega Numero" chiede alle aziende di incollare manualmente User Access Token, WABA ID e Phone Number ID. Questo è complicato e soggetto a errori. Le credenziali Meta API (App ID, App Secret) sono già configurate dal SuperAdmin.

## Soluzione
Implementare il vero flusso **Meta Embedded Signup** con popup OAuth: l'azienda clicca un bottone, si apre il popup Facebook, autorizza l'app, e tutti i dati (token, WABA ID, phone number) vengono restituiti automaticamente tramite il callback JavaScript.

## Come funziona il flusso

```text
Azienda clicca "Collega WhatsApp"
    │
    ▼
Edge function restituisce meta_app_id (dal superadmin config)
    │
    ▼
Frontend carica Facebook SDK + lancia FB.login() con scope:
  - whatsapp_business_management
  - whatsapp_business_messaging
    │
    ▼
Popup Facebook → l'azienda seleziona Business Manager + WABA + numero
    │
    ▼
Callback JS riceve: accessToken, waba_id, phone_number_id
    │
    ▼
Frontend invia tutto a whatsapp-connect-number (edge function esistente)
    │
    ▼
Token scambiato per long-lived, cifrato, salvato → Fatto!
```

## Modifiche

### 1. Nuova Edge Function: `whatsapp-get-app-id/index.ts`
- Legge `meta_app_id` da `superadmin_whatsapp_config`
- Lo restituisce al frontend (non è un segreto, serve per il Facebook SDK)
- Auth: richiede JWT di un utente autenticato

### 2. Modifica `src/pages/app/WhatsApp.tsx` — `ConnectNumberDialog`
- Rimuovere il form manuale con token/WABA ID/Phone Number ID
- Aggiungere il caricamento dinamico del Facebook JavaScript SDK
- Implementare `FB.login()` con config Embedded Signup:
  - `config_id` (opzionale, se configurato dal SuperAdmin)
  - `extras.feature: "whatsapp_embedded_signup"`
  - `extras.setup: {}` per ricevere WABA ID e phone number ID nel callback
- Sul callback di successo, inviare i dati a `whatsapp-connect-number` (già esistente)
- Mantenere un fallback "inserimento manuale" nascosto per casi edge

### 3. Modifica `TabSettings` (Impostazioni)
- Rimuovere il form manuale "Configurazione WABA" con WABA ID, token, ecc.
- Mostrare solo i dati WABA già collegati in sola lettura (business name, WABA ID, stato verifica)
- Aggiungere bottone "Ricollega" che riapre il flusso OAuth

### 4. `supabase/config.toml`
- Aggiungere entry `[functions.whatsapp-get-app-id]`

### 5. `index.html`
- Non serve caricare lo script Facebook qui — verrà caricato dinamicamente dal componente

## UI del nuovo dialog

Il dialog diventa semplicissimo:
1. **Step 1**: Bottone grande "Collega con Facebook" (verde, con logo FB)
2. **Step 2**: Loading "Connessione in corso..."
3. **Step 3**: Successo con riepilogo (nome numero, WABA)

Niente più campi manuali nel flusso principale.

## File da creare/modificare

| File | Azione |
|------|--------|
| `supabase/functions/whatsapp-get-app-id/index.ts` | Nuovo — restituisce meta_app_id |
| `src/pages/app/WhatsApp.tsx` | Riscrivere ConnectNumberDialog + semplificare TabSettings |
| `supabase/config.toml` | Aggiungere entry per la nuova function |

