

# Analisi Criticità Sistema — Edile Genius

## Riepilogo

Dopo un'analisi approfondita del codice frontend, edge functions, migrazioni SQL e tipi Supabase, ho identificato le seguenti criticità organizzate per gravità.

---

## CRITICHE (possono causare bug in produzione)

### 1. `launch_bulk_calls` — SECURITY DEFINER + `my_company()` potenziale conflitto

La funzione SQL usa `SECURITY DEFINER` ma anche `my_company()` per la validazione. Con `SECURITY DEFINER` la funzione gira come owner (tipicamente `postgres`), quindi `my_company()` potrebbe non risolvere correttamente perché `auth.uid()` dentro un contesto SECURITY DEFINER potrebbe restituire NULL o l'uid sbagliato. La validazione `p_company_id != my_company()` potrebbe fallire sempre, bloccando tutti gli utenti.

**Fix**: Testare il comportamento di `my_company()` dentro SECURITY DEFINER. Se fallisce, rimuovere il check `my_company()` e fare il check a livello RPC caller (già fatto via RLS su `contacts`), oppure passare l'uid come parametro e validare internamente.

### 2. `execute-scheduled-calls` — Nessuna autenticazione

La edge function usa direttamente `SUPABASE_SERVICE_ROLE_KEY` senza alcuna validazione dell'origine della richiesta. Chiunque conosca l'URL può triggerare l'esecuzione di tutte le chiamate pending. Con `verify_jwt = false` nel config.toml, è completamente esposta.

**Fix**: Aggiungere validazione — o un secret header custom, o limitare l'invocazione solo da pg_cron/interno.

### 3. `elevenlabs-outbound-call` — Auth bypassa company_id check

La funzione verifica l'autenticazione dell'utente (`getUser`) ma non verifica che l'`agent_id` fornito appartenga alla company dell'utente. Qualsiasi utente autenticato potrebbe potenzialmente lanciare chiamate con l'agente di un'altra company.

**Fix**: Dopo aver recuperato l'agente, verificare che `agent.company_id` corrisponda alla company dell'utente autenticato.

### 4. `contactNameCache` — Memory leak globale

In `useCallNotifications.ts`, la cache `contactNameCache` è un `Map` a livello modulo (fuori dal componente). Non viene mai ripulita completamente al logout/cambio utente. Potrebbe mostrare nomi di contatti di un'azienda a un utente di un'altra azienda dopo un cambio sessione.

**Fix**: Spostare la cache dentro il hook con `useRef`, o pulirla al cambio di `companyId`.

---

## MEDIE (UX/performance/robustezza)

### 5. Dashboard — `twoHoursAgo` calcolato fuori dal componente

```
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
```

Questa variabile è calcolata al primo render e mai aggiornata. Se l'utente tiene la dashboard aperta per ore, il filtro diventa stale e potrebbe mostrare chiamate "attive" vecchie di 4+ ore.

**Fix**: Spostare dentro `queryFn` o usare `useMemo` con dipendenza temporale.

### 6. Dashboard — `startOfMonth` calcolato fuori da useMemo

Le variabili `startOfMonth` e `startOfPrevMonth` sono calcolate a ogni render (non memoizzate), creando nuovi oggetti `Date` ad ogni re-render, il che potrebbe causare re-fetch inutili se usate come query key dependencies (anche se attualmente non lo sono direttamente, è fragile).

### 7. `CallAnalyticsSection` — Best Hour calculation è O(n²)

```typescript
positiveHours.sort((a, b) =>
  positiveHours.filter(v => v === a).length - positiveHours.filter(v => v === b).length
).pop()
```

Questo è O(n²) per ogni elemento nel sort. Con 500 call logs e molte ore positive, è lento. Meglio usare una frequency map.

### 8. BulkCallModal — `agents` query non filtra per `status = 'active'`

Mostra anche agenti in `draft` o `inactive` purché abbiano `outbound_enabled = true`. Un utente potrebbe selezionare un agente non ancora configurato per il bulk calling.

**Fix**: Aggiungere `.eq("status", "active")` alla query.

### 9. Dual Realtime channels sulla Dashboard

La Dashboard crea un channel Realtime per le active calls. Contemporaneamente, `useCallNotifications` in Shell.tsx ascolta la stessa tabella `outbound_call_log`. Sono 2 subscription Realtime sulla stessa tabella per lo stesso utente — raddoppia il consumo di connessioni Realtime.

**Fix**: Consolidare in un unico channel, o accettare il costo (è comunque basso).

---

## BASSE (pulizia / robustezza marginale)

### 10. `launch_bulk_calls` — `p_agent_id` è TEXT, non UUID

Nel SQL l'agent_id è `TEXT`, ma nella tabella `scheduled_calls` è `string` (UUID FK). Se qualcuno passa un valore non-UUID, l'insert fallirà con un errore poco chiaro. Dovrebbe essere `UUID`.

### 11. Tipo Supabase mancante per `launch_bulk_calls`

I tipi generati includono `launch_bulk_calls` ma il return type è `Json` (generico). Il frontend fa `as unknown as BulkCallResult` — fragile ma funzionante.

### 12. `outbound_call_log` non ha `duration_seconds` — solo `duration_sec`

Coerente: il frontend usa correttamente `duration_sec`. Nessun bug, ma il webhook edge function usa `duration_seconds` (dal payload ElevenLabs) e lo mappa a `duration_sec` nel DB — corretto.

---

## Priorità Fix Consigliata

| # | Criticità | Effort |
|---|-----------|--------|
| 3 | Auth company check in outbound-call | 5 min |
| 2 | Auth su execute-scheduled-calls | 10 min |
| 4 | contactNameCache memory leak | 5 min |
| 1 | SECURITY DEFINER + my_company() | 15 min (test needed) |
| 8 | Filtro status active in BulkCallModal | 2 min |
| 5 | twoHoursAgo stale | 2 min |
| 7 | Best hour O(n²) | 5 min |

