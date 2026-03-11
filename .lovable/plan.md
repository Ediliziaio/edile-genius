

## Resilience & Reliability Hardening Plan

### Current State Analysis

All 39 edge functions share these weaknesses:

| Issue | Impact | Affected Functions |
|-------|--------|-------------------|
| No timeout on external `fetch()` calls | Hanging requests can exhaust Deno worker limits | All functions calling ElevenLabs, Meta, Telegram, Resend, OpenAI, n8n |
| No structured logging — raw `console.error` with inconsistent formats | Blind debugging in production | All functions |
| Inconsistent error response format | Client-side error handling is fragile | All functions |
| No request ID / correlation | Cannot trace issues across webhook chains | All functions |
| Raw error messages leaked to client (`err.message`) | Potential info disclosure + bad UX | All functions |
| No retry on transient failures | Single 502/503 from provider = permanent failure | ElevenLabs, Meta, Resend, Telegram, OpenAI calls |
| Silent fetch failures (no response body consumed on error) | Lost diagnostic info | Several functions |

### Strategy

Create a **shared utility module** (`supabase/functions/_shared/utils.ts`) and refactor the most critical functions to use it. This avoids touching all 39 functions at once while establishing a standard that can be adopted incrementally.

### Shared Utilities

**`supabase/functions/_shared/utils.ts`** — new file containing:

1. **`fetchWithTimeout(url, init, timeoutMs = 10000)`** — wraps `fetch` with `AbortController` timeout. Returns the response or throws a typed `TimeoutError`.

2. **`fetchWithRetry(url, init, opts)`** — wraps `fetchWithTimeout` with configurable retry (max 2 retries, exponential backoff, only on 429/502/503/504 status codes). Does NOT retry on 4xx client errors or non-idempotent operations unless explicitly opted in.

3. **`jsonResponse(body, status, corsHeaders)`** — standardized JSON response with `{ ok, error?, code?, data?, request_id }` structure.

4. **`errorResponse(error, status, corsHeaders, requestId)`** — normalizes errors, redacts sensitive fields, never leaks stack traces. Classifies errors as `provider_error`, `validation_error`, `auth_error`, `system_error`.

5. **`generateRequestId()`** — short crypto-random ID for correlation.

6. **`log(level, message, context)`** — structured JSON log with `{ level, msg, request_id, timestamp, ...context }`. Never logs secrets (redacts fields matching `token`, `key`, `secret`, `password`).

### Functions to Harden (Priority Order)

**Tier 1 — External API calls with financial/operational impact:**

| Function | External Call | Timeout | Retry | Notes |
|----------|--------------|---------|-------|-------|
| `elevenlabs-webhook` | None (incoming) | N/A | N/A | Add structured logging + request ID |
| `elevenlabs-outbound-call` | ElevenLabs API | 15s | No | Not idempotent (initiates a real phone call) |
| `create-elevenlabs-agent` | ElevenLabs API | 20s | 1 retry on 502/503 | Idempotent-ish (can retry safely before DB insert) |
| `update-agent` | ElevenLabs PATCH | 15s | 1 retry on 502/503 | PATCH is idempotent |
| `elevenlabs-tts` | ElevenLabs API | 30s | No | Large audio response, timeout only |
| `elevenlabs-conversation-token` | ElevenLabs API | 10s | 1 retry | Small GET, safe to retry |
| `get-elevenlabs-voices` | ElevenLabs API | 10s | 1 retry | Read-only GET |
| `dispatch-webhook` | Customer webhooks | 10s | No | Already has timeout; add structured logging |

**Tier 2 — External messaging/notification calls:**

| Function | External Call | Timeout | Retry |
|----------|--------------|---------|-------|
| `send-cantiere-reminders` | Telegram API | 10s | No (loop, partial success OK) |
| `check-mancati-report` | Telegram + Resend | 10s | No |
| `check-sal-ritardi` | Telegram + Resend | 10s | No |
| `check-documenti-scadenze` | Resend | 10s | No |
| `send-cantiere-report-email` | Resend | 10s | No |
| `whatsapp-send` | Meta Graph API | 15s | No (message delivery, not idempotent) |
| `whatsapp-templates-sync` | Meta Graph API | 15s | 1 retry (read-only) |
| `whatsapp-connect-number` | Meta Graph API | 15s | No (stateful OAuth flow) |
| `whatsapp-refresh-tokens` | Meta Graph API | 15s | 1 retry per token |

**Tier 3 — AI/generation calls (already long-running):**

| Function | External Call | Timeout | Retry |
|----------|--------------|---------|-------|
| `generate-render` | Lovable AI Gateway | 120s | No (expensive, credits already deducted) |
| `generate-report` | OpenAI | 60s | No |
| `process-preventivo-audio` | OpenAI (Whisper + GPT) | 90s | No |
| `analyze-window-photo` | Lovable AI Gateway | 60s | No |
| `telegram-cantiere-webhook` | OpenAI + Telegram | 30s per call | No |

### Retry vs No-Retry Decision Matrix

| Retry | Condition |
|-------|-----------|
| Yes | GET/read-only calls, idempotent PATCHs, token generation |
| No | POST that creates resources, outbound calls, message sending, payment operations, file uploads |

### Implementation Plan

**Phase 1: Create shared utilities** — `_shared/utils.ts`

**Phase 2: Harden Tier 1 functions** (6 functions) — these handle the most critical external API interactions

**Phase 3: Harden Tier 2 functions** (7 functions) — messaging/notification functions

Given the scope, I will implement Phase 1 (shared utils) and Phase 2 (Tier 1 — the 8 most critical functions) in this iteration. Tier 2 and 3 can follow the same pattern incrementally.

### Files Modified

1. `supabase/functions/_shared/utils.ts` — **new** shared utility module
2. `supabase/functions/elevenlabs-webhook/index.ts` — structured logging, request ID
3. `supabase/functions/elevenlabs-outbound-call/index.ts` — timeout, error normalization
4. `supabase/functions/create-elevenlabs-agent/index.ts` — timeout + retry on EL call
5. `supabase/functions/update-agent/index.ts` — timeout + retry on EL PATCH
6. `supabase/functions/elevenlabs-tts/index.ts` — timeout, error normalization
7. `supabase/functions/elevenlabs-conversation-token/index.ts` — timeout + retry
8. `supabase/functions/get-elevenlabs-voices/index.ts` — timeout + retry
9. `supabase/functions/dispatch-webhook/index.ts` — structured logging (already has timeout)

### Standardized Response Format

```json
{
  "ok": true,
  "data": { ... },
  "request_id": "req_a1b2c3"
}

{
  "ok": false,
  "error": "Human-readable message",
  "code": "provider_timeout",
  "request_id": "req_a1b2c3"
}
```

### Error Codes

`auth_error`, `validation_error`, `forbidden`, `not_found`, `provider_error`, `provider_timeout`, `rate_limited`, `insufficient_credits`, `system_error`

### Test Strategy

- Deploy each function individually after changes
- Verify existing client calls still work (response shape is a superset, `error` field preserved)
- Timeout behavior verifiable via ElevenLabs API logs
- Retry behavior verifiable via edge function logs (structured JSON makes filtering easy)

