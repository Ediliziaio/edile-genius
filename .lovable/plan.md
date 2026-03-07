

# Piano: Completamento Modulo WhatsApp — Impostazioni, Conversazioni & WABA Config

## Problema

La pagina `/app/whatsapp` ha solo 3 tab (Numeri, Modelli, Flussi) ma manca:
1. **Tab Impostazioni** — configurazione WABA per azienda (access token, business verification, webhook status)
2. **Tab Conversazioni** — inbox WhatsApp con lista conversazioni e chat view
3. **Tab Broadcast** — invio messaggi a lista contatti con template
4. La subscription gate non recupera il prezzo dal SuperAdmin config

## Modifiche pianificate

### 1. WhatsApp.tsx — Aggiungere 3 nuove tab

**Tab "Impostazioni"**:
- Card WABA Config: mostra/modifica `waba_id`, `business_name`, `access_token` (mascherato), `meta_verification_status`
- Card Webhook: stato webhook per il numero collegato
- Card Abbonamento: dettagli piano attivo, data scadenza, button disattiva

**Tab "Conversazioni"**:
- Layout split: lista conversazioni a sinistra (da `whatsapp_conversations`) + chat a destra (da `whatsapp_messages`)
- Ogni conversazione mostra: telefono contatto, ultimo messaggio, unread count, stato finestra 24h
- Chat view: bolle messaggio inbound/outbound, input per risposta testo, button invio template
- Badge "AI" se `ai_enabled` sulla conversazione

**Tab "Broadcast"**:
- Selezione template approvato
- Selezione lista contatti o numeri manuali
- Preview messaggio
- Button "Invia Broadcast" che chiama `whatsapp-send` per ogni destinatario

### 2. Logica subscription gate migliorata

- Recupera `subscription_price_monthly` da `superadmin_whatsapp_config` per mostrare il prezzo reale
- Dopo attivazione, crea anche record in `whatsapp_waba_config` vuoto per l'azienda

### 3. File da modificare

| File | Azione |
|------|--------|
| `src/pages/app/WhatsApp.tsx` | Riscrittura completa (~800 righe): 6 tab (Panoramica, Numeri, Modelli, Conversazioni, Broadcast, Impostazioni) |

Nessuna modifica DB necessaria — tutte le tabelle esistono già (`whatsapp_conversations`, `whatsapp_messages`, `whatsapp_waba_config`).

