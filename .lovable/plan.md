

# Batch 5 — Remaining Bug Fixes & Security Hardening

After reviewing all 11 prompts against the current codebase, Batches 1-4 addressed the critical crashes (preventivi, documenti, dashboard NaN, sidebar nav, whatsapp webhook HMAC, orchestrator guards). Here are the **remaining unfixed items**, grouped by priority.

---

## A. Security Fixes (High Priority)

### A1. `telegram-cantiere-webhook` — Secret token + CORS
- Add `X-Telegram-Bot-Api-Secret-Token` header verification
- Add CORS headers and OPTIONS handler
- Filter operaio lookup by `session.cantiere_id` when available

### A2. `dispatch-webhook` — Timing-safe HMAC
- Replace `hash !== expectedHash` string comparison with `crypto.subtle.timingSafeEqual` (same pattern already used in whatsapp-webhook)

### A3. `elevenlabs-webhook` — Race condition guard + avg duration guard
- Add guard for division by zero on avg duration: `if (duration_seconds > 0 && prevTotal >= 0)`
- The balance race condition requires an atomic Postgres RPC (complex — will create `deduct_call_credits` RPC)

### A4. `check-credits-before-call` — Explicit error on pricing miss
- If pricing lookup returns null, return `{ allowed: false, reason: 'pricing_unavailable' }` instead of using fallback

---

## B. Remaining Bug Fixes

### B1. `CantiereConfig.tsx`
- Add `autoComplete="off"` to token input (already has `type="password"`)
- Add Telegram token format validation before save: `/^\d+:[\w-]{35,}$/`
- Filter operai by cantiere (currently shows all company operai — but this page is company-wide config, so this may be intentional; will add note)

### B2. `Settings.tsx`
- Fix `notif as unknown as Json` → use `JSON.parse(JSON.stringify(notif))`
- Add webhook URL validation with `new URL()` try-catch before save
- Add password change form in Profile tab

### B3. `Contacts.tsx`
- Add `.limit(1000)` to contacts query (currently loads ALL contacts)
- The client-side pagination already exists (page/perPage) but data fetch has no limit

### B4. `Campaigns.tsx`
- Progress bar division guard was already added in Batch 3
- `CreateCampaign.tsx` — verify campaign type is read from form state (not hardcoded)

---

## C. Files Modified

| File | Changes |
|---|---|
| `supabase/functions/telegram-cantiere-webhook/index.ts` | CORS, secret token verification, operaio cantiere filter |
| `supabase/functions/dispatch-webhook/index.ts` | Timing-safe HMAC comparison |
| `supabase/functions/elevenlabs-webhook/index.ts` | Avg duration guard, atomic credit deduction RPC |
| `supabase/functions/check-credits-before-call/index.ts` | Explicit pricing error |
| `src/pages/app/CantiereConfig.tsx` | Token validation, autoComplete |
| `src/pages/app/Settings.tsx` | JSON cast fix, URL validation, password change form |
| `src/pages/app/Contacts.tsx` | Add query limit |
| `supabase/migrations/` | New `deduct_call_credits` RPC for atomic balance updates |

This batch focuses on **security + remaining bugs only**. Feature requests (auto-save, CSV mapping, Excel export, Kanban improvements, etc.) are deferred to a separate batch.

