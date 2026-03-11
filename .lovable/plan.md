

## Agent Quality Scorecard

### Scoring Model (0–100)

The score is computed **client-side** from the agent's DB row — no new tables or edge functions needed. This is a pure derived value, always fresh.

**Scoring factors by agent type:**

| Factor | Weight | Applies To | Blocker? |
|--------|--------|------------|----------|
| Name filled | 5 | All | No |
| Description filled | 5 | All | No |
| System prompt ≥ 50 chars | 20 | All | Yes (vocal/whatsapp) |
| First message filled | 10 | vocal, whatsapp | No |
| Voice selected (`el_voice_id`) | 15 | vocal | Yes |
| ElevenLabs agent synced (`el_agent_id`) | 10 | vocal | Yes |
| Sector set | 5 | All | No |
| Has conversations (`calls_total > 0`) | 10 | vocal, whatsapp | No |
| Phone number assigned (`el_phone_number_id`) | 10 | vocal (if outbound) | No |
| Webhook configured | 5 | All | No |
| Evaluation criteria set | 5 | vocal, whatsapp | No |

**Status labels:**
- 0–39: `Da completare` (red)
- 40–69: `Quasi pronto` (amber)  
- 70–89: `Pronto` (green)
- 90–100: `Eccellente` (brand/blue)

**Blockers** are flagged separately — if any blocker is unmet, the agent gets a warning badge regardless of numeric score.

### Files to Create/Modify

1. **`src/lib/agent-score.ts`** — New. Pure function `computeAgentScore(agent: Tables<"agents">)` returning `{ score: number, label: string, color: string, factors: Factor[], blockers: string[] }`. Fully typed, no side effects, easily testable.

2. **`src/components/agents/AgentScoreBadge.tsx`** — New. Compact badge component showing score + label. Used in both card and detail views.

3. **`src/components/agents/AgentScoreDetail.tsx`** — New. Expandable panel showing each factor (check/cross), score contribution, and recommended actions for unmet factors.

4. **`src/components/agents/AgentCard.tsx`** — Add `AgentScoreBadge` below the metrics row.

5. **`src/pages/app/AgentDetail.tsx`** — Add `AgentScoreBadge` in the header next to status badge, and `AgentScoreDetail` in the sidebar stats area.

6. **`src/components/agents/create/StepReview.tsx`** — Add `AgentScoreDetail` at the top of the review step to show what's missing before publish.

### UI Design

**AgentScoreBadge** (compact, for cards):
- Circular progress indicator (tiny, 28px) + label text
- Color-coded by tier

**AgentScoreDetail** (panel, for detail/review):
- Score ring at top
- List of factors with ✅/❌ icons, weight, and action text for unmet items
- Blocker warnings highlighted in red

### Implementation Notes

- Score computation is a pure function — no API calls, no state
- The function takes a `Tables<"agents">` row which already contains all needed fields
- For "has conversations" factor, we pass `calls_total` which is already on the agent row
- No DB migration needed — all data already exists
- Render-type agents skip voice/phone factors automatically

