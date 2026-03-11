import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateRequestId, log } from "../_shared/utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FN = "ai-morning-briefing";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rid = generateRequestId();

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth: get company_id from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await sb.from("profiles").select("company_id, full_name").eq("id", user.id).single();
    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: "No company" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = profile.company_id;
    const userName = profile.full_name || "Titolare";

    // Gather data for briefing
    const today = new Date();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    const [
      agentsRes,
      creditsRes,
      monthConvsRes,
      weekConvsRes,
      callbackRes,
      dormantRes,
      campaignsRes,
    ] = await Promise.all([
      sb.from("agents").select("id, name, status, last_call_at, calls_month").eq("company_id", companyId),
      sb.from("ai_credits").select("balance_eur, calls_blocked").eq("company_id", companyId).single(),
      sb.from("conversations").select("outcome").eq("company_id", companyId).gte("started_at", startOfMonth),
      sb.from("conversations").select("outcome, summary, main_reason").eq("company_id", companyId).gte("started_at", sevenDaysAgo).order("started_at", { ascending: false }).limit(20),
      sb.from("contacts").select("id, full_name, next_call_at").eq("company_id", companyId).eq("status", "callback").lt("next_call_at", today.toISOString()).limit(10),
      sb.from("contacts").select("id, full_name, last_contact_at").eq("company_id", companyId).eq("status", "qualified").lt("last_contact_at", new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()).limit(10),
      sb.from("campaigns").select("id, name, status, contacts_reached, appointments_set").eq("company_id", companyId).eq("status", "active"),
    ]);

    const agents = agentsRes.data || [];
    const credits = creditsRes.data;
    const monthConvs = monthConvsRes.data || [];
    const weekConvs = weekConvsRes.data || [];
    const callbacks = callbackRes.data || [];
    const dormant = dormantRes.data || [];
    const campaigns = campaignsRes.data || [];

    // Build data summary for LLM
    const activeAgents = agents.filter(a => a.status === "active");
    const monthAppointments = monthConvs.filter(c => c.outcome === "appointment").length;
    const monthQualified = monthConvs.filter(c => c.outcome === "qualified").length;
    const balance = Number(credits?.balance_eur ?? 0);
    const blocked = credits?.calls_blocked ?? false;

    const dataSummary = `
DATI AZIENDA (oggi ${today.toLocaleDateString("it-IT")}):
- Agenti attivi: ${activeAgents.length}/${agents.length}
- Conversazioni questo mese: ${monthConvs.length}
- Appuntamenti fissati questo mese: ${monthAppointments}
- Lead qualificati questo mese: ${monthQualified}
- Crediti disponibili: €${balance.toFixed(2)}${blocked ? " (BLOCCATI)" : ""}
- Contatti da richiamare (scaduti): ${callbacks.length}${callbacks.length > 0 ? ` (${callbacks.slice(0, 3).map(c => c.full_name).join(", ")})` : ""}
- Lead qualificati dormienti (>5gg): ${dormant.length}${dormant.length > 0 ? ` (${dormant.slice(0, 3).map(d => d.full_name).join(", ")})` : ""}
- Campagne attive: ${campaigns.length}${campaigns.length > 0 ? ` (${campaigns.map(c => `"${c.name}": ${c.appointments_set || 0} appuntamenti su ${c.contacts_reached || 0} contatti`).join("; ")})` : ""}
- Ultimi motivi di interesse dalle chiamate: ${weekConvs.filter(c => c.main_reason).slice(0, 5).map(c => c.main_reason).join("; ") || "nessuno"}
`.trim();

    // Call LLM
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      // Fallback: generate a simple briefing without LLM
      const lines: string[] = [];
      if (blocked) lines.push("⚠️ I tuoi agenti sono bloccati per crediti esauriti. Ricarica subito per non perdere chiamate.");
      else if (balance < 3) lines.push(`💰 Crediti bassi (€${balance.toFixed(2)}). Valuta una ricarica.`);
      if (callbacks.length > 0) lines.push(`📞 Hai ${callbacks.length} contatti da richiamare oggi.`);
      if (dormant.length > 0) lines.push(`🔥 ${dormant.length} lead qualificati aspettano un tuo follow-up da più di 5 giorni.`);
      lines.push(`📊 Questo mese: ${monthConvs.length} conversazioni, ${monthAppointments} appuntamenti.`);
      if (lines.length === 1) lines.unshift("✅ Tutto procede bene!");

      return new Response(JSON.stringify({ briefing: lines.join("\n") }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const llmRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.5,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: `Sei il consulente AI di un imprenditore edile. Genera un briefing mattutino in 4-6 righe. Sii diretto, concreto, orientato all'azione. Usa emoji appropriate. Inizia con "Buongiorno ${userName}!" e usa il "tu". Non dire "ecco il briefing", vai dritto al punto. Evidenzia: problemi urgenti, opportunità da cogliere, e un dato positivo se c'è.`,
          },
          {
            role: "user",
            content: dataSummary,
          },
        ],
      }),
    });

    if (!llmRes.ok) {
      const status = llmRes.status;
      log("warn", "LLM error for briefing", { request_id: rid, status });
      // Return simple fallback
      return new Response(JSON.stringify({
        briefing: `Buongiorno ${userName}! 📊 Questo mese: ${monthConvs.length} conversazioni e ${monthAppointments} appuntamenti.${callbacks.length > 0 ? ` 📞 ${callbacks.length} contatti da richiamare.` : ""}${balance < 5 ? ` 💰 Crediti: €${balance.toFixed(2)}.` : ""}`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const llmJson = await llmRes.json();
    const briefing = llmJson.choices?.[0]?.message?.content?.trim() || "Nessun briefing disponibile.";

    log("info", "Briefing generated", { request_id: rid, company_id: companyId });

    return new Response(JSON.stringify({ briefing }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    log("error", "Briefing error", { request_id: rid, error: (err as Error).message });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
