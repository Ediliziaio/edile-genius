

## Resilience Hardening — Tier 2 & Tier 3 Functions

### Scope

**Tier 2 — Messaging/Notification (7 functions):**

| Function | External Calls | Timeout | Retry |
|----------|---------------|---------|-------|
| `send-cantiere-reminders` | Telegram | 10s | No (loop, partial OK) |
| `send-cantiere-report-email` | Resend | 10s | No |
| `check-mancati-report` | Telegram + Resend | 10s | No |
| `check-sal-ritardi` | Telegram + Resend | 10s | No |
| `check-documenti-scadenze` | Resend | 10s | No |
| `whatsapp-send` | Meta Graph API | 15s | No (not idempotent) |
| `whatsapp-templates-sync` | Meta Graph API | 15s | 1 retry (read-only GET) |
| `whatsapp-connect-number` | Meta Graph API (x4) | 15s | No (stateful OAuth) |
| `whatsapp-refresh-tokens` | Meta Graph API | 15s per token | No (per-token error handling already exists) |
| `whatsapp-webhook` | None (incoming) | N/A | N/A — add structured logging only |

**Tier 3 — AI/Generation (4 functions):**

| Function | External Calls | Timeout | Retry |
|----------|---------------|---------|-------|
| `generate-render` | Lovable AI Gateway | 120s | No (expensive, credits deducted) |
| `generate-report` | OpenAI | 60s | No |
| `process-preventivo-audio` | OpenAI Whisper + GPT | 60s Whisper, 90s GPT | No |
| `analyze-window-photo` | Lovable AI Gateway | 60s | No |

### Changes Per Function

All functions will:
- Import `corsHeaders`, `generateRequestId`, `log`, `errorResponse`, `fetchWithTimeout` (and `fetchWithRetry` where applicable) from `../_shared/utils.ts`
- Remove local `corsHeaders` definition
- Replace raw `console.error` with structured `log()`
- Replace raw `fetch()` to external APIs with `fetchWithTimeout()`
- Use `errorResponse()` in catch blocks instead of leaking `err.message`
- Add `request_id` for traceability

### Implementation Details

**Tier 2 specifics:**
- `send-cantiere-reminders`: Wrap Telegram fetch in `fetchWithTimeout(url, init, 10_000)`, add `log()` for each reminder sent and errors. Continue loop on individual failures.
- `send-cantiere-report-email`: Add CORS headers to OPTIONS response. Wrap Resend calls with `fetchWithTimeout(url, init, 10_000)`.
- `check-mancati-report`: Same pattern — `fetchWithTimeout` for both Telegram and Resend calls.
- `check-sal-ritardi`: Same pattern.
- `check-documenti-scadenze`: Same pattern for Resend calls.
- `whatsapp-send`: `fetchWithTimeout` on Meta Graph API (15s). No retry (message send is not idempotent).
- `whatsapp-templates-sync`: `fetchWithRetry` on Meta GET (15s, 1 retry) since it's a read-only operation.
- `whatsapp-connect-number`: `fetchWithTimeout` on all 4 Meta API calls (15s each). No retry (stateful OAuth flow).
- `whatsapp-refresh-tokens`: `fetchWithTimeout` on each token exchange (15s). Per-token error handling already exists.
- `whatsapp-webhook`: Structured logging only (no external calls to wrap). Keep always-200 pattern for Meta.

**Tier 3 specifics:**
- `generate-render`: `fetchWithTimeout` on AI Gateway with 120s timeout. Keep existing error-to-DB pattern.
- `generate-report`: `fetchWithTimeout` on OpenAI with 60s timeout.
- `process-preventivo-audio`: `fetchWithTimeout` on Whisper (60s) and GPT (90s) separately.
- `analyze-window-photo`: `fetchWithTimeout` on AI Gateway with 60s timeout.

### Files Modified (17 total)
1. `supabase/functions/send-cantiere-reminders/index.ts`
2. `supabase/functions/send-cantiere-report-email/index.ts`
3. `supabase/functions/check-mancati-report/index.ts`
4. `supabase/functions/check-sal-ritardi/index.ts`
5. `supabase/functions/check-documenti-scadenze/index.ts`
6. `supabase/functions/whatsapp-send/index.ts`
7. `supabase/functions/whatsapp-templates-sync/index.ts`
8. `supabase/functions/whatsapp-connect-number/index.ts`
9. `supabase/functions/whatsapp-refresh-tokens/index.ts`
10. `supabase/functions/whatsapp-webhook/index.ts`
11. `supabase/functions/generate-render/index.ts`
12. `supabase/functions/generate-report/index.ts`
13. `supabase/functions/process-preventivo-audio/index.ts`
14. `supabase/functions/analyze-window-photo/index.ts`

No changes to `_shared/utils.ts` — it already has everything needed.

