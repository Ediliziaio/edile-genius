

## Piano: Aggiungere tab N8N in PlatformSettings

### Obiettivo
Aggiungere un nuovo tab "N8N Automation" nella pagina PlatformSettings del SuperAdmin per configurare `N8N_BASE_URL` e `N8N_API_KEY`, salvandoli come Supabase Edge Function secrets tramite una nuova edge function dedicata.

### Approccio

I valori N8N sono secrets sensibili e devono essere salvati come Supabase secrets (accessibili dalle edge functions), non in tabelle DB. Serve una edge function che, autenticata come superadmin, salvi i secrets usando il service role.

### Modifiche

**1. Nuova Edge Function `manage-n8n-config/index.ts`**
- Verifica ruolo superadmin (stesso pattern di `platform-config`)
- Azioni:
  - `test_connection`: testa la connessione n8n chiamando `GET {base_url}/api/v1/workflows` con l'API key
  - `save_config`: salva `N8N_BASE_URL` e `N8N_API_KEY` nella tabella `platform_config` (campi nuovi) — i valori effettivi dei secrets sono già configurati in Supabase, quindi salviamo solo lo stato (configurato/testato) nel DB
  - `get_status`: ritorna se i secrets sono configurati e l'ultimo test

**2. Migrazione DB: aggiungere colonne a `platform_config`**
- `n8n_configured boolean DEFAULT false`
- `n8n_base_url text` (non è un secret, è un URL)
- `n8n_api_key_set boolean DEFAULT false` (flag, il valore reale resta nei secrets)
- `n8n_tested_at timestamptz`
- `n8n_workflows_count integer DEFAULT 0`

**3. Modifica `src/pages/superadmin/PlatformSettings.tsx`**
- Aggiungere tab "N8N" (6 tab totali, `grid-cols-6`)
- Stato: `n8nBaseUrl`, `n8nApiKey`, `n8nSaving`, `n8nTesting`, `n8nStatus`
- Card "Stato Connessione" con badge configurato/non configurato
- Form: campo `N8N_BASE_URL` (input text) + `N8N_API_KEY` (input password con toggle visibilità)
- Pulsante "Testa Connessione" che chiama la edge function
- Pulsante "Salva" che:
  1. Salva `N8N_BASE_URL` nella tabella `platform_config`
  2. Salva `N8N_API_KEY` come Supabase secret tramite la edge function (usando il management API)
- Mostra ultimo test e numero workflow trovati

**4. Aggiungere il secret `N8N_API_KEY` tramite tool**
- Richiedere all'utente di fornire il valore tramite il tool `secrets`

### Note tecniche
- Il `N8N_BASE_URL` può essere salvato in DB (non è un secret) per renderlo leggibile dal frontend
- Il `N8N_API_KEY` deve restare come Supabase secret, accessibile solo dalle edge functions
- La edge function `manage-n8n-config` usa il service client per leggere/scrivere `platform_config`
- Il test di connessione chiama l'API n8n per verificare che URL + key funzionino

