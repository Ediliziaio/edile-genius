

## Analisi Tecnica del Bug

### Root Cause
Line 146 of `create-elevenlabs-agent/index.ts`:
```typescript
type: "vocal",  // HARDCODED — ignores body.type
```

The frontend (`AgentTemplateWizard.tsx`) correctly sends `type: agentType` in the request body (lines 175, 214), but the edge function **never destructures `type` from the body** (line 22-24) and hardcodes `"vocal"` in the DB insert.

Same issue in `deploy-template-instance/index.ts` line 120.

### Impact
- Every agent created via wizard or template deploy is stored as `type: "vocal"` regardless of selection
- List filters, badges, analytics, and detail page tabs all read `agent.type` — showing wrong UI for render/whatsapp agents

### Affected Files

| File | Issue |
|------|-------|
| `supabase/functions/create-elevenlabs-agent/index.ts` | Does not read `type` from body; hardcodes `"vocal"` |
| `supabase/functions/deploy-template-instance/index.ts` | Hardcodes `"vocal"`; should derive from template channel |

No frontend changes needed — `AgentTemplateWizard.tsx` already sends the correct type. `AgentCard.tsx`, `AgentDetail.tsx`, `Agents.tsx` all correctly read `agent.type` from DB.

### Fix Plan

**1. `create-elevenlabs-agent/index.ts`**
- Destructure `type` from the request body
- Validate against allowed values: `["vocal", "render", "whatsapp", "operative"]`
- Fallback to `"vocal"` only if value is missing or invalid
- Use validated value in the DB insert

**2. `deploy-template-instance/index.ts`**
- Derive type from `template.channel` (e.g., if channel includes "whatsapp" → "whatsapp") with fallback to `"vocal"`
- Use derived value in the DB insert

**3. No DB migration needed**
- Column `agents.type` is already `text` with default `'vocal'`
- Existing records with wrong type can be fixed manually if needed, but no schema change required

### Files Modified
1. `supabase/functions/create-elevenlabs-agent/index.ts` — accept and validate `type` from body
2. `supabase/functions/deploy-template-instance/index.ts` — derive type from template channel

### Test Checklist
- Create a vocal agent → DB shows `type: "vocal"`
- Create a render agent → DB shows `type: "render"`
- Create a whatsapp agent → DB shows `type: "whatsapp"`
- Send invalid type → falls back to `"vocal"`
- Send no type → falls back to `"vocal"`
- Agent list filters work correctly per type
- Agent detail shows correct tabs/badges
- Deploy template instance saves correct type
- Existing agents unaffected

### Risks
- None significant — this is additive (reading a field that was ignored before)
- Backward compatible: missing `type` in body still defaults to `"vocal"`

