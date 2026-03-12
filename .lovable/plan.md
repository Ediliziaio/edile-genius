

# Fix 3 Critical Issues in Credit System

## Issues Found

| # | Issue | Impact |
|---|-------|--------|
| 1 | `credits_eur` in `ai_credit_packages` equals `price_eur` (29/99/299/990) instead of intended credit amounts (100/500/2000/10000) | Customers get wrong credit amount when buying packages |
| 2 | Missing secrets: `META_ENCRYPTION_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY` | Crypto, AI briefing, and email functions will fail |
| 3 | `topup-credits` line 70 uses `credits_eur` as amount to add — correct logic, but wrong data makes it add €29 instead of €100 for Starter | Directly caused by issue #1 |

## Already Working (no changes needed)

- `topup_credits` RPC exists and works atomically (the planned `topup_credits_atomic` is unnecessary — existing RPC does the same thing)
- `topup-credits` edge function logic is correct (uses `credits_eur` as the amount to credit)
- Health-check, CRM sync, n8n, and Onboarding fixes are all in place
- Auto-recharge dedup in `elevenlabs-webhook` is working

## Plan

### 1. Migration: Fix `credits_eur` values
Create a migration to update the 4 package rows:
```sql
UPDATE ai_credit_packages SET credits_eur = 100 WHERE name = 'Starter';
UPDATE ai_credit_packages SET credits_eur = 500 WHERE name = 'Professional';
UPDATE ai_credit_packages SET credits_eur = 2000 WHERE name = 'Business';
UPDATE ai_credit_packages SET credits_eur = 10000 WHERE name = 'Enterprise';
```

### 2. Missing Secrets
The user needs to add 3 secrets via the Supabase dashboard:
- **META_ENCRYPTION_KEY**: Generate with `openssl rand -hex 32` (64 hex chars). Required for WhatsApp, CRM encryption.
- **OPENAI_API_KEY**: From OpenAI dashboard. Required for AI morning briefing.
- **RESEND_API_KEY**: From Resend dashboard. Required for email notifications.

No code changes needed — just secret configuration.

### 3. No edge function changes required
The `topup-credits` function correctly reads `credits_eur` from the package and adds it to the balance. Once the data is fixed (step 1), packages will work correctly:
- Starter: pay €29, receive €100 credits
- Professional: pay €99, receive €500 credits
- Business: pay €299, receive €2000 credits
- Enterprise: pay €990, receive €10000 credits

### Files Modified
| File | Change |
|------|--------|
| Migration SQL | UPDATE 4 rows in `ai_credit_packages` |

