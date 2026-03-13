

# Audit Bug AI Systems — Agenti, Webhook, Campagne, KB, Briefing, Automazioni

## Sistemi analizzati
- **Webhook post-call** (elevenlabs-webhook)
- **Call Analysis** (summary.ts)
- **Post-Call Actions** (post-call-actions.ts)
- **Campaign Batch** (run-campaign-batch)
- **Scheduled Calls** (execute-scheduled-calls)
- **Knowledge Base** (add-knowledge-doc + frontend)
- **Morning Briefing** (ai-morning-briefing)
- **Follow-up Generator** (generate-followup)
- **Credit Check** (check-credits-before-call)
- **Conversation Token** (elevenlabs-conversation-token)
- **Automations UI** (Automations.tsx)
- **Agents UI** (Agents.tsx)
- **Voice Test** (VoiceTestPanel.tsx)
- **Analytics** (Analytics.tsx)

---

## BUG CRITICI

### 1. `summary.ts` — usa `OPENAI_API_KEY` che NON è nei secrets
`generateCallAnalysis` (riga 23) richiede `OPENAI_API_KEY`, ma nei secrets configurati c'è solo `LOVABLE_API_KEY`. Risultato: **tutte le analisi post-call falliscono silenziosamente**, restituendo `{ summary: null, outcome_ai: null, ... }`. Nessun summary, nessun outcome automatico, nessun next_step viene mai generato. Le conversazioni restano senza classificazione AI.

**Fix**: Migrare `generateCallAnalysis` per usare `LOVABLE_API_KEY` + Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) con modello `google/gemini-2.5-flash`.

### 2. `generate-followup` — usa `OPENAI_API_KEY` che NON è nei secrets
Stesso problema: riga 25 richiede `OPENAI_API_KEY`. La generazione dei messaggi follow-up è completamente rotta.

**Fix**: Migrare a Lovable AI Gateway.

### 3. `post-call-actions.ts` — doppio update del contatto, risultati in conflitto
Il webhook chiama sia `process_post_call_atomic` (con `outcomeAi` dall'analisi AI) sia `update_contact_after_call` (con un outcome derivato da `callStatus`/`durationSeconds`). Questi due update si sovrascrivono. Il secondo (riga 134-143) usa la logica semplice `determineOutcome()` che classifica tutto come "answered" o "no_answer", sovrascrivendo il risultato AI più accurato già salvato dal primo RPC.

**Fix**: Rimuovere la chiamata a `update_contact_after_call` quando `outcomeAi` è già stato processato da `process_post_call_atomic`, oppure condizionarla a `!outcomeAi`.

### 4. `post-call-actions.ts` — `transcript` e `durationSeconds` non passati dal webhook
Il webhook (riga 174-181) chiama `runPostCallActions` senza `transcript`, `durationSeconds`, `agentId`, e `callStatus`. Quindi `analyzeSentiment()` riceve un array vuoto (restituisce "unknown"), e `determineOutcome()` riceve `undefined` (restituisce "answered" di default). Il CRM update è basato su dati fittizi.

**Fix**: Passare `transcript`, `durationSeconds`, `agentId: agent.id`, e `callStatus` nella chiamata a `runPostCallActions`.

### 5. `VoiceTestPanel` — credit check error handling invertita
Righe 38-50: quando `supabase.functions.invoke` fallisce con un errore, il codice controlla `error` ma poi legge `data` che potrebbe essere null. In caso di 402 (crediti insufficienti), l'`invoke` potrebbe settare `error` con il body della risposta, e `data` sarà null. Il check `if (!errData.allowed && errData.allowed !== undefined)` non matcherà perché `errData` è `{}`.

**Fix**: Parsare correttamente il body dell'errore 402 dall'oggetto `error` di invoke.

---

## BUG MEDI

### 6. `Agents.tsx` — console warning: ref su Select component
Il console log mostra "Function components cannot be given refs" dal `<Select>` in AgentsPage (riga 112). Il `Select` di Radix non supporta ref diretto.

**Fix**: Avvolgere il `Select` senza passare ref, o wrappare con `forwardRef` se necessario.

### 7. `Analytics.tsx` — query limitata a 1000 conversazioni senza paginazione
Riga 28: `.limit(1000)`. Per aziende con molte conversazioni, i dati analitici sono troncati senza avviso all'utente (il flag `isTruncated` è calcolato ma mai mostrato nella UI).

**Fix**: Mostrare un banner "Dati parziali: ultime 1000 conversazioni" quando `isTruncated` è true.

### 8. `run-campaign-batch` — nessuna verifica DNC prima della chiamata
Il batch carica i contatti (riga 149) senza filtrare `do_not_call = true`. I contatti DNC vengono chiamati lo stesso. Solo `execute-scheduled-calls` e `launch_bulk_calls` verificano DNC.

**Fix**: Aggiungere `.eq('do_not_call', false)` alla query contatti o verificare nel loop.

### 9. `KnowledgeBase.tsx` — `filterAgent` inizializzato a `"all"` ma i documenti globali usano `agent_id = null`
Riga 121-122: `if (filterAgent === "global" && d.agent_id !== null) return false` — il filtro "global" funziona, ma il dropdown non ha un'opzione per mostrare SOLO i documenti globali vs quelli assegnati. L'utente non ha modo di filtrare per "solo globali" perché il default è `"all"`.

Non è un bug critico ma la UX è confusa.

### 10. `Automations.tsx` — cast `as any` su tabelle e insert
Righe 229, 246-247: usa `as any` per `ai_orchestrator_log` e `agent_automations.insert`. Se le tabelle non sono nel types.ts generato, le query silenziosamente falliscono o restituiscono dati errati senza type checking.

---

## BUG MINORI

### 11. `check-credits-before-call` — TTS model default mismatch
Riga 64: usa `eleven_turbo_v2_5` come default TTS, ma il webhook (riga 99) usa `eleven_multilingual_v2`. Se il record `platform_pricing` non ha il combo esatto, il pre-check fallisce con "pricing_unavailable" anche se i crediti sono sufficienti.

**Fix**: Allineare i default TTS model tra i due endpoint.

### 12. `elevenlabs-conversation-token` — nessuna verifica tenant
L'endpoint genera un token per qualsiasi `agent_id` passato, senza verificare che l'agente appartenga alla company dell'utente. Un utente potrebbe testare agenti di altre company.

**Fix**: Verificare ownership dell'agente prima di generare il token.

---

## Piano di implementazione

### Fase 1 — Fix critici backend
1. **`supabase/functions/elevenlabs-webhook/summary.ts`**: Migrare da OpenAI a Lovable AI Gateway (`LOVABLE_API_KEY` + `google/gemini-2.5-flash`)
2. **`supabase/functions/generate-followup/index.ts`**: Migrare da OpenAI a Lovable AI Gateway
3. **`supabase/functions/elevenlabs-webhook/post-call-actions.ts`**: Condizionare `update_contact_after_call` a `!outcomeAi`, evitando doppio update
4. **`supabase/functions/elevenlabs-webhook/index.ts`**: Passare `transcript`, `durationSeconds`, `agentId`, `callStatus` a `runPostCallActions`

### Fase 2 — Fix medi
5. **`supabase/functions/run-campaign-batch/index.ts`**: Aggiungere filtro DNC nella query contatti
6. **`supabase/functions/check-credits-before-call/index.ts`**: Allineare default TTS model a `eleven_multilingual_v2`
7. **`supabase/functions/elevenlabs-conversation-token/index.ts`**: Aggiungere verifica tenant sull'agent_id
8. **`src/components/agents/VoiceTestPanel.tsx`**: Fix parsing errore 402 dal credit check

### Fase 3 — Fix frontend
9. **`src/pages/app/Analytics.tsx`**: Mostrare banner "dati parziali" quando `isTruncated`
10. **`src/pages/app/Agents.tsx`**: Risolvere warning ref su Select

### File da modificare
- `supabase/functions/elevenlabs-webhook/summary.ts`
- `supabase/functions/elevenlabs-webhook/post-call-actions.ts`
- `supabase/functions/elevenlabs-webhook/index.ts`
- `supabase/functions/generate-followup/index.ts`
- `supabase/functions/run-campaign-batch/index.ts`
- `supabase/functions/check-credits-before-call/index.ts`
- `supabase/functions/elevenlabs-conversation-token/index.ts`
- `src/components/agents/VoiceTestPanel.tsx`
- `src/pages/app/Analytics.tsx`
- `src/pages/app/Agents.tsx`

