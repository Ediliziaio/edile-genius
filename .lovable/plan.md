

# Piano di Fix Completo — Edile Genius

Questo piano copre tutti gli 11 prompt di fix richiesti, organizzati in 4 batch per priorità. Data la dimensione (100+ fix individuali), ogni batch sarà implementato separatamente.

---

## Batch 1 — Fix Critici (Crash + Sicurezza)

### 1.1 Fix Preventivi — Crash `scontoGlobaleImporto` (Prompt 2)
**`src/pages/app/NuovoPreventivo.tsx`**
- Aggiungere variabile derivata mancante: `const scontoGlobaleImporto = Number((subtotale * scontoGlobalePerc / 100).toFixed(2))` prima di `saveVoci`
- Usare `Number(...toFixed(2))` in tutti i calcoli monetari
- Leggere IVA da `templateConfig?.iva_percentuale_default || 22` invece di hardcodare 22%
- Validare MIME type audio (`file.type.startsWith('audio/')`)
- Revocare vecchi `URL.createObjectURL` prima di crearne nuovi

**`src/pages/app/PreventivoDetail.tsx`**
- Usare `.maybeSingle()` con redirect se null
- Spostare normalizzazione voci in `useMemo`
- Aggiungere bottone "Rinvia" per stato "inviato"

### 1.2 Fix Navigazione — Route 404 (Prompt 10)
**`src/components/layout/SidebarNav.tsx`**
- Il path `/app/automations` è già corretto (verificato nel codice). Nessun mismatch
- Fix `isItemActive`: cambiare da `startsWith(href)` a match esatto + `startsWith(href + '/')`
- Fix `creditInfo.balance_eur.toFixed(2)` → `Number(creditInfo?.balance_eur ?? 0).toFixed(2)`
- Aggiungere voce "Integrazioni" nella sezione IMPOSTAZIONI
- Aggiungere voce "Template Preventivo" nella sezione VENDITE AVANZATE

### 1.3 Fix Edge Functions — Sicurezza Webhook (Prompt 11)
**`supabase/functions/whatsapp-webhook/index.ts`**
- Aggiungere verifica `X-Hub-Signature-256` con HMAC SHA-256 e timing-safe comparison

**`supabase/functions/ai-orchestrator/index.ts`**
- Guard divisione per zero nel burn rate

**`src/pages/app/Dashboard.tsx`**
- Guard `daySpan > 0` nel burn rate (già presente ma rafforzare)
- Guard `daysRemaining` contro `NaN`/`Infinity`

### 1.4 Fix Documenti — Crash null reference (Prompt 4)
**`src/pages/app/DocumentiScadenze.tsx`**
- Optional chaining su `doc.cantiere_operai?.nome`
- Validazione `data_scadenza > data_emissione` nel form
- Usare `differenceInDays` da date-fns per `getDaysLeft`
- Usare `useMemo` per i contatori

---

## Batch 2 — Fix Alta Priorità (UX Rotta)

### 2.1 Fix Cantieri (Prompt 1)
**`src/pages/app/Cantieri.tsx`**
- Calcolo reale `report_count` con una singola query aggregata (eliminare N+1)
- Error handling con toast sulla fetch
- Skeleton loading
- Validazione email e date nel form di creazione

**`src/pages/app/CantiereDetail.tsx`**
- Optional chaining su `ruolo?.toLowerCase()`
- Aggiungere `id` all'array di dipendenze dell'useEffect per `dateFilter`
- Badge colorati per stato operaio

**`src/components/cantieri/ReportDetailModal.tsx`**
- Try-catch su `new Date(r.email_inviata_at)`
- Lightbox foto con navigazione prev/next

### 2.2 Fix Dashboard + Automations (Prompt 5)
**Centralizzare `SMART_ACTIONS_DEFAULTS`**
- Creare `src/lib/automation-defaults.ts` con export della costante
- Importare da lì in entrambi Dashboard e Automations

**`src/pages/app/Dashboard.tsx`**
- Guard `if (!res.ok) throw new Error(...)` sulla risposta briefing
- Bottone "Riprova" se briefing fallisce
- Link navigabili dalle azioni del briefing

**`src/pages/app/Automations.tsx`**
- Disabilitare toggle durante salvataggio
- Paginazione log (limit 50 + "Carica altri")

---

## Batch 3 — Fix Media Priorità

### 3.1 Fix Template PDF (Prompt 3)
- `createStyles` fuori dal componente o in `useMemo`
- Validazione tipo file per upload logo
- Watermark "BOZZA" nel PDF

### 3.2 Fix Agenti (Prompt 6)
- Toggle outbound con stato `saving`
- Validazione formato E.164 per numeri telefono
- Filtro `status = 'active'` nelle query agenti

### 3.3 Fix Campagne + Contatti (Prompt 7)
- Guard divisione per zero nella progress bar campagna
- Limit + paginazione per contatti
- CSV escape virgolette

### 3.4 Fix Analytics (Prompt 8)
- Aggiungere `.limit(1000)` alla query
- Guard `topOutcome` undefined
- Filtro per agente

### 3.5 Fix Foglio Presenze (Prompt 4 - parte 2)
- Range anni dinamico
- Commento esplicativo per calcolo giorni mese

---

## Batch 4 — Fix Bassa Priorità

### 4.1 Fix Settings + Integrations (Prompt 9)
- `useCallback` per `loadCrmIntegrations`
- Limit su query `webhook_logs`
- Fix href vuoti nelle integrazioni
- Tab Billing funzionante

### 4.2 Migration DB (Prompt 11 - parte 2)
- Indice su `campaign_contacts(campaign_id, status)`
- Fix `topup_credits` per gestire `blocked_reason = 'low_balance'`

---

## Ordine di implementazione

Data la dimensione, implementerò un batch alla volta. **Batch 1** contiene tutti i fix che causano crash runtime o vulnerabilità di sicurezza — è la priorità assoluta.

**File principali modificati per Batch 1:**
| File | Modifiche |
|---|---|
| `src/pages/app/NuovoPreventivo.tsx` | Fix calcolo totali, IVA, validazioni |
| `src/pages/app/PreventivoDetail.tsx` | maybeSingle, useMemo, rinvio |
| `src/pages/app/DocumentiScadenze.tsx` | Optional chaining, validazione, useMemo |
| `src/pages/app/Dashboard.tsx` | Guard NaN, retry briefing, import centralizzato |
| `src/components/layout/SidebarNav.tsx` | Fix active match, null guard, voci mancanti |
| `src/lib/automation-defaults.ts` | Nuovo file — costanti centralizzate |
| `supabase/functions/whatsapp-webhook/index.ts` | Verifica HMAC |
| `supabase/functions/ai-orchestrator/index.ts` | Guard divisione zero |

Procederò con il **Batch 1** (fix critici) appena approvato.

