

## Template Library Overhaul — Vertical, Commercial, Market-Ready

### Audit of Current State

**Problems found:**

1. **USE_CASES are generic** — "Chiamate in entrata", "Assistenza clienti", "Sondaggi telefonici" could be for any industry. Zero differentiation.
2. **Descriptions are technical** — "Rispondi alle chiamate dei clienti" says nothing about value. An imprenditore edile won't feel urgency.
3. **Missing high-value use cases** — No template for: lead da campagne Meta/Google, recupero no-show sopralluogo, assistente showroom, supporto pratiche ENEA, agente WhatsApp commerciale per preventivi.
4. **EDILIZIA_PROMPT_TEMPLATES has only 3 entries** — The "quick templates" section is underpowered.
5. **Prompts are shallow** — The system prompts lack the detail that makes an agent actually work (no objection handling, no data collection schema, no escalation rules).
6. **Two template systems with overlap** — `Templates.tsx` (DB-backed) and `CreateAgent.tsx` (static hub) show different templates. The hub is the real entry point.
7. **"Sondaggi telefonici" is dead weight** — No edilizia company runs phone surveys. Replace with something monetizable.

### New Template Library (15 templates, replacing current 9 static)

Organized by **commercial intent** rather than channel:

| # | Slug | Name | Category | Channel | Sector | Prompt Quality |
|---|------|------|----------|---------|--------|---------------|
| 1 | `vocale-custom` | Agente Vocale Personalizzato | vocali | vocale | Tutti | Existing (keep) |
| 2 | `qualifica-infissi` | Qualificatore Lead Infissi | vocali | vocale | Serramenti | New detailed prompt |
| 3 | `qualifica-ristrutturazione` | Qualificatore Ristrutturazione | vocali | vocale | Ristrutturazioni | New |
| 4 | `qualifica-fotovoltaico` | Qualificatore Fotovoltaico | vocali | vocale | Fotovoltaico | New |
| 5 | `inbound-campagne` | Risponditore Campagne Ads | vocali | vocale | Tutti | New — handles Meta/Google ad leads |
| 6 | `conferma-sopralluogo` | Conferma Sopralluogo | vocali | vocale | Tutti | Improved from existing |
| 7 | `recupero-preventivi` | Recupero Preventivi Scaduti | vocali | vocale | Tutti | Improved from existing |
| 8 | `recupero-noshow` | Recupero No-Show | vocali | vocale | Tutti | New |
| 9 | `recensioni-post-lavoro` | Raccolta Recensioni Google | vocali | vocale | Tutti | Improved |
| 10 | `assistente-whatsapp` | Assistente WhatsApp Commerciale | whatsapp | whatsapp | Tutti | New detailed prompt |
| 11 | `whatsapp-preventivi` | Follow-up Preventivi WhatsApp | whatsapp | whatsapp | Tutti | New |
| 12 | `render-infissi` | Render Infissi AI | vendita | visuale | Serramenti | Existing (keep) |
| 13 | `render-coperture` | Render Coperture AI | prossimamente | visuale | Edilizia | Existing disabled |
| 14 | `render-facciate` | Render Facciate AI | prossimamente | visuale | Edilizia | Existing disabled |
| 15 | `assistente-showroom` | Assistente Showroom | prossimamente | vocale | Serramenti | New disabled |

### What Gets Removed

- `richiamo-outbound` — merged into `recupero-preventivi` (same concept, better name)
- `prenotazione-appuntamenti` — merged into `conferma-sopralluogo` (edilizia-specific)
- `assistenza-post-vendita` — moved to "prossimamente" (less monetizable, lower priority)
- Generic USE_CASES: `survey` removed, `inbound`/`outbound`/`support` rewritten as vertical

### Key Copy Changes

**Before:** "Risponde alle chiamate in entrata e qualifica i lead con domande intelligenti."
**After:** "Risponde H24 ai lead da Meta e Google Ads. Qualifica budget, tipo lavoro e tempistica. Fissa il sopralluogo in automatico."

**Before:** "Ricontatta prospect e clienti inattivi con chiamate outbound automatiche."
**After:** "Richiama i preventivi non chiusi dopo 7-14 giorni. Scopre il motivo, rilancia con un'offerta e recupera fino al 25% dei lead persi."

### Prompt Quality Upgrade

Each new prompt will include:
- Specific data fields to collect (structured)
- Objection handling rules
- Escalation criteria
- Tone guidance (professional but warm, construction jargon)
- Call outcome classification

### Categories Update

Replace current categories with sector-oriented ones:

```
Tutti | Vocali | WhatsApp | Vendita Visiva | Per Settore ▾ | Prossimamente
```

Add a new `settore` field to each template for filtering: `serramenti`, `fotovoltaico`, `ristrutturazioni`, `tutti`.

### EDILIZIA_PROMPT_TEMPLATES Expansion

Expand from 3 to 6 quick templates:
1. Acquisizione Lead Cantiere (existing)
2. Qualifica Serramentista (existing)
3. Presa Appuntamento Sopralluogo (existing)
4. Recupero Preventivo Scaduto (new)
5. Risponditore Campagne Ads (new)
6. Post-Installazione e Recensioni (new)

### Files Modified

1. **`src/components/agents/PromptTemplates.ts`** — Rewrite USE_CASES (vertical, commercial descriptions), expand EDILIZIA_PROMPT_TEMPLATES to 6, improve all PROMPT_TEMPLATES with deeper prompts
2. **`src/pages/app/CreateAgent.tsx`** — Replace STATIC_TEMPLATES with new 15-template library, add `settore` field to HubTemplate, update category pills, improve card descriptions
3. **`src/pages/app/AgentTemplateWizard.tsx`** — Update VOCAL_SLUGS and label mappings for new slugs
4. **`src/pages/app/Templates.tsx`** — Update upcomingTemplates to match new library, remove duplicates with hub

### No DB Changes Needed

All changes are in static code. DB-backed templates (from `agent_templates` table) continue to merge via the existing `useMemo` logic.

