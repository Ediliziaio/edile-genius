

# Analisi Completa: Spec vs Implementazione — Gaps Trovati

Ho analizzato il documento spec completo contro il codice attuale. Il sistema e funzionalmente implementato (DB, routing, wizard, edge functions, superadmin), ma ci sono gap significativi rispetto alla spec originale.

---

## Stato Attuale — Cosa FUNZIONA

| Componente | Stato |
|---|---|
| 4 tabelle DB + RLS + seed template | OK |
| Routing `/app/templates`, `/:slug`, `/:slug/setup` | OK |
| Sidebar con sezione AUTOMAZIONI | OK |
| Catalogo template con filtri e "coming soon" cards | OK |
| Dettaglio template con flow visuale e preview report | OK |
| Wizard 5 step (personalizza, operai, destinatari, canali, attiva) | OK |
| Edge function `deploy-template-instance` | OK |
| Edge function `generate-report` | OK (placeholder) |
| Edge function `save-report` | OK |
| SuperAdmin CRUD template | OK |

---

## Gaps Critici da Risolvere

### 1. RLS Policies: RESTRICTIVE invece di PERMISSIVE
Le policy attuali sono tutte `Permissive: No` (RESTRICTIVE). Con RESTRICTIVE, **tutte** le policy devono passare, il che significa che un superadmin non riesce a leggere un template non pubblicato se `co_templates_select` richiede `is_published = true`. Bisogna convertire in PERMISSIVE (il default di PostgreSQL) tramite migration.

### 2. `increment_installs_count` — Funzione DB mancante
L'edge function `deploy-template-instance` chiama `serviceClient.rpc("increment_installs_count", ...)` ma questa funzione non esiste nel DB. Ha un fallback ma il fallback non fa `await`, quindi potrebbe non completarsi. Serve creare la funzione DB.

### 3. CORS Headers incompleti nelle Edge Functions
Le edge functions usano CORS headers minimi. Mancano: `x-supabase-client-platform`, `x-supabase-client-platform-version`, `x-supabase-client-runtime`, `x-supabase-client-runtime-version`. Questo puo causare errori CORS quando chiamate dal client Supabase.

### 4. Wizard Step 4 (Canali) — Molto semplificato rispetto alla spec
**Spec richiede**: selettore Twilio/Meta Cloud API con form credenziali, verifica connessione, link condivisione Telegram bot.
**Attuale**: mostra solo stato WA collegato/non collegato con link a `/app/whatsapp`, form basico Telegram senza verifica. Non salva il bot Telegram in `company_channels`.

### 5. Wizard Step 5 — Mancano elementi della spec
- **Stima costi mensile** e **crediti disponibili** non mostrati
- **Test prima di attivare** (invio messaggio test al proprio telefono) non implementato
- **Deploy steps**: la spec richiede 4 step visibili (ElevenLabs, n8n, canali, scheduling), l'attuale ne mostra solo 2 generici
- **Confetti animation** e redirect a `/app/my-agents` mancante (va a `/app/agents`)

### 6. Step 3 (Destinatari) — Anteprima email mancante
La spec richiede un mockup email HTML completo sotto la lista destinatari. Non implementato.

### 7. Step 2 (Operai) — Importa CSV mancante
La spec include un bottone "Importa da CSV" con template scaricabile. Non implementato.

### 8. `generate-report` — Logica AI non implementata
Attualmente usa semplice regex parsing. La spec prevede integrazione con Claude/AI per estrarre dati strutturati dalla trascrizione. OK come placeholder ma va documentato come "TODO".

### 9. SuperAdmin sidebar — Mancano link template
La sidebar superadmin non ha il link a `/superadmin/templates`. I template sono accessibili solo via URL diretto.

### 10. n8n Workflow JSON — Non presente nel seed
Il campo `n8n_workflow_json` del template seed e `null`. Serve il JSON completo del workflow n8n come descritto nella spec (section 7), altrimenti il deploy non crea alcun workflow.

---

## Piano di Fix

### Migration SQL
- Ricreare le RLS policies come PERMISSIVE (drop + recreate)
- Creare funzione `increment_installs_count(tpl_id UUID)`

### Edge Functions (CORS fix)
- Aggiornare `corsHeaders` in tutte e 3 le edge functions con i header completi

### Wizard miglioramenti
- Step 2: aggiungere bottone "Importa da CSV" (modal + parser)
- Step 3: aggiungere mockup email preview
- Step 4: salvare bot Telegram in `company_channels` quando compilato
- Step 5: aggiungere stima mensile, crediti disponibili, sezione test, 4 deploy steps, redirect corretto

### Sidebar superadmin
- Aggiungere "Template" nella sidebar superadmin

### Seed update
- Aggiungere `n8n_workflow_json` al seed template (o almeno un JSON base)

---

Sono circa 10 fix. Vuoi che proceda con l'implementazione di tutti questi gap in ordine di priorita?

