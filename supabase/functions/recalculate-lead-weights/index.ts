import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, jsonOk, jsonError, errorResponse, authenticateRequest } from "../_shared/utils.ts";

const FN = "recalculate-lead-weights";

/**
 * Recalculate Lead Score Weights — "Qualificatore Intelligente"
 *
 * Analyzes a company's historical contact conversions to compute
 * custom lead-score weights that reflect their actual conversion patterns.
 *
 * Stores results in companies.settings.lead_score_weights
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();

  try {
    const { auth, errorResponse: authErr } = await authenticateRequest(req, rid, createClient);
    if (authErr) return authErr;

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get user's company
    const { data: profile } = await sb.from("profiles").select("company_id").eq("id", auth!.userId).single();
    if (!profile?.company_id) return jsonError("No company", "validation_error", 400, rid);

    const companyId = profile.company_id;

    // Fetch all contacts with enough data
    const { data: contacts } = await sb
      .from("contacts")
      .select("id, status, source, phone, email, call_attempts, last_contact_at, metadata")
      .eq("company_id", companyId)
      .limit(1000);

    if (!contacts || contacts.length < 20) {
      return jsonOk({
        message: "Servono almeno 20 contatti per calcolare i pesi personalizzati.",
        weights: null,
      }, rid);
    }

    // Fetch conversations aggregated by contact
    const { data: conversations } = await sb
      .from("conversations")
      .select("contact_id, outcome, sentiment")
      .eq("company_id", companyId)
      .not("contact_id", "is", null)
      .limit(1000);

    // Build per-contact conversation features
    const convByContact: Record<string, { outcomes: string[]; sentiments: string[] }> = {};
    for (const conv of conversations || []) {
      if (!conv.contact_id) continue;
      if (!convByContact[conv.contact_id]) convByContact[conv.contact_id] = { outcomes: [], sentiments: [] };
      if (conv.outcome) convByContact[conv.contact_id].outcomes.push(conv.outcome);
      if (conv.sentiment) convByContact[conv.contact_id].sentiments.push(conv.sentiment);
    }

    // Classify contacts into "converted" vs "not converted"
    const convertedStatuses = ["qualified", "appointment", "customer"];
    const converted = contacts.filter(c => convertedStatuses.includes(c.status));
    const notConverted = contacts.filter(c => !convertedStatuses.includes(c.status));

    if (converted.length < 5) {
      return jsonOk({
        message: "Servono almeno 5 contatti convertiti per calcolare i pesi.",
        weights: null,
        converted_count: converted.length,
      }, rid);
    }

    // Calculate feature rates for converted vs not-converted
    const featureRate = (group: typeof contacts, predicate: (c: any) => boolean) => {
      if (group.length === 0) return 0;
      return group.filter(predicate).length / group.length;
    };

    const hasConvData = (c: any) => !!convByContact[c.id];
    const hasQualified = (c: any) => convByContact[c.id]?.outcomes?.some(o => o === "qualified" || o === "appointment") ?? false;
    const hasPositiveSentiment = (c: any) => convByContact[c.id]?.sentiments?.some(s => s === "positive") ?? false;
    const hasCompleteContact = (c: any) => !!(c.phone && c.email);
    const hasCalls = (c: any) => (c.call_attempts || 0) > 0;
    const isInbound = (c: any) => c.source === "web_form" || c.source === "referral";
    const isRecent = (c: any) => {
      if (!c.last_contact_at) return false;
      const days = (Date.now() - new Date(c.last_contact_at).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 30;
    };

    // Calculate lift (how much more likely converted contacts have this feature)
    const calcWeight = (feature: (c: any) => boolean) => {
      const convRate = featureRate(converted, feature);
      const nonConvRate = featureRate(notConverted, feature);
      if (nonConvRate === 0 && convRate === 0) return 1.0;
      if (nonConvRate === 0) return 2.0; // strong positive signal
      return Math.min(3.0, Math.max(0.3, convRate / nonConvRate));
    };

    const weights = {
      qualified_outcome: Math.round(calcWeight(hasQualified) * 30),
      positive_sentiment: Math.round(calcWeight(hasPositiveSentiment) * 20),
      complete_contact: Math.round(calcWeight(hasCompleteContact) * 10),
      has_calls: Math.round(calcWeight(hasCalls) * 10),
      inbound_source: Math.round(calcWeight(isInbound) * 5),
      recency_bonus: Math.round(calcWeight(isRecent) * 10),
      calculated_at: new Date().toISOString(),
      sample_size: contacts.length,
      converted_count: converted.length,
    };

    // Save to company settings
    const { data: company } = await sb.from("companies").select("settings").eq("id", companyId).single();
    const currentSettings = (company?.settings as Record<string, any>) || {};

    await sb.from("companies").update({
      settings: { ...currentSettings, lead_score_weights: weights },
    }).eq("id", companyId);

    log("info", "Lead score weights recalculated", {
      request_id: rid,
      company_id: companyId,
      weights,
    });

    return jsonOk({
      message: "Pesi del lead score aggiornati con successo.",
      weights,
    }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
