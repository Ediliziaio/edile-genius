

# Audit Completo: Modulo WhatsApp vs Documento Master

## Stato Attuale — Cosa c'è e cosa manca

### Database (7/7 tabelle) — COMPLETO
Tutte le tabelle del documento sono presenti con RLS multi-tenant corretto (`my_company()`, `has_role()`):
- `superadmin_whatsapp_config`, `whatsapp_subscriptions`, `whatsapp_waba_config`, `whatsapp_phone_numbers`, `whatsapp_templates`, `whatsapp_conversations`, `whatsapp_messages`

### Edge Functions (4/5) — MANCA 1
| Function | Stato | Note |
|----------|-------|------|
| `whatsapp-webhook` | Presente | Gestisce GET verify + POST inbound/status |
| `whatsapp-send` | Presente | Invio testo e template via Meta Graph API |
| `whatsapp-templates-sync` | Presente | Sync template da Meta |
| `whatsapp-subscription` | Presente | Attiva/disattiva abbonamento |
| `whatsapp-connect-number` | **MANCANTE** | Dovrebbe gestire Embedded Signup: scambio token utente -> token sistema long-lived, cifratura AES-256, registrazione numero su WABA |

### Routing & Sidebar — COMPLETO
- `/app/whatsapp` e `/superadmin/whatsapp` registrati in App.tsx
- Sidebar company e superadmin hanno entrambe la voce WhatsApp

### Frontend Company (`/app/whatsapp`) — 6/6 TAB PRESENTI
Tutte e 6 le tab sono implementate: Panoramica, Numeri, Modelli, Conversazioni, Broadcast, Impostazioni

### Frontend SuperAdmin (`/superadmin/whatsapp`) — COMPLETO
Config API Meta, pricing, tabella account con sospendi/riattiva

### Componenti separati dal documento (hooks, componenti dedicati) — NON IMPLEMENTATI MA NON NECESSARI
Il documento suggerisce file separati (`useWhatsAppSubscription.ts`, `WhatsAppConnectionCard.tsx`, etc.) ma tutta la logica è correttamente contenuta in `WhatsApp.tsx` (1238 righe). Funzionalmente equivalente.

---

## Cosa Manca Davvero

### 1. Edge Function `whatsapp-connect-number` (Embedded Signup Meta)
Il documento richiede una edge function per:
- Ricevere `user_access_token + waba_id + phone_number_id` dal frontend dopo Meta Embedded Signup
- Scambiare token utente per token sistema long-lived
- Cifrare con AES-256-GCM (richiede secret `META_ENCRYPTION_KEY`)
- Registrare numero su WABA via Meta API
- Salvare su DB con status CONNECTED

Il `ConnectNumberDialog` nel frontend attualmente simula la connessione (inserisce direttamente un record con `waba_id: "demo_waba_" + Date.now()`). Serve la vera edge function.

### 2. Secret `META_ENCRYPTION_KEY` non configurato
Necessario per cifrare/decifrare i token Meta WABA. Senza questo, i token vengono salvati in chiaro.

### 3. Template Sync button mancante nell'UI
La edge function `whatsapp-templates-sync` esiste ma non c'è un button "Sincronizza da Meta" nella tab Modelli del frontend.

### 4. Templates — manca preview corpo del messaggio nella tabella
Il documento (screenshot) mostra che nella lista template si vede anche il corpo del messaggio. Attualmente la tabella mostra solo nome/categoria/lingua/stato.

---

## Piano di Implementazione

### File da creare
| File | Azione |
|------|--------|
| `supabase/functions/whatsapp-connect-number/index.ts` | Edge function per Embedded Signup reale |

### File da modificare
| File | Modifica |
|------|----------|
| `src/pages/app/WhatsApp.tsx` | 1) Aggiungere button "Sincronizza da Meta" nella tab Modelli. 2) Mostrare corpo messaggio nella tabella template. 3) Collegare `ConnectNumberDialog` alla edge function `whatsapp-connect-number` invece del mock. |
| `supabase/config.toml` | Aggiungere `[functions.whatsapp-connect-number]` |

### Secret da configurare
- `META_ENCRYPTION_KEY` — 32 bytes per AES-256-GCM

