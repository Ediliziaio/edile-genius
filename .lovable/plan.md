

# Prompt 8 — Sistema Crediti & Fatturazione Completo

## Current State

| Area | Status | Issue |
|------|--------|-------|
| `ai_credits` table | Has both `minutes_*` (old) and `balance_eur` (new) columns | `balance_eur` is nullable, dual system creates confusion |
| `ai_credit_packages` | 4 packages exist but use `minutes` column (100/500/2000/10000) | No `credits_eur` column — packages are minute-based, not EUR-based |
| `topup-credits` edge fn | Works with free amounts only | No package support |
| `elevenlabs-webhook` | Auto-recharge exists (lines 205-218) | No dedup protection for rapid successive calls |
| `Credits.tsx` | Shows manual topup selector (€10/20/50/100) | Doesn't fetch/display packages from DB |
| `Settings.tsx` billing tab | Links to `/app/credits` + "Prossimamente" placeholder | No inline credit balance or recent topups |

## Plan

### 1. Migration SQL
- Add `credits_eur` column to `ai_credit_packages` (default same as `minutes` values for backward compat)
- Update existing packages: set `credits_eur` to match EUR values (Starter=29, Professional=99, Business=299, Enterprise=990)
- Make `balance_eur` NOT NULL DEFAULT 0 on `ai_credits`
- Add `system_version INTEGER DEFAULT 2` to `ai_credits`
- Convert any remaining minute-only records to EUR
- Add dedup check for auto-recharge (5-min window query already in webhook, just needs the topup `type` field set correctly)

### 2. `topup-credits` Edge Function
- Add `packageId` support: look up package, use `price_eur` as amount
- Add max validation (€2000 per transaction)
- Keep backward compat with existing `amountEur` param

### 3. `elevenlabs-webhook` — Auto-Recharge Dedup
- Add 5-minute dedup check before auto-recharge (query recent topups with `type='auto'`)
- Clamp amount to min 5, max 500

### 4. `Credits.tsx` — Package Cards
- Fetch packages from `ai_credit_packages` via `useQuery`
- Show 4 package cards above the manual topup selector
- Each card: name, credits_eur, price_eur, badge, "Acquista" button
- Purchase calls `topup-credits` with `packageId`

### 5. `Settings.tsx` — Billing Tab Enhancement
- Fetch `ai_credits` balance and `auto_recharge_enabled`
- Fetch last 5 topups from `ai_credit_topups`
- Show inline balance with status badge, auto-recharge indicator, recent topups list, and link to full Credits page

### Files Modified
| File | Change |
|------|--------|
| Migration SQL | `credits_eur` on packages, `balance_eur` NOT NULL, `system_version` |
| `supabase/functions/topup-credits/index.ts` | Package support + max validation |
| `supabase/functions/elevenlabs-webhook/index.ts` | Auto-recharge dedup |
| `src/pages/app/Credits.tsx` | Package cards from DB |
| `src/pages/app/Settings.tsx` | Real billing tab content |
| `src/integrations/supabase/types.ts` | Updated types |

