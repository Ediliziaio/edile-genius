

# Piano: Modulo WhatsApp AI — Integrazione Completa

## Panoramica

Integrare il modulo WhatsApp Business nel sistema edilizia.io con:
- **SuperAdmin**: configurazione API Meta globale (App ID, App Secret, Webhook) + pricing abbonamento + visibilità su tutti gli account
- **Aziende**: subscription paywall, collegamento numeri, gestione template, tab flussi (placeholder)
- **Database**: 6 nuove tabelle con RLS multi-tenant
- **Edge Functions**: webhook Meta, invio messaggi, sync template, gestione subscription

## 1. Database Migration

### Nuove tabelle (adattate allo schema esistente con `companies` invece di `accounts`):

| Tabella | Descrizione |
|---------|-------------|
| `whatsapp_subscriptions` | Abbonamento WA per azienda (status, plan, price, expires_at) |
| `whatsapp_phone_numbers` | Numeri collegati con WABA ID, quality rating, messaging tier |
| `whatsapp_waba_config` | Config WABA per azienda (access_token cifrato, business_id) |
| `whatsapp_templates` | Template messaggi sincronizzati da Meta |
| `whatsapp_messages` | Messaggi inbox/outbox con status tracking |
| `whatsapp_conversations` | Conversazioni WA con 24h window, AI enabled flag |

### Tabella SuperAdmin (senza RLS tenant, solo superadmin):
| Tabella | Descrizione |
|---------|-------------|
| `superadmin_whatsapp_config` | Meta App ID, App Secret (cifrato), Webhook URL, Verify Token |

### RLS: usa pattern esistente (`my_company()`, `has_role()`, `get_user_company_id()`)

## 2. Pagine Frontend

### Company side:
- **`/app/whatsapp`** — Pagina principale WhatsApp (convertita dal JSX uploadato usando i componenti UI shadcn/radix del progetto). Include:
  - Subscription gate (paywall se non attivo)
  - Tab Numeri: lista numeri collegati, modal "Collega Numero" (Embedded Signup simulato)
  - Tab Modelli: tabella template con status, modal editor con preview WhatsApp
  - Tab Flussi: placeholder per automazioni

### SuperAdmin side:
- **`/superadmin/whatsapp`** — Configurazione globale Meta:
  - Card API: Meta App ID, App Secret (mascherato), Webhook URL, Verify Token
  - Pricing: prezzo mensile abbonamento
  - Tabella: tutti gli account con WA attivo (azienda, status, numeri collegati, template count)
  - Azioni: sospendi/riattiva per azienda

## 3. Edge Functions

| Function | Scopo |
|----------|-------|
| `whatsapp-webhook` | Riceve eventi Meta (verifica GET + process POST). Salva messaggi inbound, aggiorna status delivery |
| `whatsapp-send` | Invia messaggi outbound (testo o template) via Meta Graph API |
| `whatsapp-templates-sync` | Sincronizza template da Meta per un account |
| `whatsapp-subscription` | Attiva/disattiva abbonamento (placeholder per Stripe) |

## 4. Sidebar & Routing

- Sidebar company: aggiungere "WhatsApp" con icona `MessageSquare` nella sezione COMUNICAZIONE
- Sidebar superadmin: aggiungere "WhatsApp" nella sezione PRINCIPALE
- App.tsx: registrare `/app/whatsapp` e `/superadmin/whatsapp`

## 5. Secrets necessari

- `META_ENCRYPTION_KEY` — per cifrare/decifrare access token WABA (32 bytes AES-256)
- Le API keys Meta (App ID, App Secret) vengono salvate nel DB `superadmin_whatsapp_config`, non come env vars (multi-tenant)

## File da creare/modificare

| File | Azione |
|------|--------|
| Migration SQL | 7 tabelle + RLS + trigger |
| `src/pages/app/WhatsApp.tsx` | Nuovo (~600 righe, convertito da JSX con componenti shadcn) |
| `src/pages/superadmin/WhatsAppAdmin.tsx` | Nuovo (~300 righe) |
| `supabase/functions/whatsapp-webhook/index.ts` | Nuovo |
| `supabase/functions/whatsapp-send/index.ts` | Nuovo |
| `supabase/functions/whatsapp-templates-sync/index.ts` | Nuovo |
| `supabase/functions/whatsapp-subscription/index.ts` | Nuovo |
| `src/components/layout/Sidebar.tsx` | Aggiungere voci WhatsApp |
| `src/App.tsx` | 2 nuove route |
| `supabase/config.toml` | 4 nuove functions |
| `src/integrations/supabase/types.ts` | Auto-aggiornato |

