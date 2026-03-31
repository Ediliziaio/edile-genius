import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateRequestId, log, normalizePhoneE164 } from "../_shared/utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FN = "auto-followup-agent";
const DEFAULT_DORMANT_DAYS = 5;
const DEFAULT_MAX_PER_RUN = 10;
const COST_PER_CALL_EUR = 0.08; // estimated cost per outbound call

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rid = generateRequestId();

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    let companyId: string | null = null;

    let body: any = {};
    try { body = await req.json(); } catch { /* empty body is fine for cron */ }

    if (body.company_id) {
      companyId = body.company_id;
    } else if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await sb.auth.getUser(token);
      if (user) {
        const { data: profile } = await sb.from("profiles").select("company_id").eq("id", user.id).single();
        companyId = profile?.company_id || null;
      }
    }

    const companyIds: string[] = [];

    if (companyId) {
      companyIds.push(companyId);
    } else {
      const { data: automations } = await sb
        .from("agent_automations")
        .select("company_id, config")
        .eq("automation_type", "followup_agent")
        .eq("is_enabled", true);

      if (automations) {
        companyIds.push(...automations.map((a: any) => a.company_id));
      }
    }

    if (companyIds.length === 0) {
      return new Response(JSON.stringify({ message: "No companies with followup agent enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("info", "Auto-followup agent starting", { request_id: rid, companies: companyIds.length });

    let totalActions = 0;

    for (const cid of companyIds) {
      try {
        const actions = await processCompany(sb, cid, rid);
        totalActions += actions;
      } catch (err) {
        log("warn", "Failed to process company", {
          request_id: rid, company_id: cid, error: (err as Error).message,
        });
      }
    }

    if (companyIds.length > 0) {
      await sb.from("agent_automations")
        .update({ last_run_at: new Date().toISOString() })
        .eq("automation_type", "followup_agent")
        .in("company_id", companyIds);
    }

    log("info", "Auto-followup agent completed", { request_id: rid, total_actions: totalActions });

    return new Response(JSON.stringify({
      companies_processed: companyIds.length,
      total_actions: totalActions,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    log("error", "Auto-followup agent error", { request_id: rid, error: (err as Error).message });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processCompany(sb: any, companyId: string, rid: string): Promise<number> {
  // Get automation config
  const { data: automation } = await sb
    .from("agent_automations")
    .select("config, total_actions")
    .eq("company_id", companyId)
    .eq("automation_type", "followup_agent")
    .single();

  const config = automation?.config || {};
  const dormantDays = config.dormant_days || DEFAULT_DORMANT_DAYS;
  const maxPerRun = Math.min(config.max_per_run || DEFAULT_MAX_PER_RUN, 10);

  // Find dormant qualified leads
  const dormantDate = new Date(Date.now() - dormantDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: dormantContacts } = await sb
    .from("contacts")
    .select("id, full_name, phone, assigned_agent, call_attempts, ai_actions_log")
    .eq("company_id", companyId)
    .eq("status", "qualified")
    .lt("last_contact_at", dormantDate)
    .not("phone", "is", null)
    .order("last_contact_at", { ascending: true })
    .limit(maxPerRun);

  if (!dormantContacts || dormantContacts.length === 0) return 0;

  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) {
    log("warn", "ELEVENLABS_API_KEY not set — cannot make outbound calls", { request_id: rid });
    return 0;
  }

  // ── Atomic credit reservation ──
  const estimatedCost = dormantContacts.length * COST_PER_CALL_EUR;
  const { data: reservation, error: reserveErr } = await sb.rpc("reserve_followup_credits", {
    p_company_id: companyId,
    p_amount_eur: estimatedCost,
  });

  if (reserveErr || !reservation?.success) {
    log("info", "Skipping company — insufficient credits for batch", {
      request_id: rid,
      company_id: companyId,
      available: reservation?.available,
      required: estimatedCost,
    });
    return 0;
  }

  let creditsUsed = 0;
  let actionsPerformed = 0;

  try {
    for (const contact of dormantContacts) {
      try {
        let agentData: any = null;

        if (contact.assigned_agent) {
          const { data: a } = await sb.from("agents")
            .select("id, el_agent_id, el_phone_number_id, outbound_enabled")
            .eq("id", contact.assigned_agent)
            .eq("outbound_enabled", true)
            .single();
          agentData = a;
        }

        if (!agentData) {
          const { data: a } = await sb.from("agents")
            .select("id, el_agent_id, el_phone_number_id, outbound_enabled")
            .eq("company_id", companyId)
            .eq("outbound_enabled", true)
            .eq("status", "active")
            .not("el_agent_id", "is", null)
            .not("el_phone_number_id", "is", null)
            .limit(1)
            .single();
          agentData = a;
        }

        if (!agentData?.el_agent_id || !agentData?.el_phone_number_id) {
          log("info", "No outbound agent available for company", { request_id: rid, company_id: companyId });
          break;
        }

        // Validate E.164 before calling
        const normalizedPhone = normalizePhoneE164(contact.phone);
        if (!normalizedPhone) {
          log("warn", "Invalid phone number format — skipping contact", {
            request_id: rid,
            contact_id: contact.id,
            phone_raw: (contact.phone || "").slice(0, 4) + "****",
          });
          continue;
        }

        const callBody: Record<string, unknown> = {
          agent_id: agentData.el_agent_id,
          agent_phone_number_id: agentData.el_phone_number_id,
          to_number: normalizedPhone,
          conversation_initiation_client_data: {
            dynamic_variables: {
              nome_contatto: contact.full_name || "",
              tipo_followup: "recupero_lead",
            },
          },
        };

        const elRes = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
          method: "POST",
          headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(callBody),
        });

        if (elRes.ok) {
          const elData = await elRes.json();

          await sb.from("conversations").insert({
            agent_id: agentData.id,
            company_id: companyId,
            contact_id: contact.id,
            direction: "outbound",
            phone_number: contact.phone,
            status: "in_progress",
            started_at: new Date().toISOString(),
            el_conv_id: elData.call_sid || null,
            metadata: { source: "auto_followup_agent" },
          });

          const existingLog = contact.ai_actions_log || [];
          await sb.from("contacts").update({
            call_attempts: (contact.call_attempts || 0) + 1,
            last_contact_at: new Date().toISOString(),
            ai_actions_log: [...(Array.isArray(existingLog) ? existingLog : []), {
              ts: new Date().toISOString(),
              type: "auto_followup",
              action: "outbound_call",
              agent_id: agentData.id,
            }].slice(-50),
          }).eq("id", contact.id);

          actionsPerformed++;
          creditsUsed += COST_PER_CALL_EUR;

          log("info", "Auto-followup call initiated", {
            request_id: rid, company_id: companyId,
            contact_id: contact.id, contact_name: contact.full_name,
          });

          await new Promise(r => setTimeout(r, 2000));
        } else {
          const errText = await elRes.text();
          log("warn", "Auto-followup call failed", {
            request_id: rid, contact_id: contact.id, error: errText.slice(0, 200),
          });
        }
      } catch (err) {
        log("warn", "Error processing contact for auto-followup", {
          request_id: rid, contact_id: contact.id, error: (err as Error).message,
        });
      }
    }
  } finally {
    // ── Release unused reserved credits ──
    await sb.rpc("release_followup_credits", {
      p_company_id: companyId,
      p_used_eur: creditsUsed,
      p_reserved_eur: estimatedCost,
    });
  }

  // Update total_actions counter
  if (actionsPerformed > 0) {
    await sb.from("agent_automations").update({
      total_actions: (automation?.total_actions || 0) + actionsPerformed,
    }).eq("company_id", companyId).eq("automation_type", "followup_agent");
  }

  return actionsPerformed;
}
