

# Prompt 11 — Pre-Launch Quality Hardening

Six fixes across edge functions, frontend, and database for error handling, UX consistency, and code quality.

## 1. Migration SQL — Invoice sequence + RLS policies

Create a migration with:
- `invoice_number_seq` sequence and `generate_invoice_number()` SQL function
- RLS policies on `ai_credits` for company read and superadmin full access
- RLS policy on `weekly_reports_log` for superadmin access
- Add `price_paid_eur` column to `ai_credit_topups`

Note: RLS is auto-enabled on all public tables via the `rls_auto_enable` event trigger already present.

## 2. `create-checkout-session/index.ts` — Classified error responses

Replace the generic catch block (lines 110-115) with Stripe-specific error classification:
- `StripeAuthenticationError` → 500 + `stripe_auth_error` code
- `StripeInvalidRequestError` → 400 + `stripe_invalid_request` code
- Connection errors → 503 + `stripe_unavailable` code
- Generic fallback → 500 + `unknown_error` code

## 3. `stripe-webhook/index.ts` — Three fixes

- **Lines 43-46**: Return 400 (not 200) on missing metadata so Stripe retries. Add fallback to look up `credits_eur` from `ai_credit_packages` if only `package_id` is present.
- **Line 83**: Use `generate_invoice_number()` RPC instead of timestamp-based invoice numbers.
- **Lines 77-80, 116**: Add structured console.log at key points (event received, credits added, RPC error).

## 4. `Credits.tsx` — Polling + UI text updates

- **Lines 98-110**: Replace single `setTimeout` with polling loop (12 attempts, 2.5s apart) that checks if `balance_eur` increased after Stripe redirect.
- **Line 211**: Replace "processate manualmente entro 24h" with "Pagamento sicuro via Stripe — crediti accreditati automaticamente".
- **Line 254**: Replace "Riceverai una conferma entro 24h" with "Verrai reindirizzato a Stripe per il pagamento sicuro".
- **Lines 132-154**: Update `handlePackagePurchase` to show error-code-specific toast messages from the checkout session response.

## 5. `Monitoring.tsx` — Config constants + error handling + PII sanitization

- Extract magic numbers (50, 200, 24h, €5 threshold, 5min staleTime) into a `MONITORING_CONFIG` constant object at top of file.
- Add `error` destructuring to all 4 `useQuery` calls, throw on Supabase errors.
- Add error state UI with retry button when any query fails.
- Add `sanitizeErrorMessage()` helper to strip email addresses and truncate to 80 chars in the weekly reports table.

## 6. `Settings.tsx` BillingTabContent — useQuery migration + text update

- Replace `useEffect` + `useState` (lines 98-110) with two `useQuery` hooks for credits and topups.
- **Lines 167-168**: Replace "processate manualmente entro 24h" with "Pagamento automatico via Stripe".

## 7. `topup-credits/index.ts` — Package priority validation

- When `packageId` is provided, always use package's `credits_eur` for the credit amount (not `amountEur` from body).
- Check `is_active` separately and return 410 Gone if inactive.
- Clear separation between `price_paid` (what user pays) and `credits_eur` (what gets added to balance).

## Files Modified

| File | Change |
|------|--------|
| Migration SQL | Invoice sequence, RLS policies, `price_paid_eur` column |
| `supabase/functions/create-checkout-session/index.ts` | Classified error responses |
| `supabase/functions/stripe-webhook/index.ts` | 400 on missing meta, invoice RPC, structured logging |
| `supabase/functions/topup-credits/index.ts` | Package priority validation |
| `src/pages/app/Credits.tsx` | Polling, error codes, UI text |
| `src/pages/superadmin/Monitoring.tsx` | Config constants, error handling, PII sanitization |
| `src/pages/app/Settings.tsx` | useQuery migration, text update |

