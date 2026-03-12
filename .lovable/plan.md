

# Stripe Integration for Credit Package Payments

## Overview

Integrate Stripe Checkout to allow users to pay for credit packages with real card payments. When payment succeeds, a Stripe webhook automatically credits the company's balance.

## Architecture

```text
┌─────────────┐     ┌──────────────────────┐     ┌─────────┐
│ Credits.tsx  │────▶│ create-checkout-      │────▶│ Stripe  │
│ (Buy click)  │     │ session (Edge Fn)     │     │ Checkout│
└─────────────┘     └──────────────────────┘     └────┬────┘
                                                       │
                    ┌──────────────────────┐           │
                    │ stripe-webhook       │◀──────────┘
                    │ (Edge Fn)            │  checkout.session.completed
                    └──────┬───────────────┘
                           │
                    ┌──────▼───────────────┐
                    │ topup_credits RPC    │
                    │ + ai_credit_topups   │
                    └──────────────────────┘
```

## Step 1: Enable Stripe

Use the `stripe--enable_stripe` tool to connect the user's Stripe account and store `STRIPE_SECRET_KEY` as a secret.

## Step 2: Database Migration

Add `stripe_price_id` to `ai_credit_packages` and `stripe_session_id` to `ai_credit_topups`:

```sql
ALTER TABLE ai_credit_packages
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

ALTER TABLE ai_credit_topups
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES ai_credit_packages(id);
```

## Step 3: Edge Function — `create-checkout-session`

- Authenticates user via JWT
- Validates `packageId` and `companyId`
- Looks up package from `ai_credit_packages` (uses `stripe_price_id` if set, otherwise creates a one-time price from `price_eur`)
- Creates a Stripe Checkout Session with metadata (`company_id`, `package_id`, `user_id`, `credits_eur`)
- Returns the checkout URL to the frontend

## Step 4: Edge Function — `stripe-webhook`

- Receives Stripe webhook events (no JWT — uses Stripe signature verification)
- Handles `checkout.session.completed`:
  1. Reads `company_id`, `credits_eur`, `package_id` from session metadata
  2. Calls `topup_credits` RPC to atomically add credits
  3. Inserts into `ai_credit_topups` with `type: 'stripe'`, `stripe_session_id`, `package_id`
  4. Inserts audit log entry
- Idempotent: checks if `stripe_session_id` already exists in `ai_credit_topups`

## Step 5: Frontend Changes — `Credits.tsx`

- Replace `handlePackagePurchase` to call `create-checkout-session` instead of `topup-credits`
- Redirect user to Stripe Checkout URL (`window.location.href = url`)
- Add success/cancel URL params handling (show toast on return)
- Keep manual topup flow unchanged (for superadmin use)

## Step 6: Config Updates

- Add `stripe-webhook` and `create-checkout-session` to `config.toml` with `verify_jwt = false`
- Stripe webhook uses its own signature-based auth

## Files Modified

| File | Change |
|------|--------|
| Migration SQL | Add `stripe_price_id`, `stripe_session_id`, `package_id` columns |
| `supabase/functions/create-checkout-session/index.ts` | New: creates Stripe Checkout session |
| `supabase/functions/stripe-webhook/index.ts` | New: handles payment confirmation |
| `supabase/config.toml` | Register 2 new functions |
| `src/pages/app/Credits.tsx` | Redirect to Stripe on package buy |

## Security

- Webhook validates Stripe signature via `STRIPE_WEBHOOK_SECRET`
- Checkout session metadata is server-side only (not tamperable)
- Idempotency via `stripe_session_id` unique check prevents double-crediting

