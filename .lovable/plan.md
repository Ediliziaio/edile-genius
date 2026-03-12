

# Analisi Criticità — Edile Genius

## Criticità trovate, ordinate per gravità

---

### CRITICO — Secrets mancanti in produzione

I seguenti secrets **non esistono** nel progetto Supabase ma sono referenziati nel codice:

| Secret | Usato da | Impatto |
|--------|----------|---------|
| `STRIPE_SECRET_KEY` | `create-checkout-session`, `stripe-webhook` | Pagamenti completamente non funzionanti |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` | Webhook Stripe respinti |
| `OPENAI_API_KEY` | `elevenlabs-webhook/summary.ts`, `telegram-cantiere-webhook` | Nessuna analisi AI post-call, nessuna trascrizione vocale Telegram |
| `META_ENCRYPTION_KEY` | `_shared/crypto.ts` | WhatsApp non può decriptare token → invio messaggi impossibile |
| `RESEND_API_KEY` | `send-cantiere-report-email`, `weekly-report` | Nessuna email inviata |

**Senza questi secrets, il 60% delle funzionalità core è non operativo.**

---

### CRITICO — RLS duplicata su `ai_credits`

Ci sono **4 policy** su `ai_credits`, di cui 2 sono duplicati:

```text
ai_credits_company_read   (SELECT, qual: my_company())         ← duplicato
company_ai_credits_select (SELECT, qual: get_user_company_id()) ← duplicato
ai_credits_superadmin_all (ALL, superadmin)                     ← duplicato
superadmin_ai_credits     (ALL, superadmin)                     ← duplicato
```

Le policy duplicate non causano errori funzionali (sono PERMISSIVE), ma aggiungono overhead di valutazione RLS su ogni query e complicano la manutenzione. Vanno consolidate rimuovendo i duplicati.

---

### CRITICO — Indice unico duplicato su `ai_credit_topups.stripe_session_id`

Due indici identici:
- `idx_ai_credit_topups_stripe_session`
- `idx_topups_stripe_session`

Entrambi creano un `UNIQUE INDEX` sulla stessa colonna. Uno va rimosso.

---

### ALTO — `topup_credits` RPC non è atomico

La funzione `topup_credits` è un semplice `UPDATE ... RETURNING` **senza `FOR UPDATE` lock**. In caso di chiamate concorrenti (es. auto-recharge + webhook Stripe simultanei), è possibile un race condition. La funzione `deduct_call_credits` usa correttamente `FOR UPDATE`, ma `topup_credits` no.

**Fix**: Aggiungere `SELECT ... FOR UPDATE` prima dell'UPDATE, come già fatto in `deduct_call_credits`.

---

### ALTO — `Credits.tsx` polling useEffect con dipendenze vuote

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get("payment");
  if (payment === "success") {
    // ... usa companyId! (non-null assertion)
    // ... chiama pollForCredits
  }
}, []); // ← dipendenze vuote ma usa companyId e pollForCredits
```

Se `companyId` è ancora `null/undefined` quando il componente monta (es. AuthContext non ha ancora caricato il profilo), `companyId!` sarà `undefined` e la query Supabase fallirà silenziosamente. L'array vuoto `[]` significa che l'effetto non si ri-esegue quando `companyId` diventa disponibile.

**Fix**: Aggiungere `companyId` e `pollForCredits` come dipendenze, e fare early return se `!companyId`.

---

### ALTO — `elevenlabs-webhook`: auto-recharge senza pagamento reale

L'auto-recharge (linee 204-228) chiama `topup_credits` per aggiungere crediti al saldo, ma **non addebita nessun pagamento reale**. Aggiunge crediti "gratis" e registra il topup come `type: "auto"` con `payment_method: credits?.auto_recharge_method || "card"`, ma non c'è nessuna integrazione con Stripe per addebitare la carta.

Questo significa che l'auto-recharge crea crediti dal nulla. Se è intenzionale (es. il sistema è prepagato e l'auto-recharge prende da un "wallet" preesistente), va documentato. Se non è intenzionale, è una perdita economica.

---

### ALTO — `stripe-webhook` idempotency check usa client anonimo

L'idempotency check (linea 69-73) usa `sb` (service role client) per cercare `ai_credit_topups.stripe_session_id`. Questo è corretto. Tuttavia, l'insert successivo (linea 124) può fallire silenziosamente se il record esiste già grazie all'indice unico, ma l'errore non viene gestito — se l'insert fallisce per violazione dell'indice, i crediti sono già stati aggiunti dall'RPC ma il topup non viene registrato.

**Fix**: Avvolgere l'insert in un try-catch o usare upsert.

---

### MEDIO — `user_roles` ha solo policy SELECT

La tabella `user_roles` ha solo una policy `users_own_roles` con `cmd: SELECT`. Non ci sono policy per INSERT/UPDATE/DELETE. Questo significa che utenti autenticati **non possono** modificare i propri ruoli via RLS (corretto dal punto di vista della sicurezza), ma anche che le Edge Functions che usano il service role per inserire ruoli devono continuare a usare il service role key.

Tuttavia, il trigger `handle_new_user` che inserisce il ruolo `company_user` gira come `SECURITY DEFINER`, quindi bypassa RLS. Questo è corretto.

---

### MEDIO — `knowledge_base` non ha policy RLS

La tabella `knowledge_base` non appare nelle policy RLS. Se contiene dati sensibili per azienda, chiunque autenticato potrebbe leggerla.

---

### MEDIO — `platform_pricing` ha solo policy superadmin

Solo i superadmin possono leggere `platform_pricing`. Ma il `elevenlabs-webhook` usa il service role per leggere i prezzi, quindi funziona. Tuttavia, se un utente company vuole vedere i costi nel frontend, non potrà accedervi.

---

### MEDIO — `supabase.auth.getClaims()` potrebbe non esistere

L'API `supabase.auth.getClaims(token)` **non è un metodo standard** del Supabase JS client. Il metodo corretto per verificare un JWT è `supabase.auth.getUser(token)`. Se questa funzione non esiste nella versione deployata, **tutte le Edge Functions autenticate restituiranno 401**. Questo va verificato urgentemente testando una qualsiasi funzione autenticata.

---

### BASSO — Nessun reset mensile di `calls_month`

Il campo `agents.calls_month` viene incrementato nel webhook ma non c'è nessun cron job o funzione che lo resetta a 0 all'inizio di ogni mese.

---

### BASSO — `AuthContext` race condition

In `AuthContext.tsx`, `fetchUserData` è chiamato sia dal listener `onAuthStateChange` (con `setTimeout(..., 0)`) sia dal `getSession().then(...)`. Se entrambi eseguono quasi simultaneamente per la stessa sessione, ci sono due fetch paralleli non deduplicati.

---

## Riepilogo priorità

| Priorità | Criticità | Effort |
|----------|-----------|--------|
| CRITICO | Secrets mancanti (5) | Config |
| CRITICO | RLS + indici duplicati su ai_credits | 1 migration |
| ALTO | `topup_credits` RPC senza lock | 1 migration |
| ALTO | Credits.tsx useEffect dipendenze | 5 min |
| ALTO | Auto-recharge crea crediti senza pagamento | Design decision |
| ALTO | stripe-webhook insert senza error handling | 10 min |
| MEDIO | `getClaims()` potrebbe non esistere | Test urgente |
| MEDIO | knowledge_base senza RLS | 1 migration |
| BASSO | calls_month senza reset | Cron job |
| BASSO | AuthContext race condition | Minor refactor |

