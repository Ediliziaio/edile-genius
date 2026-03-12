

# Prompt 9 — Fix Medi Finali: Health-Check, CRM Sync, n8n Token, Onboarding

## Confirmed Issues

| Fix | File | Problem |
|-----|------|---------|
| 1 | `health-check/index.ts` | `META_ENCRYPTION_KEY` not in REQUIRED_SECRETS; no crypto roundtrip test; `ENCRYPTION_KEY` checked instead |
| 2 | `crm-sync/index.ts` L272-274 | Silent catch on decrypt failure falls back to using encrypted string as API key |
| 3 | `n8n-trigger-webhook/index.ts` L103 | `callback_token` leaked in JSON body visible in n8n execution logs |
| 4 | `Onboarding.tsx` | No date validation in step 2; seed demo button not disabled after completion |

## Plan

### 1. Migration SQL
- Add `last_sync_status`, `last_sync_error`, `last_sync_at` columns to `company_integrations` (IF NOT EXISTS)
- Add `onboarding_skipped_seed BOOLEAN DEFAULT false` and `onboarding_completed_at TIMESTAMPTZ` to `profiles`
- Backfill `onboarding_completed_at` for existing completed users

### 2. Health-check (`supabase/functions/health-check/index.ts`)
- Update REQUIRED_SECRETS: add `SUPABASE_ANON_KEY`, `META_ENCRYPTION_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY`
- Update OPTIONAL_SECRETS: remove moved ones, add `STRIPE_SECRET_KEY`
- Replace `ENCRYPTION_KEY` validation with `META_ENCRYPTION_KEY` hex format check
- Add crypto roundtrip test using `encryptToken`/`decryptToken` from `_shared/crypto.ts`
- Deploy

### 3. CRM Sync (`supabase/functions/crm-sync/index.ts`)
- Lines 266-275: Replace silent catch with explicit error logging + update `company_integrations` with error status + `return` error response instead of silently continuing
- Add minimum length validation after successful decrypt
- Deploy

### 4. n8n Trigger (`supabase/functions/n8n-trigger-webhook/index.ts`)
- Line 93: Add `X-Callback-Token` header
- Lines 99-104: Remove `callback_token` from JSON body `_edile_genius` object
- Deploy

### 5. Onboarding (`src/pages/app/Onboarding.tsx`)
- Add `seedCompleted` state
- In `handleStep2`: add date validation (end > start, warn if >5 years)
- In `handleSeedDemo`: handle 409 gracefully, set `seedCompleted`, always navigate on success
- Disable seed button when `seedCompleted`

### Files Modified
| File | Change |
|------|--------|
| Migration SQL | New columns on `company_integrations` + `profiles` |
| `supabase/functions/health-check/index.ts` | Expanded secrets + crypto test |
| `supabase/functions/crm-sync/index.ts` | Remove silent decrypt fallback |
| `supabase/functions/n8n-trigger-webhook/index.ts` | Move token to header |
| `src/pages/app/Onboarding.tsx` | Date validation + seed dedup |

