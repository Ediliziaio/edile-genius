

# PROMPT 3 — Integrazione WhatsApp Business API Completa

## Stato attuale
I 3 fix critici di sicurezza (Prompt 4) sono gia applicati:
- whatsapp-connect-number: POST body
- whatsapp-send: decrypt token
- whatsapp-webhook: HMAC obbligatorio

La pagina WhatsApp.tsx ha gia una UI funzionale con: subscription gate, connect number dialog (Meta Embedded Signup), template editor, tab conversazioni con chat, tab numeri, tab template, tab analytics.

## Cosa manca da Prompt 3

### 1. Gestione finestra 24h in whatsapp-send
- Prima di inviare un messaggio `text`, controllare `last_inbound_at` dal contatto
- Se la finestra e chiusa (>24h), restituire errore 422 con suggerimento di usare template
- Nel webhook inbound, aggiornare `last_inbound_at` atomicamente

### 2. Supporto messaggi interattivi in whatsapp-send
- Estendere il payload per supportare: image, document, audio, interactive (buttons/list), location, reaction
- Retry automatico con backoff su 429

### 3. Gestione media in entrata (whatsapp-webhook)
- Scaricare media da Meta (image, video, audio, document) e salvare su Supabase Storage bucket `whatsapp-media`
- Gestire location, interactive replies, reactions
- Idempotency check su `meta_message_id`

### 4. Database migration
- Creare tabella `whatsapp_contacts` (phone_number, company_id, last_inbound_at, last_message_at, contact_id FK, UNIQUE)
- Creare bucket storage `whatsapp-media`
- Aggiungere colonne `media_url`, `media_type` a `whatsapp_messages` se mancanti
- RLS policies company-scoped

### 5. UI — Indicatore finestra 24h nelle conversazioni
- Badge verde/arancione sulla lista conversazioni
- Disabilitare textarea quando finestra chiusa, mostrare dropdown template

## File coinvolti

| File | Modifica |
|------|----------|
| `supabase/functions/whatsapp-send/index.ts` | Finestra 24h + tipi messaggio estesi + retry 429 |
| `supabase/functions/whatsapp-webhook/index.ts` | Media download + storage + last_inbound_at + idempotency |
| `supabase/migrations/[timestamp].sql` | whatsapp_contacts table + RLS + media columns |
| `src/pages/app/WhatsApp.tsx` | Indicatore finestra 24h + template fallback UI |

## Note tecniche
- Il bucket `whatsapp-media` sara privato (i media contengono dati sensibili dei clienti)
- Per scaricare media da Meta serve decryptare il token WABA (gia implementato in whatsapp-send)
- La tabella `whatsapp_contacts` e separata da `contacts` (CRM) ma con FK opzionale per collegamento
- Idempotency check nel webhook usa `meta_message_id` gia presente

