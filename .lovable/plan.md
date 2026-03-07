

# Piano: Sistema Crediti & Fatturazione basato su Costi Reali ElevenLabs

## Sintesi

Il prompt richiede una riscrittura completa del sistema crediti: passare da **minuti** a **euro** come unità di misura, con pricing granulare per combinazione LLM+TTS, ricarica automatica, blocco chiamate in tempo reale, e dashboard economics per SuperAdmin.

## Cosa cambia rispetto allo stato attuale

| Attuale | Nuovo |
|---------|-------|
| `ai_credits` traccia minuti (purchased/used/reserved) | Traccia euro (balance_eur, total_recharged, total_spent) |
| `ai_credit_packages` con minuti fissi | `ai_credit_topups` con importi euro + tipo (manual/auto/promotional) |
| `ai_credit_purchases` semplice | `ai_credit_usage` dettagliato per conversazione con costi reali/fatturati |
| `platform_config` con un singolo cost_per_min | `platform_pricing` con costo per ogni combo LLM+TTS |
| Pagina Credits mostra minuti | Mostra saldo euro, ricarica manuale, auto-recharge, storico |
| Nessun blocco chiamate | Blocco automatico se saldo = 0 |
| Nessun check pre-chiamata | Edge function `check-credits-before-call` |

## 1. Database Migration

### Nuove tabelle:
- **`platform_pricing`**: combinazioni LLM+TTS con `cost_real_per_min`, `cost_billed_per_min`, `markup_multiplier`, label, is_active. Unique constraint su (llm_model, tts_model). Seed con 8 combinazioni default.
- **`ai_credit_topups`**: ricariche (manual/auto/promotional/adjustment) con status, payment_method, invoice_number
- **`ai_credit_usage`**: consumo per conversazione con tutti i dettagli economici (costo reale, fatturato, margine, saldo prima/dopo)
- **View `monthly_billing_summary`**: aggregazione mensile per fatturazione

### Modifiche a `ai_credits`:
- DROP colonne minuti (minutes_purchased, minutes_used, minutes_reserved)
- ADD: `balance_eur`, `total_recharged_eur`, `total_spent_eur`, `auto_recharge_enabled`, `auto_recharge_threshold`, `auto_recharge_amount`, `auto_recharge_method`, `auto_recharge_payment_ref`, `calls_blocked`, `blocked_at`, `blocked_reason`

### RLS:
- `platform_pricing`: superadmin ALL, company nessun accesso diretto (usato solo da edge functions)
- `ai_credit_topups`: superadmin ALL, company SELECT own
- `ai_credit_usage`: superadmin ALL, company SELECT own

### Tabelle da rimuovere/deprecare:
- `ai_credit_packages` e `ai_credit_purchases` restano per compatibilità ma non verranno più usate dall'UI

## 2. Edge Functions

### Nuove:
- **`check-credits-before-call`**: verifica saldo prima di ogni conversazione, ritorna `{allowed, balance_eur, cost_per_min}` o 402
- **`topup-credits`**: ricarica manuale con generazione numero fattura, sblocco automatico se era bloccato
- **`elevenlabs-webhook`**: post-conversazione, calcola costo esatto da platform_pricing, scala saldo, blocca se esauriti, trigger auto-recharge

### Modifiche:
- **`platform-config`**: aggiungere azione `update_pricing` per gestire la tabella platform_pricing, e `apply_global_markup` per ricalcolare tutti i prezzi

## 3. Pagina Credits Azienda (`/app/credits`) — Riscrittura completa

- **Hero saldo**: card con `€XX.XX` grande, barra consumo colorata (brand/amber/red), stima conversazioni rimanenti, alert se bloccato
- **Ricarica automatica**: toggle con configurazione soglia, importo, metodo pagamento (placeholder per Stripe)
- **Ricarica manuale**: grid 4 importi standard (€10/€20/€50/€100) + personalizzato, con stima minuti per modello LLM, modal conferma
- **Utilizzo per agente**: tabella con LLM+TTS, chiamate, minuti, costo, % totale + bar chart
- **Ultime conversazioni**: tabella da ai_credit_usage con data, agente, durata, LLM, costo, saldo dopo
- **Storico ricariche**: tabella da ai_credit_topups con tipo (badge colorato), importo, metodo, fattura, stato

## 4. PlatformSettings — Tab Prezzi riscritta

Sostituire la tab "Markup & Prezzi" attuale con:
- **Markup globale**: input moltiplicatore + preview live + button "Applica a tutte le tariffe"
- **Tabella tariffe**: una riga per ogni combo LLM+TTS in platform_pricing, con costo reale editabile, markup, costo azienda calcolato live, margine %, toggle attivo, salvataggio inline
- **Riepilogo economico**: 4 KPI card (incassato, costo reale, margine lordo, margine %) da monthly_billing_summary

## 5. Sidebar — Indicatore saldo nel footer

Aggiungere nel footer della sidebar company:
- Saldo `€XX.XX` con colore dinamico (brand/amber/red)
- Mini barra consumo
- Stima minuti rimanenti
- Button "Ricarica Ora" (amber) o "Gestisci Crediti" (ghost)
- Alert se calls_blocked

## 6. SuperAdmin Dashboard — Sezione Economics

Aggiungere sotto le card esistenti:
- 4 KPI card (Incassato, Costo EL, Margine, Margine %)
- Tabella saldo crediti per azienda con stato e azioni (sblocca manualmente)

## 7. Integrazione pre-chiamata

Modificare `VoiceTestPanel.tsx` per chiamare `check-credits-before-call` prima di `startSession()`. Se non allowed, mostrare card rossa con saldo e link ricarica.

## File da creare/modificare

| File | Azione |
|------|--------|
| Migration SQL | Crea platform_pricing, ai_credit_topups, ai_credit_usage, modifica ai_credits, view monthly_billing_summary |
| `supabase/functions/check-credits-before-call/index.ts` | Nuovo |
| `supabase/functions/topup-credits/index.ts` | Nuovo |
| `supabase/functions/elevenlabs-webhook/index.ts` | Nuovo |
| `supabase/functions/platform-config/index.ts` | Aggiorna (azioni pricing) |
| `supabase/config.toml` | Aggiungi 3 nuove functions |
| `src/pages/app/Credits.tsx` | Riscrittura completa (~500 righe) |
| `src/pages/superadmin/PlatformSettings.tsx` | Riscrittura tab pricing (~200 righe) |
| `src/pages/superadmin/Dashboard.tsx` | Aggiunta sezione economics |
| `src/components/layout/Sidebar.tsx` | Aggiunta footer saldo crediti |
| `src/components/agents/VoiceTestPanel.tsx` | Check crediti pre-chiamata |
| `src/integrations/supabase/types.ts` | Aggiornamento tipi |

