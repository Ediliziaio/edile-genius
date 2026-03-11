

## Security Hardening: `add-knowledge-doc` & `dispatch-webhook`

### Vulnerabilities Found

| # | Function | Vulnerability | Severity |
|---|----------|--------------|----------|
| 1 | **Both** | No JWT authentication — anyone with the URL can invoke | **Critical** |
| 2 | **Both** | `company_id` trusted from request body, no server-side ownership check | **Critical** |
| 3 | `add-knowledge-doc` | Uses service role key for ALL operations — no tenant isolation | **High** |
| 4 | `dispatch-webhook` | Any caller can dispatch webhooks for any company | **Critical** |
| 5 | **Both** | No input validation — arbitrary fields, unbounded payloads | **Medium** |
| 6 | `dispatch-webhook` | No rate limiting or replay protection | **Medium** |
| 7 | `add-knowledge-doc` | `source_url` not validated — potential SSRF via ElevenLabs proxy | **Medium** |
| 8 | `add-knowledge-doc` | `file_path` from body — attacker could read any file in the bucket | **High** |

### Fix Plan

**Both functions get the same auth pattern:**

1. Require `Authorization: Bearer <token>`
2. Validate JWT via `getClaims(token)` to get `userId`
3. Lookup `profiles.company_id` for the authenticated user (service role, single query)
4. Compare against the `company_id` in the request body — reject if mismatch
5. Superadmins bypass the company check via `has_role()`

**`add-knowledge-doc` specific:**
- Validate `type` against allowed values: `url`, `text`, `file`
- Validate `source_url` is a valid HTTP(S) URL when type=url
- Validate `file_path` starts with `{verified_company_id}/` to prevent cross-tenant file access
- Validate `name` length (max 255 chars)
- Validate `content_preview` length (max 50000 chars)
- Verify `agent_id` belongs to the same company if provided
- Verify `doc_id` belongs to the same company when processing existing docs

**`dispatch-webhook` specific:**
- After auth, derive `company_id` server-side (don't trust body)
- OR validate body `company_id` matches user's company
- Validate `event_type` against allowed list
- Limit `payload` size (stringify and check length)
- Add idempotency key support via optional `idempotency_key` header

### Files Modified
1. `supabase/functions/add-knowledge-doc/index.ts` — full auth + validation rewrite
2. `supabase/functions/dispatch-webhook/index.ts` — full auth + validation rewrite

### No DB Migrations Needed
- RLS already exists on `ai_knowledge_docs`, `webhooks`, `webhook_logs`
- The service role key bypasses RLS, so the fix is in the function code itself

### Security Test Checklist
- No token → 401
- Invalid token → 401
- Valid token, wrong company_id → 403
- Valid token, correct company_id → 200
- Superadmin token, any company_id → 200
- `type` not in allowed list → 400
- `file_path` pointing to another company's folder → 403
- `agent_id` belonging to another company → 403
- `event_type` not in allowed list → 400
- Oversized payload → 400

