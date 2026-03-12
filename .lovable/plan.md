

# Fix: Default agent status to "active" on creation

## Problem
When creating a new agent, the default status is `"draft"`. The user expects newly created agents to default to **"active"** so they appear immediately in the active agents list.

## Change

### `src/pages/app/AgentTemplateWizard.tsx`
- Line 109: Change `status: "draft"` → `status: "active"` in `defaultForm`

This single change means:
- The "Attiva subito" button will be pre-selected in Step 4 (Review)
- The user can still switch to "Salva come bozza" if needed
- After creation, the agent appears as "Attivo" in the agents list

No other files need changes — the StepReview already has the toggle UI, and the edge function already accepts `"active"` status.

