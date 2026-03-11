import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Constants ---
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
const MAX_PAYLOAD_SIZE = 100_000; // 100 KB stringified

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // ── 1. Authentication ──────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(supabaseUrl, serviceKey);

    // ── 2. Get user's company & roles ─────────────────────────────
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("company_id").eq("id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const userCompanyId = profileRes.data?.company_id as string | null;
    const roles = (rolesRes.data || []).map((r: { role: string }) => r.role);
    const isSuperadmin = roles.includes("superadmin") || roles.includes("superadmin_user");

    // ── 3. Parse & validate body ──────────────────────────────────
    const { company_id, event_type, payload } = await req.json();

    // Tenant authorization
    const targetCompanyId = company_id || userCompanyId;
    if (!targetCompanyId) {
      return json({ error: "company_id required" }, 400);
    }
    if (!isSuperadmin && targetCompanyId !== userCompanyId) {
      return json({ error: "Forbidden: cross-tenant access denied" }, 403);
    }

    // Validate event_type
    if (!event_type || typeof event_type !== "string") {
      return json({ error: "event_type is required" }, 400);
    }
    if (!VALID_EVENT_TYPES.includes(event_type)) {
      return json({ error: `Invalid event_type. Allowed: ${VALID_EVENT_TYPES.join(", ")}` }, 400);
    }

    // Validate payload size
    if (payload) {
      const payloadStr = JSON.stringify(payload);
      if (payloadStr.length > MAX_PAYLOAD_SIZE) {
        return json({ error: `Payload too large (max ${MAX_PAYLOAD_SIZE} bytes)` }, 413);
      }
    }

    // ── 4. Get active webhooks for this company ───────────────────
    const { data: webhooks, error: whError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("company_id", targetCompanyId)
      .eq("is_active", true)
      .contains("events", [event_type]);

    if (whError) {
      return json({ error: "Failed to fetch webhooks" }, 500);
    }

    if (!webhooks || webhooks.length === 0) {
      return json({ dispatched: 0 });
    }

    // ── 5. Dispatch webhooks ──────────────────────────────────────
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
          const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(wh.secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
          );
          const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
          const hex = Array.from(new Uint8Array(signature))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          headers["X-Webhook-Signature"] = `sha256=${hex}`;
        }

        let statusCode = 0;
        let responseBody = "";
        let success = false;

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const res = await fetch(wh.url, {
            method: "POST",
            headers,
            body,
            signal: controller.signal,
          });
          clearTimeout(timeout);
          statusCode = res.status;
          responseBody = (await res.text()).substring(0, 1000);
          success = res.ok;
        } catch (err: unknown) {
          responseBody = err instanceof Error ? err.message : "Request failed";
        }

        // Log delivery
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

    return json({
      dispatched: results.length,
      results: results.map((r) =>
        r.status === "fulfilled" ? r.value : { error: "dispatch failed" }
      ),
    });
  } catch (err) {
    console.error("dispatch-webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
