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

    // Parse optional body for impersonation
    let bodyCompanyId: string | null = null;
    try {
      const body = await req.json();
      bodyCompanyId = body?.company_id || null;
    } catch { /* no body */ }

    const { data: profile } = await sb.from("profiles").select("company_id, full_name").eq("id", user.id).single();

    // Check if user is superadmin (for impersonation)
    const { data: userRoles } = await sb.from("user_roles").select("role").eq("user_id", user.id);
    const isSuperAdmin = userRoles?.some((r: { role: string }) => r.role === "superadmin" || r.role === "superadmin_user");

    const companyId = (isSuperAdmin && bodyCompanyId) ? bodyCompanyId : profile?.company_id;
    if (!companyId) {
      return new Response(JSON.stringify({ error: "No company" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userName = profile?.full_name || "Titolare";

    // Gather data for briefing
    const today = new Date();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    const [
      agentsRes,
      creditsRes,
      monthConvsRes,
      weekConvsRes,
      prevWeekConvsRes,
      callbackRes,
      dormantRes,
      campaignsRes,
      usageRes,
    ] = await Promise.all([
      sb.from("agents").select("id, name, status, last_call_at, calls_month").eq("company_id", companyId),
      sb.from("ai_credits").select("balance_eur, calls_blocked, total_spent_eur").eq("company_id", companyId).single(),
      sb.from("conversations").select("outcome").eq("company_id", companyId).gte("started_at", startOfMonth),
      sb.from("conversations").select("outcome, summary, main_reason").eq("company_id", companyId).gte("started_at", sevenDaysAgo).order("started_at", { ascending: false }).limit(20),
      sb.from("conversations").select("outcome").eq("company_id", companyId).gte("started_at", fourteenDaysAgo).lt("started_at", sevenDaysAgo),
      sb.from("contacts").select("id, full_name, next_call_at").eq("company_id", companyId).eq("status", "callback").lt("next_call_at", today.toISOString()).limit(10),
      sb.from("contacts").select("id, full_name, last_contact_at").eq("company_id", companyId).eq("status", "qualified").lt("last_contact_at", new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()).limit(10),
      sb.from("campaigns").select("id, name, status, contacts_reached, appointments_set").eq("company_id", companyId).eq("status", "active"),
      sb.from("ai_credit_usage").select("cost_billed_total, created_at").eq("company_id", companyId).gte("created_at", sevenDaysAgo),
    ]);

    const agents = agentsRes.data || [];
    const credits = creditsRes.data;
    const monthConvs = monthConvsRes.data || [];
    const weekConvs = weekConvsRes.data || [];
    const prevWeekConvs = prevWeekConvsRes.data || [];
    const callbacks = callbackRes.data || [];
    const dormant = dormantRes.data || [];
    const campaigns = campaignsRes.data || [];
    const usageHistory = usageRes.data || [];

    // Build data summary for LLM
    const activeAgents = agents.filter(a => a.status === "active");
    const monthAppointments = monthConvs.filter(c => c.outcome === "appointment").length;
    const monthQualified = monthConvs.filter(c => c.outcome === "qualified").length;
    const balance = Number(credits?.balance_eur ?? 0);
    const blocked = credits?.calls_blocked ?? false;

    // Trend: this week vs prev week
    const weekAppointments = weekConvs.filter(c => c.outcome === "appointment").length;
    const prevWeekAppointments = prevWeekConvs.filter(c => c.outcome === "appointment").length;
    const trendLabel = prevWeekAppointments > 0
      ? `${weekAppointments >= prevWeekAppointments ? "+" : ""}${weekAppointments - prevWeekAppointments} rispetto alla settimana precedente`
      : "";

    // Burn rate
    const totalUsage7d = usageHistory.reduce((s, u) => s + Number(u.cost_billed_total || 0), 0);
    const burnRate = totalUsage7d / 7;
    const daysRemaining = burnRate > 0 ? Math.floor(balance / burnRate) : null;

    const dataSummary = `
DATI AZIENDA (oggi ${today.toLocaleDateString("it-IT")}):
- Agenti attivi: ${activeAgents.length}/${agents.length}
- Conversazioni questo mese: ${monthConvs.length}
- Appuntamenti fissati questo mese: ${monthAppointments}
- Lead qualificati questo mese: ${monthQualified}
- Appuntamenti questa settimana: ${weekAppointments} (${trendLabel})
- Crediti disponibili: €${balance.toFixed(2)}${blocked ? " (BLOCCATI)" : ""}${daysRemaining !== null ? ` (~${daysRemaining} giorni rimanenti)` : ""}
- Consumo medio giornaliero: €${burnRate.toFixed(2)}/giorno
- Contatti da richiamare (scaduti): ${callbacks.length}${callbacks.length > 0 ? ` (${callbacks.slice(0, 3).map(c => c.full_name).join(", ")})` : ""}
- Lead qualificati dormienti (>5gg): ${dormant.length}${dormant.length > 0 ? ` (${dormant.slice(0, 3).map(d => d.full_name).join(", ")})` : ""}
- Campagne attive: ${campaigns.length}${campaigns.length > 0 ? ` (${campaigns.map(c => `"${c.name}": ${c.appointments_set || 0} appuntamenti su ${c.contacts_reached || 0} contatti`).join("; ")})` : ""}
- Ultimi motivi di interesse dalle chiamate: ${weekConvs.filter(c => c.main_reason).slice(0, 5).map(c => c.main_reason).join("; ") || "nessuno"}
`.trim();

    // Build actions context
    const actionsContext = `
AZIONI DISPONIBILI (rispondi anche con un array JSON "actions" di max 3 azioni prioritarie):
- Se ci sono contatti da richiamare: { "label": "Richiama contatti", "href": "/app/contacts", "priority": "high" }
- Se ci sono lead dormienti: { "label": "Follow-up lead", "href": "/app/contacts", "priority": "high" }
- Se crediti bassi: { "label": "Ricarica crediti", "href": "/app/credits", "priority": "high" }
- Se campagne attive con bassa conversione: { "label": "Controlla campagna", "href": "/app/campaigns", "priority": "medium" }
- Se agenti inattivi: { "label": "Verifica agenti", "href": "/app/agents", "priority": "medium" }
Includi solo azioni pertinenti ai dati. Max 3.
`.trim();

    // Call LLM
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      // Fallback
      const lines: string[] = [];
      const actions: any[] = [];
      if (blocked) {
        lines.push("⚠️ I tuoi agenti sono bloccati per crediti esauriti. Ricarica subito.");
        actions.push({ label: "Ricarica crediti", href: "/app/credits", priority: "high" });
      } else if (balance < 3) {
        lines.push(`💰 Crediti bassi (€${balance.toFixed(2)}).`);
        actions.push({ label: "Ricarica crediti", href: "/app/credits", priority: "high" });
      }
      if (callbacks.length > 0) {
        lines.push(`📞 Hai ${callbacks.length} contatti da richiamare oggi.`);
        actions.push({ label: "Richiama contatti", href: "/app/contacts", priority: "high" });
      }
      if (dormant.length > 0) {
        lines.push(`🔥 ${dormant.length} lead qualificati aspettano un follow-up.`);
        if (actions.length < 3) actions.push({ label: "Follow-up lead", href: "/app/contacts", priority: "high" });
      }
      lines.push(`📊 Questo mese: ${monthConvs.length} conversazioni, ${monthAppointments} appuntamenti.`);
      if (lines.length === 1) lines.unshift("✅ Tutto procede bene!");

      return new Response(JSON.stringify({ briefing: lines.join("\n"), actions }), {
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
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Sei il consulente AI di un imprenditore edile. Genera un briefing mattutino e azioni suggerite.

Rispondi SOLO con un JSON con due campi:
- "briefing": testo del briefing in 4-6 righe. Sii diretto, concreto, orientato all'azione. Usa emoji. Inizia con "Buongiorno ${userName}!" e usa il "tu". Evidenzia: problemi urgenti, opportunità, un dato positivo. Includi il trend settimanale e la proiezione crediti se rilevante.
- "actions": array di max 3 azioni cliccabili, ognuna con "label" (breve, 2-4 parole), "href" (percorso app), "priority" ("high"/"medium"/"low"). Ordina per urgenza.

${actionsContext}`,
          },
          {
            role: "user",
            content: dataSummary,
          },
        ],
      }),
    });

    if (!llmRes.ok) {
      log("warn", "LLM error for briefing", { request_id: rid, status: llmRes.status });
      const actions: any[] = [];
      if (callbacks.length > 0) actions.push({ label: "Richiama contatti", href: "/app/contacts", priority: "high" });
      if (dormant.length > 0) actions.push({ label: "Follow-up lead", href: "/app/contacts", priority: "high" });
      return new Response(JSON.stringify({
        briefing: `Buongiorno ${userName}! 📊 Questo mese: ${monthConvs.length} conversazioni e ${monthAppointments} appuntamenti.${callbacks.length > 0 ? ` 📞 ${callbacks.length} contatti da richiamare.` : ""}${balance < 5 ? ` 💰 Crediti: €${balance.toFixed(2)}.` : ""}`,
        actions,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const llmJson = await llmRes.json();
    const content = llmJson.choices?.[0]?.message?.content?.trim() || "";

    let briefing = "Nessun briefing disponibile.";
    let actions: any[] = [];

    try {
      const parsed = JSON.parse(content);
      briefing = parsed.briefing || briefing;
      actions = Array.isArray(parsed.actions) ? parsed.actions.slice(0, 3) : [];
    } catch {
      // If not JSON, use as plain text
      briefing = content || briefing;
    }

    log("info", "Briefing generated", { request_id: rid, company_id: companyId, actions_count: actions.length });

    return new Response(JSON.stringify({ briefing, actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    log("error", "Briefing error", { request_id: rid, error: (err as Error).message });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
