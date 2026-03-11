

## Agents List & Detail UX Overhaul

### Current Problems

**Agent List (`Agents.tsx` + `AgentCard.tsx`):**
1. Cards show too many competing signals on one line: status dot + type badge (uppercase mono) + name — all crammed horizontally
2. `MoreVertical` icon suggests a menu but does nothing — dead UI element
3. "Da: qualifica_infissi" shows raw slug, not a human label
4. Metrics row shows "0 chiamate · 0/mese" for new agents — zero-value noise
5. Filter labels are decent but "Tutti i tipi" / "Tutti gli stati" dropdowns feel hidden; no quick-filter pills for the most common action: "show me what needs attention"
6. Empty filter state is too minimal: "Nessun risultato. Prova a cambiare i filtri." — no reset button
7. Score badge is tiny and cryptic — the circular ring + number means nothing to a non-technical user

**Agent Detail (`AgentDetail.tsx`):**
1. **9 tabs for vocal agents** — massive tab bar that wraps on mobile, overwhelming
2. Tab labels use jargon: "Knowledge Base", "Analytics", "Integrazioni", "Avanzate"
3. "Agente" tab is an editing form — but the header already shows name/status, creating redundancy
4. Sidebar shows raw technical details: "EL Agent ID", "Use Case" slug, "Tipo" raw value
5. "System Prompt" and "Modello LLM" exposed on the main tab — intimidating for business users
6. Score detail shows "BLOCKER" and "pt" weights — developer language
7. Conversations table has 7 columns including "Score", "Sentiment", "Direzione" — too data-dense
8. No summary/overview visible before diving into tabs — user must click around to understand agent state

### Plan

#### 1. Agent Card — Clearer hierarchy, status-first design

- **Status becomes the primary signal**: Replace tiny dot with a readable status pill ("Attivo", "Bozza", "Da completare") positioned top-right
- **Remove MoreVertical** — it's non-functional dead UI
- **Replace raw use_case slug** with human-readable description or remove if description exists
- **Hide zero metrics** — if calls_total is 0, show "Nessuna attività" instead of "0 chiamate"
- **Replace score ring with text label** — show "Pronto", "Da completare" as a simple colored text badge instead of cryptic circular progress
- **Add "needs attention" indicator** — if hasBlockers, show a yellow/red banner strip at bottom: "Configurazione incompleta"

**File:** `src/components/agents/AgentCard.tsx`

#### 2. Agent List — Quick filters + better empty states

- **Add status pill filters** above the search bar: `Tutti | Attivi | Da completare | Bozza` as clickable pills (replace the status Select dropdown)
- **Keep type filter** as a Select but rename items: remove emoji prefix redundancy, use cleaner labels
- **Improve empty filter state**: add a "Reimposta filtri" button
- **Improve page subtitle**: "X agenti attivi · Y in bozza" → also show "Z da completare" count

**File:** `src/pages/app/Agents.tsx`

#### 3. Agent Detail — Reduced tabs, business-first layout

**Reduce tabs from 9 to 5 for vocal agents:**

| New Tab | Contains | Old Tabs Merged |
|---------|----------|-----------------|
| Panoramica | Name, description, sector, status, score checklist, recent stats, quick actions | Header + sidebar stats + score detail |
| Prompt e Voce | System prompt, first message, temperature, voice picker, voice test | Agente (prompt part) + Voce & Test |
| Conversazioni | Simplified conversation table | Conversazioni |
| Risultati | Analytics charts | Analytics |
| Impostazioni | Outbound, phone, integrations, KB, advanced settings — all in collapsible sections | Outbound + Telefono + Integrazioni + Knowledge Base + Avanzate |

**Tab labels updated:**
- "Knowledge Base" → merged into Impostazioni
- "Analytics" → "Risultati"
- "Avanzate" → merged into Impostazioni
- "Integrazioni" → merged into Impostazioni

**For render agents:** 2 tabs (Panoramica, Risultati)
**For WhatsApp agents:** 4 tabs (Panoramica, Prompt e Voce, Conversazioni, Risultati)

#### 4. Agent Detail — New "Panoramica" tab

The first tab becomes a dashboard-style overview:
- **Identity card**: Name (editable inline), description, sector, language — compact
- **Status + Score section**: Large status badge + score checklist (AgentScoreDetail) with improved labels
- **Quick stats**: 3 metric cards (total calls, this month, avg duration) — only shown if > 0
- **Quick actions**: Contextual buttons like "Configura la voce", "Aggiungi documenti" based on incomplete score factors

#### 5. Agent Detail — Simplified sidebar info

- Remove "EL Agent ID" from visible details (move to Impostazioni)
- Remove "Use Case" raw slug
- Replace "Tipo" with the existing type badge already in header
- Keep only business-relevant info visible

#### 6. Conversations table — Simplified

- Remove "Score" and "Sentiment" columns from default view (keep Date, Number, Direction, Duration, Outcome)
- Rename "Direzione" → show just icon (📥/📤) without text
- Rename column headers to simpler Italian

#### 7. Microcopy improvements

| Location | Before | After |
|----------|--------|-------|
| Tab label | "Agente" | "Panoramica" |
| Tab label | "Voce & Test" | "Prompt e Voce" |
| Tab label | "Analytics" | "Risultati" |
| Tab label | "Knowledge Base" | (merged into Impostazioni) |
| Tab label | "Avanzate" | (merged into Impostazioni) |
| Tab label | "Integrazioni" | (merged into Impostazioni) |
| Tab label | "Chiamate Uscenti" | (merged into Impostazioni) |
| Section heading | "Identità" | "Il tuo agente" |
| Section heading | "Prompt & Conversazione" | "Comportamento" |
| Label | "System Prompt" | "Istruzioni" |
| Label | "Primo messaggio" | "Messaggio di apertura" |
| Label | "Temperatura" | "Stile risposte" |
| Label | "Modello LLM" | "Modello AI" |
| Score label | "BLOCKER" | "Obbligatorio" |
| Score label | "fattori completati" | "passaggi completati" |
| Score weight | "20pt" | (remove — not useful to business users) |
| Detail label | "EL Agent ID" | (hidden) |
| Agent status | "draft" | "Bozza" |
| Agent status | "inactive" | "Inattivo" |
| Card metric | "0 chiamate" | "Nessuna attività" |
| Filter | "Tutti gli stati" | replaced by pills |

#### 8. Score Detail — Business-friendly language

- Remove "pt" weight display
- Replace "BLOCKER" with "Obbligatorio" in a softer style
- Replace "fattori completati" with "passaggi completati"
- Replace "blocker" count badge with "X passaggi obbligatori mancanti"

### Files Modified

1. **`src/components/agents/AgentCard.tsx`** — Status-first design, remove dead UI, hide zero metrics, readable score label
2. **`src/pages/app/Agents.tsx`** — Status pill filters, improved empty states, better subtitle
3. **`src/pages/app/AgentDetail.tsx`** — Reduce to 5 tabs, new Panoramica tab, merge settings tabs, simplified conversations table, business-oriented microcopy
4. **`src/components/agents/AgentScoreDetail.tsx`** — Remove "pt", replace "BLOCKER" with "Obbligatorio", friendlier language
5. **`src/components/agents/AgentScoreBadge.tsx`** — Show text label instead of just number in card context

