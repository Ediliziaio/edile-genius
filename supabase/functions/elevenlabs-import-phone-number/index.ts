import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ── Tenant check ──
    const { data: profile } = await sb.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: "No company" }), { status: 400, headers: corsHeaders });
    }

    const { phone_number, label, twilio_sid, twilio_token, agent_id } = await req.json();
    const company_id = profile.company_id;

    if (!phone_number || !twilio_sid || !twilio_token) {
      return new Response(JSON.stringify({ error: "phone_number, twilio_sid, twilio_token richiesti" }), { status: 400, headers: corsHeaders });
    }

    // Validate E.164 format before touching ElevenLabs or the DB
    const normalizedPhone = phone_number.replace(/\s/g, "");
    const e164Regex = /^\+[1-9]\d{7,14}$/;
    if (!e164Regex.test(normalizedPhone)) {
      return new Response(
        JSON.stringify({ error: "Numero di telefono non valido. Usa il formato E.164 (es. +393331234567)" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY non configurata" }), { status: 500, headers: corsHeaders });

    // Build EL request
    const elBody: Record<string, unknown> = {
      provider: "twilio",
      phone_number: normalizedPhone,
      label: label || normalizedPhone,
      sid: twilio_sid,
      token: twilio_token,
    };

    // If agent, link it
    let el_agent_id: string | null = null;
    if (agent_id) {
      const { data: agent } = await sb.from("agents").select("el_agent_id").eq("id", agent_id).single();
      el_agent_id = agent?.el_agent_id || null;
      if (el_agent_id) elBody.agent_id = el_agent_id;
    }

    const elRes = await fetch("https://api.elevenlabs.io/v1/convai/phone-numbers", {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(elBody),
    });

    if (!elRes.ok) {
      const errText = await elRes.text();
      console.error("EL import phone error:", errText);
      return new Response(JSON.stringify({ error: "Errore importazione numero", details: errText }), { status: 500, headers: corsHeaders });
    }

    const elData = await elRes.json();
    const el_phone_number_id = elData.phone_number_id || elData.id;

    const { data: savedNumber, error: dbErr } = await sb.from("ai_phone_numbers").insert({
      company_id,
      phone_number: normalizedPhone,
      label: label || null,
      agent_id: agent_id || null,
      el_phone_number_id,
      twilio_sid,
      provider: "twilio",
      provider_type: "twilio",
      status: "active",
      monthly_cost: 0,
    } as any).select().single();

    if (dbErr) throw dbErr;

    if (agent_id && el_phone_number_id) {
      await sb.from("agents").update({ el_phone_number_id } as any).eq("id", agent_id);
    }

    return new Response(JSON.stringify({ success: true, phone_number: savedNumber, el_phone_number_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
