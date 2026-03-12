

# PROMPT 7 — Fix Critici WhatsApp

## Bugs confermati

| Fix | File | Bug | Gravità |
|-----|------|-----|---------|
| 1 | `whatsapp-connect-number/index.ts` | Riga 40: `client_secret: saConfig.meta_app_secret_encrypted` — invia il valore AES-GCM cifrato a Meta invece del secret in chiaro | CRITICO |
| 2 | `whatsapp-refresh-tokens/index.ts` | Riga 39: stesso problema — `client_secret: saConfig.meta_app_secret_encrypted` | CRITICO |
| 3 | `src/pages/app/WhatsApp.tsx` | Nessuna subscription Realtime — i messaggi non si aggiornano live. Già ha `messagesEndRef`, `loadMessages`, `setMessages` (riga 732-753) | ALTO |

## Piano

### Fix 1 — `whatsapp-connect-number/index.ts`
- Aggiungere import `decryptToken` da `_shared/crypto.ts` (riga 3)
- Dopo riga 29, decriptare `saConfig.meta_app_secret_encrypted` con `getEncryptionKey()`
- Riga 40: sostituire `saConfig.meta_app_secret_encrypted` con il valore decriptato

### Fix 2 — `whatsapp-refresh-tokens/index.ts`
- Dopo riga 17 (dove già ha `encryptionKey`), decriptare `saConfig.meta_app_secret_encrypted`
- Riga 39: sostituire con il valore decriptato

### Fix 3 — `src/pages/app/WhatsApp.tsx` (TabConversations, riga ~730)
- Aggiungere `useEffect` con subscription Realtime su `whatsapp_messages` (INSERT + UPDATE) filtrato per `conversation_id` della conversazione selezionata
- Aggiungere `useEffect` con subscription Realtime su `whatsapp_conversations` filtrato per `company_id` per aggiornare la lista conversazioni
- Entrambe con cleanup `supabase.removeChannel()` nel return

### Files modificati
- `supabase/functions/whatsapp-connect-number/index.ts`
- `supabase/functions/whatsapp-refresh-tokens/index.ts`
- `src/pages/app/WhatsApp.tsx`

