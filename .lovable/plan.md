

# Analisi Criticità Sistema — Stato Attuale

## Criticità già corrette (dall'ultimo ciclo)

| # | Issue | Stato |
|---|-------|-------|
| 1 | Auth company check in `elevenlabs-outbound-call` | **FIXATO** — tenant isolation con `callerCompanyId` check |
| 2 | Auth su `execute-scheduled-calls` | **FIXATO** — `x-cron-secret` header validation aggiunta |
| 3 | `contactNameCache` memory leak | **NON FIXATO** — cache è ancora a livello modulo (riga 37), non `useRef` |
| 4 | BulkCallModal filter `status = 'active'` | **FIXATO** — `.eq("status", "active")` presente |
| 5 | Dashboard `twoHoursAgo` stale | **FIXATO** — `freshTwoHoursAgo` calcolato dentro `queryFn` |
| 6 | Best hour O(n²) | **FIXATO** — frequency map O(n) |

---

## CRITICHE — Ancora presenti

### 1. `contactNameCache` ancora a livello modulo (riga 37)

Il fix pianificato non è stato applicato. La `Map` è dichiarata fuori dal hook come variabile di modulo. Persiste tra navigazioni, logout e cambi utente. Rischio di data leakage cross-tenant.

**Fix**: Spostare `contactNameCache` e `getContactName` dentro il hook usando `useRef`, con cleanup al cambio di `companyId`.

### 2. `launch_bulk_calls` — SECURITY DEFINER + `my_company()`

La funzione SQL (riga 20) chiama `my_company()` che internamente usa `auth.uid()`. Con `SECURITY DEFINER`, la funzione gira come `postgres` owner — `auth.uid()` potrebbe restituire NULL, facendo fallire il check `p_company_id != my_company()` per tutti gli utenti.

**Fix**: Sostituire `my_company()` con un check basato su un parametro `p_user_id` passato dal client, oppure rimuovere il check (la validazione è già implicita via `contacts.company_id = p_company_id` + RLS a livello di query frontend).

### 3. `execute-scheduled-calls` — `CRON_SECRET` non ancora configurato

Il codice controlla `CRON_SECRET` ma con la condizione `if (cronSecret && ...)` — se il secret non è mai stato aggiunto come variabile d'ambiente (cosa che non è stata completata nel ciclo precedente), il check viene bypassato completamente e la funzione resta pubblica.

**Fix**: Configurare il secret `CRON_SECRET` nelle variabili d'ambiente Supabase.

### 4. `CallMonitor` — `twoHoursAgo` stale

`src/pages/app/CallMonitor.tsx` riga 101: `twoHoursAgo` è calcolato fuori dalla `queryFn`, diventa stale se l'utente tiene la pagina aperta. Lo stesso fix applicato alla Dashboard non è stato replicato qui.

**Fix**: Spostare il calcolo dentro la `queryFn`.

---

## MEDIE

### 5. Dashboard — `startOfMonth` / `startOfPrevMonth` ricalcolati ad ogni render

Righe 71-90: queste `Date` sono create nel body del componente, quindi ricalcolate ad ogni render. Non è un bug funzionale ma è fragile e potrebbe causare re-render inutili se usate in futuro come dependency.

**Fix**: Wrappare in `useMemo`.

### 6. Dual Realtime channels su `outbound_call_log`

`Shell.tsx` monta `useCallNotifications` (channel per toasts) e `Dashboard.tsx` crea un secondo channel sulla stessa tabella/company. Duplicazione connessioni Realtime.

**Fix**: Accettabile (basso impatto) oppure consolidare i due canali in uno.

### 7. `launch_bulk_calls` — `p_agent_id` è TEXT, non UUID

Il parametro accetta qualsiasi stringa. Se non è un UUID valido, l'insert in `scheduled_calls` fallirà con errore poco chiaro.

**Fix**: Cambiare tipo a `UUID`.

---

## Piano di Fix

| File | Azione |
|------|--------|
| `src/hooks/useCallNotifications.ts` | Spostare cache in `useRef` + cleanup su `companyId` change |
| `src/pages/app/CallMonitor.tsx` | Spostare `twoHoursAgo` dentro `queryFn` |
| `supabase/migrations/new` | Fix `launch_bulk_calls`: rimuovere `my_company()` check, cambiare `p_agent_id` a UUID |
| Configurazione secrets | Aggiungere `CRON_SECRET` come secret Supabase |

