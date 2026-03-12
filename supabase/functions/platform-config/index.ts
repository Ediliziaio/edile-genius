import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check superadmin role
    const userId = user.id;
    const { data: roleCheck } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["superadmin", "superadmin_user"])
      .limit(1);

    if (!roleCheck || roleCheck.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    // GET — return config
    if (req.method === "GET") {
      const { data: config, error } = await serviceClient
        .from("platform_config")
        .select("*")
        .limit(1)
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ config }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST — actions
    const body = await req.json();
    const { action } = body;

    if (action === "test_api_key") {
      const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY secret not configured" }), { status: 400, headers: corsHeaders });
      }

      const elResponse = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": apiKey },
      });

      if (!elResponse.ok) {
        await serviceClient
          .from("platform_config")
          .update({ el_api_key_configured: false, el_voices_count: 0, updated_by: userId })
          .neq("id", "00000000-0000-0000-0000-000000000000"); // update all rows

        return new Response(JSON.stringify({ error: "ElevenLabs API key invalid", status: elResponse.status }), { status: 400, headers: corsHeaders });
      }

      const data = await elResponse.json();
      const voicesCount = (data.voices || []).length;

      await serviceClient
        .from("platform_config")
        .update({
          el_api_key_configured: true,
          el_api_key_tested_at: new Date().toISOString(),
          el_voices_count: voicesCount,
          updated_by: userId,
        })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      return new Response(JSON.stringify({ success: true, voices_count: voicesCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_config") {
      const updates: Record<string, unknown> = { updated_by: userId };
      const allowed = ["el_default_llm", "el_default_voice_id", "credit_markup", "cost_per_min_real"];
      for (const key of allowed) {
        if (key in body) updates[key] = body[key];
      }

      const { data: updated, error } = await serviceClient
        .from("platform_config")
        .update(updates)
        .neq("id", "00000000-0000-0000-0000-000000000000")
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ config: updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "apply_global_markup") {
      const { markup } = body;
      if (!markup || markup < 1) {
        return new Response(JSON.stringify({ error: "Invalid markup" }), { status: 400, headers: corsHeaders });
      }

      // Update all pricing rows
      const { data: rows } = await serviceClient.from("platform_pricing").select("id, cost_real_per_min");
      if (rows) {
        for (const row of rows) {
          const costBilled = Number((Number(row.cost_real_per_min) * markup).toFixed(6));
          await serviceClient.from("platform_pricing").update({
            markup_multiplier: markup,
            cost_billed_per_min: costBilled,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          }).eq("id", row.id);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
