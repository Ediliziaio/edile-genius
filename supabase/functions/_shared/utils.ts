// ============================================================
// Shared utilities for Supabase Edge Functions
// Provides: timeout, retry, structured logging, standardized responses
// ============================================================

// ── Types ────────────────────────────────────────────────────

export type ErrorCode =
  | "auth_error"
  | "validation_error"
  | "forbidden"
  | "not_found"
  | "provider_error"
  | "provider_timeout"
  | "rate_limited"
  | "insufficient_credits"
  | "system_error";

export type LogLevel = "info" | "warn" | "error" | "debug";

interface RetryOptions {
  maxRetries?: number;       // default 1
  baseDelayMs?: number;      // default 500
  retryableStatuses?: number[]; // default [429, 502, 503, 504]
}

// ── CORS ─────────────────────────────────────────────────────

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Request ID ───────────────────────────────────────────────

export function generateRequestId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return "req_" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Structured Logging ───────────────────────────────────────

const REDACT_KEYS = /token|key|secret|password|authorization|cookie/i;

function redactValue(key: string, value: unknown): unknown {
  if (typeof value === "string" && REDACT_KEYS.test(key)) {
    return value.length > 8 ? value.slice(0, 4) + "****" : "****";
  }
  return value;
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      result[k] = redactObject(v as Record<string, unknown>);
    } else {
      result[k] = redactValue(k, v);
    }
  }
  return result;
}

export function log(
  level: LogLevel,
  msg: string,
  context: Record<string, unknown> = {}
): void {
  const entry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...redactObject(context),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

// ── Standardized Responses ───────────────────────────────────

export function jsonOk(
  data: unknown,
  requestId: string,
  headers: Record<string, string> = corsHeaders
): Response {
  return new Response(
    JSON.stringify({ ok: true, data, request_id: requestId }),
    { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
  );
}

export function jsonError(
  message: string,
  code: ErrorCode,
  status: number,
  requestId: string,
  headers: Record<string, string> = corsHeaders
): Response {
  return new Response(
    JSON.stringify({ ok: false, error: message, code, request_id: requestId }),
    { status, headers: { ...headers, "Content-Type": "application/json" } }
  );
}

/** Normalize any thrown value into a safe error response */
export function errorResponse(
  err: unknown,
  requestId: string,
  fnName: string,
  headers: Record<string, string> = corsHeaders
): Response {
  const message = err instanceof Error ? err.message : "Unknown error";
  const isTimeout = message.includes("aborted") || message.includes("timeout");
  const code: ErrorCode = isTimeout ? "provider_timeout" : "system_error";
  const status = isTimeout ? 504 : 500;

  log("error", `${fnName} unhandled error`, {
    request_id: requestId,
    error: message,
    code,
  });

  return jsonError(
    isTimeout ? "Il provider esterno non ha risposto in tempo" : "Errore interno del server",
    code,
    status,
    requestId,
    headers
  );
}

// ── Fetch with Timeout ───────────────────────────────────────

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 10_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// ── Fetch with Retry ─────────────────────────────────────────

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  timeoutMs = 10_000,
  opts: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 1,
    baseDelayMs = 500,
    retryableStatuses = [429, 502, 503, 504],
  } = opts;

  let lastResponse: Response | undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, init, timeoutMs);

      if (response.ok || !retryableStatuses.includes(response.status)) {
        return response;
      }

      // Retryable status — save and possibly retry
      lastResponse = response;
      log("warn", "Retryable status from provider", {
        url: url.replace(/\?.*/, ""), // strip query params
        status: response.status,
        attempt: attempt + 1,
        max_attempts: maxRetries + 1,
      });
    } catch (err) {
      lastError = err;
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      if (!isAbort && attempt >= maxRetries) throw err;

      log("warn", "Fetch error, will retry", {
        url: url.replace(/\?.*/, ""),
        error: err instanceof Error ? err.message : "unknown",
        attempt: attempt + 1,
      });
    }

    // Exponential backoff before next attempt
    if (attempt < maxRetries) {
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  // All retries exhausted
  if (lastResponse) return lastResponse;
  throw lastError || new Error("All retry attempts failed");
}

// ── Auth Helper ──────────────────────────────────────────────

export interface AuthResult {
  userId: string;
  supabase: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2").createClient>;
}

export async function authenticateRequest(
  req: Request,
  requestId: string,
  createClient: (url: string, key: string, opts?: unknown) => unknown
): Promise<{ auth?: AuthResult; errorResponse?: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { errorResponse: jsonError("Unauthorized", "auth_error", 401, requestId) };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  ) as AuthResult["supabase"];

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await (supabase as any).auth.getUser(token);
  if (userError || !user) {
    return { errorResponse: jsonError("Unauthorized", "auth_error", 401, requestId) };
  }

  return { auth: { userId: user.id as string, supabase } };
}
