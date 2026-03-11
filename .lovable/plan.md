

## Onboarding & Wizard UX Simplification

### Current Problems

**Wizard Step 0 (StepAgent) — Critical overload:**
- 11 distinct form sections crammed into one screen: use case selector grid, name, sector, description, language, LLM model, additional languages, 6 quick templates, system prompt (180px textarea), first message, temperature slider
- A non-technical user who already chose a template from the hub sees all of this — most of it pre-filled and irrelevant to them
- System prompt editing exposed by default is intimidating

**5-step wizard is excessive:**
- StepConversation (turn timeout, eagerness, interruptions) and StepAdvanced (KB, custom tools, PII, webhooks) are developer settings. 90% of users will never touch them.
- For a user who picked a pre-configured template, the real flow is: Name it → Pick voice → Activate

**Technical jargon throughout:**
- Sidebar: "Flusso e timeout", "KB, Tools e Guardrails"
- Labels: "System Prompt", "Turn Timeout", "Turn Eagerness", "LLM Model", "PII Redaction"
- Hub: "Scegli il tipo di agente" (technology-oriented, not goal-oriented)

**CreateAgent hub:**
- Header says "Scegli il tipo di agente" — should say what result they'll get
- CTA "Configura →" sounds like work, not progress

### Plan

#### 1. Simplify StepAgent — Essential fields only, rest collapsed

Show by default:
- Name (with better placeholder: "Es. Mario - Qualificatore Lead")
- Description (optional, shorter)
- Sector (kept, important for vertical)

Move to a collapsible "Personalizza il comportamento" section (closed by default when template pre-fills):
- Use case selector grid
- System prompt textarea
- First message textarea
- Quick templates Edilizia
- Temperature slider
- LLM model select
- Language + additional languages

This way, template users see 3 fields. Power users can expand.

**Files:** `src/components/agents/create/StepAgent.tsx`

#### 2. Reduce wizard from 5 to 4 steps — Merge Conversation + Advanced

New step structure:
| # | Label | Sublabel | Content |
|---|-------|----------|---------|
| 0 | Il Tuo Agente | Nome e personalità | Simplified StepAgent |
| 1 | Voce | Come parla il tuo agente | StepVoice (unchanged) |
| 2 | Impostazioni | Opzioni avanzate | Merged Conversation + Advanced in collapsible sections |
| 3 | Rivedi e Attiva | Controlla e pubblica | StepReview (simplified) |

The merged step shows 3 collapsible sections: "Comportamento conversazione", "Archivio conoscenze", "Sicurezza e privacy" — all collapsed by default with sensible defaults already set.

**Files:** `src/components/agents/create/AgentStepSidebar.tsx`, `src/pages/app/AgentTemplateWizard.tsx`, new `src/components/agents/create/StepSettings.tsx`

#### 3. Business-oriented microcopy throughout

**Sidebar step labels:**
- "Agente" → "Il Tuo Agente"
- "Voce" → "Scegli la Voce"  
- "Conversazione" + "Avanzate" → "Impostazioni"
- "Revisione & Test" → "Rivedi e Attiva"

**StepAgent:**
- "Identità Agente" → "Come si chiama il tuo agente?"
- "System Prompt" → "Istruzioni di comportamento"
- "Primo Messaggio" → "Messaggio di apertura"
- "Temperatura" → "Stile risposte"

**StepConversation (now inside Settings):**
- "Turn Timeout" → "Tempo di attesa risposta"
- "Reattività turno" → "Velocità di risposta"
- "System Tools" → "Comportamento automatico"
- "Language Detection" → "Rilevamento lingua automatico"

**StepAdvanced (now inside Settings):**
- "Knowledge Base" → "Archivio documenti"
- "Custom Tools" → "Integrazioni esterne"
- "Guardrails & Safety" → "Sicurezza e privacy"
- "PII Redaction" → "Protezione dati sensibili"
- "Data Retention" → "Salva conversazioni"

**Files:** All step components + sidebar

#### 4. CreateAgent hub — Goal-oriented header and CTAs

- "Scegli il tipo di agente" → "Cosa vuoi automatizzare?"
- Subtitle: "Agenti AI pre-configurati..." → "Scegli un obiettivo e attiva il tuo agente in pochi minuti."
- "Configura →" → "Inizia →"
- "Cerca template..." → "Cerca per obiettivo..."

**File:** `src/pages/app/CreateAgent.tsx`

#### 5. Wizard header simplification

- "Crea Agente" → "Configura il tuo agente"
- "Configura il tuo agente AI con voce naturale" → "Completa i dati essenziali per attivarlo"
- Back button: "Scegli Template" → "← Torna ai template"

**File:** `src/pages/app/AgentTemplateWizard.tsx`

#### 6. StepReview simplification

- Remove technical summary rows (Voice ID hash, stability/similarity decimals, turn timeout seconds)
- Keep only: Name, Sector, Language, Model, Voice preview, KB files count
- Prominently show the publish toggle at the top instead of buried at the bottom
- Simplify "Crea Bozza e Testa" → "Prova il tuo agente"

**File:** `src/components/agents/create/StepReview.tsx`

### Files Modified Summary

1. `src/components/agents/create/StepAgent.tsx` — Collapse advanced fields, simplify labels
2. `src/components/agents/create/AgentStepSidebar.tsx` — 4 steps, business labels
3. `src/pages/app/AgentTemplateWizard.tsx` — Update step count, header copy, step rendering
4. `src/components/agents/create/StepSettings.tsx` — New: merged Conversation + Advanced
5. `src/components/agents/create/StepReview.tsx` — Simplified summary, reordered sections
6. `src/pages/app/CreateAgent.tsx` — Goal-oriented header/CTAs
7. `src/components/agents/create/StepConversation.tsx` — Kept but used inside StepSettings
8. `src/components/agents/create/StepAdvanced.tsx` — Kept but used inside StepSettings

