import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { company_id, event_type, payload } = await req.json();

    if (!company_id || !event_type) {
      return new Response(JSON.stringify({ error: "Missing company_id or event_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active webhooks for this company that subscribe to this event
    const { data: webhooks, error: whError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("company_id", company_id)
      .eq("is_active", true)
      .contains("events", [event_type]);

    if (whError) {
      return new Response(JSON.stringify({ error: whError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!webhooks || webhooks.length === 0) {
      return new Response(JSON.stringify({ dispatched: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.allSettled(
      webhooks.map(async (wh) => {
        const body = JSON.stringify({
          event: event_type,
          timestamp: new Date().toISOString(),
          data: payload || {},
        });

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (wh.secret) {
          // Simple HMAC signature using the webhook secret
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
        } catch (err: any) {
          responseBody = err.message || "Request failed";
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

    return new Response(
      JSON.stringify({ dispatched: results.length, results: results.map((r) => (r.status === "fulfilled" ? r.value : { error: (r as any).reason?.message })) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
