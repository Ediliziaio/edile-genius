import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateRequestId, log } from "../_shared/utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FN = "ai-orchestrator";
const MAX_EVENTS_PER_COMPANY = 20;
const DEDUP_HOURS = 48;

interface OrchestratorEvent {
  event_type: string;
  entity_type: string;
  entity_id: string;
  priority: number; // lower = higher priority
  action: string;
  details: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rid = generateRequestId();

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Determine target company (single or all)
    let body: any = {};
    try { body = await req.json(); } catch { /* cron */ }

    const companyIds: string[] = [];

    if (body.company_id) {
      companyIds.push(body.company_id);
    } else {
      // Process all active companies
      const { data: companies } = await sb
        .from("companies")
        .select("id")
        .eq("status", "active")
        .limit(200);
      if (companies) companyIds.push(...companies.map((c: any) => c.id));
    }

    if (companyIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No companies to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("info", `${FN} starting`, { request_id: rid, companies: companyIds.length });

    const results: { company_id: string; events: number; actions: number }[] = [];

    for (const cid of companyIds) {
      try {
        const result = await processCompany(sb, cid, rid);
        results.push({ company_id: cid, ...result });
      } catch (err) {
        log("warn", `${FN} company error`, { request_id: rid, company_id: cid, error: (err as Error).message });
      }
    }

    const totalActions = results.reduce((s, r) => s + r.actions, 0);
    log("info", `${FN} completed`, { request_id: rid, total_actions: totalActions });

    return new Response(JSON.stringify({ ok: true, results, total_actions: totalActions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    log("error", `${FN} fatal`, { request_id: rid, error: (err as Error).message });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processCompany(sb: any, companyId: string, rid: string) {
  // ── 1. Collect state in parallel ──
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    dormantRes,
    callbackRes,
    creditsRes,
    campaignsRes,
    preventiviRes,
    automationsRes,
    usageRes,
  ] = await Promise.all([
    // Dormant qualified leads (no contact in 5+ days)
    sb.from("contacts")
      .select("id, full_name, phone, last_contact_at, status")
      .eq("company_id", companyId)
      .eq("status", "qualified")
      .lt("last_contact_at", fiveDaysAgo)
      .not("phone", "is", null)
      .order("last_contact_at", { ascending: true })
      .limit(10),
    // Overdue callbacks
    sb.from("contacts")
      .select("id, full_name, next_call_at, status")
      .eq("company_id", companyId)
      .eq("status", "callback")
      .lt("next_call_at", now.toISOString())
      .order("next_call_at", { ascending: true })
      .limit(10),
    // Credits
    sb.from("ai_credits")
      .select("balance_eur, calls_blocked, total_spent_eur, total_recharged_eur")
      .eq("company_id", companyId)
      .single(),
    // Active campaigns
    sb.from("campaigns")
      .select("id, name, contacts_reached, appointments_set, contacts_total, contacts_called, status")
      .eq("company_id", companyId)
      .eq("status", "active")
      .limit(10),
    // Stale preventivi
    sb.from("preventivi")
      .select("id, numero, cliente_nome, stato, inviato_at, created_at")
      .eq("company_id", companyId)
      .in("stato", ["inviato"])
      .lt("inviato_at", tenDaysAgo)
      .limit(10),
    // Automation configs
    sb.from("agent_automations")
      .select("automation_type, is_enabled, config")
      .eq("company_id", companyId),
    // Recent credit usage for burn rate
    sb.from("ai_credit_usage")
      .select("cost_billed_total, created_at")
      .eq("company_id", companyId)
      .gte("created_at", sevenDaysAgo),
  ]);

  const automations = automationsRes.data || [];
  const isEnabled = (type: string) => automations.find((a: any) => a.automation_type === type)?.is_enabled ?? false;

  // ── 2. Generate events ──
  const events: OrchestratorEvent[] = [];

  // Credits critical
  const balance = Number(creditsRes.data?.balance_eur ?? 0);
  const usageData = usageRes.data || [];
  if (usageData.length > 0) {
    const totalUsage = usageData.reduce((s: number, u: any) => s + Number(u.cost_billed_total || 0), 0);
    const dates = usageData.map((u: any) => new Date(u.created_at).getTime());
    const daySpan = Math.max(1, (Math.max(...dates) - Math.min(...dates)) / (24 * 60 * 60 * 1000));
    const burnRate = totalUsage / daySpan;
    const daysLeft = burnRate > 0 ? Math.floor(balance / burnRate) : 999;

    if (creditsRes.data?.calls_blocked || daysLeft <= 3) {
      events.push({
        event_type: "credits_critical",
        entity_type: "credits",
        entity_id: companyId,
        priority: 1,
        action: "alert",
        details: { balance, burn_rate: burnRate, days_left: daysLeft, blocked: creditsRes.data?.calls_blocked },
      });
    }
  }

  // Callback overdue
  for (const c of (callbackRes.data || [])) {
    events.push({
      event_type: "callback_overdue",
      entity_type: "contact",
      entity_id: c.id,
      priority: 2,
      action: "alert",
      details: { name: c.full_name, next_call_at: c.next_call_at },
    });
  }

  // Dormant leads
  const followupEnabled = isEnabled("followup_agent");
  for (const c of (dormantRes.data || [])) {
    events.push({
      event_type: "lead_dormant",
      entity_type: "contact",
      entity_id: c.id,
      priority: 3,
      action: followupEnabled && c.phone ? "outbound_call" : "followup_suggested",
      details: { name: c.full_name, last_contact: c.last_contact_at },
    });
  }

  // Stale preventivi
  for (const p of (preventiviRes.data || [])) {
    events.push({
      event_type: "preventivo_stale",
      entity_type: "preventivo",
      entity_id: p.id,
      priority: 4,
      action: "followup_suggested",
      details: { numero: p.numero, cliente: p.cliente_nome, inviato_at: p.inviato_at },
    });
  }

  // Low performance campaigns
  for (const c of (campaignsRes.data || [])) {
    const reached = c.contacts_reached ?? 0;
    const appts = c.appointments_set ?? 0;
    if (reached >= 30 && (appts / reached) < 0.03) {
      events.push({
        event_type: "campaign_low_perf",
        entity_type: "campaign",
        entity_id: c.id,
        priority: 5,
        action: "alert",
        details: { name: c.name, conversion: reached > 0 ? (appts / reached * 100).toFixed(1) + "%" : "0%" },
      });
    }
  }

  // Sort by priority and limit
  events.sort((a, b) => a.priority - b.priority);
  const processable = events.slice(0, MAX_EVENTS_PER_COMPANY);

  // ── 3. Deduplicate via memory ──
  let actionsLogged = 0;

  for (const evt of processable) {
    // Check dedup
    const { data: existing } = await sb
      .from("ai_orchestrator_log")
      .select("id")
      .eq("company_id", companyId)
      .eq("entity_id", evt.entity_id)
      .eq("event_type", evt.event_type)
      .gte("created_at", new Date(now.getTime() - DEDUP_HOURS * 60 * 60 * 1000).toISOString())
      .neq("action_taken", "skipped")
      .limit(1);

    if (existing && existing.length > 0) {
      continue; // Already acted on this entity recently
    }

    // ── 4. Execute action ──
    let finalAction = evt.action;

    if (evt.action === "outbound_call" && followupEnabled) {
      // Delegate to auto-followup-agent for this specific contact
      try {
        const { error } = await sb.functions.invoke("auto-followup-agent", {
          body: { company_id: companyId, contact_ids: [evt.entity_id] },
        });
        if (error) {
          finalAction = "outbound_call_failed";
          log("warn", "Orchestrator: followup delegation failed", { rid, error: error.message });
        }
      } catch {
        finalAction = "outbound_call_failed";
      }
    }

    // Log the action
    await sb.from("ai_orchestrator_log").insert({
      company_id: companyId,
      event_type: evt.event_type,
      entity_type: evt.entity_type,
      entity_id: evt.entity_id,
      action_taken: finalAction,
      action_details: evt.details,
    });

    actionsLogged++;
  }

  return { events: processable.length, actions: actionsLogged };
}
