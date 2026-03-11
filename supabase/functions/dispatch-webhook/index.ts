import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders, generateRequestId, log, jsonError, errorResponse,
  fetchWithTimeout,
} from "../_shared/utils.ts";

const FN = "dispatch-webhook";

const VALID_EVENT_TYPES = [
  "conversation.completed",
  "conversation.started",
  "appointment.created",
  "campaign.completed",
  "campaign.started",
  "contact.created",
  "contact.updated",
  "agent.status_changed",
  "report.generated",
];
const MAX_PAYLOAD_SIZE = 100_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rid = generateRequestId();

  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify({ ...body, request_id: rid }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // ── 1. Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return jsonError("Unauthorized", "auth_error", 401, rid);
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(supabaseUrl, serviceKey);

    // ── 2. Get user's company & roles
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("company_id").eq("id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const userCompanyId = profileRes.data?.company_id as string | null;
    const roles = (rolesRes.data || []).map((r: { role: string }) => r.role);
    const isSuperadmin = roles.includes("superadmin") || roles.includes("superadmin_user");

    // ── 3. Parse & validate body
    const { company_id, event_type, payload } = await req.json();

    const targetCompanyId = company_id || userCompanyId;
    if (!targetCompanyId) return jsonError("company_id required", "validation_error", 400, rid);
    if (!isSuperadmin && targetCompanyId !== userCompanyId) return jsonError("Forbidden: cross-tenant access denied", "forbidden", 403, rid);
    if (!event_type || typeof event_type !== "string") return jsonError("event_type is required", "validation_error", 400, rid);
    if (!VALID_EVENT_TYPES.includes(event_type)) return jsonError(`Invalid event_type. Allowed: ${VALID_EVENT_TYPES.join(", ")}`, "validation_error", 400, rid);

    if (payload) {
      const payloadStr = JSON.stringify(payload);
      if (payloadStr.length > MAX_PAYLOAD_SIZE) return jsonError(`Payload too large (max ${MAX_PAYLOAD_SIZE} bytes)`, "validation_error", 413, rid);
    }

    log("info", "Dispatching webhooks", { request_id: rid, event_type, company_id: targetCompanyId });

    // ── 4. Get active webhooks
    const { data: webhooks, error: whError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("company_id", targetCompanyId)
      .eq("is_active", true)
      .contains("events", [event_type]);

    if (whError) {
      log("error", "Failed to fetch webhooks", { request_id: rid, error: whError.message });
      return jsonError("Failed to fetch webhooks", "system_error", 500, rid);
    }

    if (!webhooks || webhooks.length === 0) {
      return json({ ok: true, dispatched: 0 });
    }

    // ── 5. Dispatch webhooks
    const results = await Promise.allSettled(
      webhooks.map(async (wh) => {
        const body = JSON.stringify({
          event: event_type,
          timestamp: new Date().toISOString(),
          data: payload || {},
        });

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (wh.secret) {
          const encoder = new TextEncoder();
          const key = await crypto.subtle.importKey("raw", encoder.encode(wh.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
          const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
          const hex = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
          headers["X-Webhook-Signature"] = `sha256=${hex}`;
          // Note: outbound signature generation — no timing-safe comparison needed here.
          // Timing-safe comparison is only relevant when *verifying* incoming signatures.
        }

        let statusCode = 0;
        let responseBody = "";
        let success = false;

        try {
          // 10s timeout, no retry (customer endpoints, not idempotent)
          const res = await fetchWithTimeout(wh.url, { method: "POST", headers, body }, 10_000);
          statusCode = res.status;
          responseBody = (await res.text()).substring(0, 1000);
          success = res.ok;
        } catch (err: unknown) {
          responseBody = err instanceof Error ? err.message : "Request failed";
          log("warn", "Webhook delivery failed", { request_id: rid, webhook_id: wh.id, error: responseBody });
        }

        await supabase.from("webhook_logs").insert({
          webhook_id: wh.id,
          event_type,
          payload: payload || {},
          status_code: statusCode || null,
          response_body: responseBody,
          success,
        });

        return { webhook_id: wh.id, success };
      })
    );

    log("info", "Webhooks dispatched", { request_id: rid, count: results.length });

    return json({
      ok: true,
      dispatched: results.length,
      results: results.map((r) =>
        r.status === "fulfilled" ? r.value : { error: "dispatch failed" }
      ),
    });
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
