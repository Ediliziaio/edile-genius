import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  generateRequestId,
  log,
  jsonOk,
  jsonError,
  errorResponse,
} from "../_shared/utils.ts";

const FN = "internal-agent-webhook";

// B8 fix: popola internal_call_log_id in ai_credit_usage
// In modo che CallDetailDrawer possa trovare il costo della chiamata

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verifica firma HMAC (stessa logica elevenlabs-webhook)
    const bodyText = await req.text();
    const signature = req.headers.get("ElevenLabs-Signature");
    const webhookSecret = Deno.env.get("ELEVENLABS_WEBHOOK_SECRET");

    if (!webhookSecret) {
      log("error", "ELEVENLABS_WEBHOOK_SECRET non configurato", { request_id: rid });
      return new Response("Webhook secret not configured", { status: 503 });
    }
    if (!signature) {
      return new Response("Missing signature", { status: 401 });
    }

    // Verifica HMAC
    const parts = signature.split(",");
    const timestamp = parts.find((p: string) => p.startsWith("t="))?.replace("t=", "") || "";
    const hash = parts.find((p: string) => p.startsWith("v0="))?.replace("v0=", "") || "";
    const payload = `${timestamp}.${bodyText}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const expectedHash = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const encoder = new TextEncoder();
    const a = encoder.encode(hash);
    const b2 = encoder.encode(expectedHash);
    if (a.byteLength !== b2.byteLength) {
      return new Response("Invalid signature", { status: 401 });
    }

    const body = JSON.parse(bodyText);
    const event = body.type || body.event_type;

    log("info", "Webhook ricevuto", { request_id: rid, event });

    if (event === "conversation_ended" || event === "post_call_webhook") {
      await handleCallEnded(sb, body, rid);
    }

    return jsonOk({ received: true }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});

async function handleCallEnded(sb: any, body: any, rid: string) {
  const convId =
    body.data?.conversation_id ||
    body.conversation_id ||
    body.data?.call_sid ||
    null;

  if (!convId) {
    log("warn", "Nessun conversation_id nel webhook", { request_id: rid });
    return;
  }

  // Trova il call log corrispondente tramite elevenlabs_conversation_id
  const { data: callLog } = await sb
    .from("internal_call_logs")
    .select("id, company_id, agent_id, campaign_id")
    .eq("elevenlabs_conversation_id", convId)
    .maybeSingle();

  if (!callLog) {
    log("warn", "Call log non trovato per conversation_id", {
      request_id: rid,
      conversation_id: convId,
    });
    return;
  }

  // Aggiorna call log con durata e status
  const durationSec = body.data?.metadata?.call_duration_secs || 0;
  const status = durationSec > 5 ? "answered" : "no_answer";

  await sb
    .from("internal_call_logs")
    .update({
      status,
      ended_at: new Date().toISOString(),
      duration_sec: durationSec,
    })
    .eq("id", callLog.id);

  // Calcola costo
  const costPerMin = 0.12; // €/min billed
  const realCostPerMin = 0.06;
  const durationMin = durationSec / 60;
  const costBilled = Number((durationMin * costPerMin).toFixed(4));
  const costReal = Number((durationMin * realCostPerMin).toFixed(4));

  // Leggi balance attuale
  const { data: credits } = await sb
    .from("ai_credits")
    .select("balance_eur")
    .eq("company_id", callLog.company_id)
    .single();

  const balanceBefore = Number(credits?.balance_eur || 0);
  const balanceAfter = Math.max(0, balanceBefore - costBilled);

  // B8 fix: inserisci in ai_credit_usage con internal_call_log_id
  await sb.from("ai_credit_usage").insert({
    company_id: callLog.company_id,
    agent_id: callLog.agent_id,
    conversation_id: null, // ElevenLabs conversation_id non è lo stesso dell'UUID interno
    internal_call_log_id: callLog.id, // B8 fix: usa internal_call_log_id
    call_direction: "outbound",
    duration_sec: durationSec,
    duration_min: Number(durationMin.toFixed(4)),
    cost_billed_per_min: costPerMin,
    cost_billed_total: costBilled,
    cost_real_per_min: realCostPerMin,
    cost_real_total: costReal,
    margin_total: Number((costBilled - costReal).toFixed(4)),
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    llm_model: "gpt-4o",
    tts_model: "eleven_turbo_v2",
  });

  // Scala crediti
  if (costBilled > 0) {
    await sb
      .from("ai_credits")
      .update({
        balance_eur: balanceAfter,
        calls_blocked: balanceAfter < 0.04,
      })
      .eq("company_id", callLog.company_id);
  }

  log("info", "Chiamata interna conclusa — crediti scalati", {
    request_id: rid,
    call_log_id: callLog.id,
    duration_sec: durationSec,
    cost_billed: costBilled,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
  });
}
