import { log } from "../_shared/utils.ts";

/**
 * Post-Call Actions: Atomic pipeline using process_post_call_atomic RPC.
 * Single transaction: contact update + action log + campaign exclusion.
 * Also updates outbound_call_log and contacts via update_contact_after_call.
 */
export async function runPostCallActions(
  sb: any,
  opts: {
    companyId: string;
    conversationId: string | null;
    callerNumber: string | null;
    outcomeAi: string | null;
    nextStep: string | null;
    requestId: string;
    transcript?: any[];
    durationSeconds?: number;
    agentId?: string;
    callStatus?: string;
  }
) {
  const {
    companyId, conversationId, callerNumber, outcomeAi, nextStep, requestId,
    transcript, durationSeconds, agentId, callStatus,
  } = opts;

  if (!outcomeAi) {
    log("info", "No AI outcome — skipping post-call actions", { request_id: requestId });
  }

  try {
    // 1. Find the contact by caller_number
    let contactId: string | null = null;

    if (callerNumber) {
      const normalizedNumbers = [callerNumber];
      if (callerNumber.startsWith("+39")) {
        normalizedNumbers.push(callerNumber.slice(3));
      } else if (!callerNumber.startsWith("+")) {
        normalizedNumbers.push(`+39${callerNumber}`);
      }

      const { data: contacts } = await sb
        .from("contacts")
        .select("id")
        .eq("company_id", companyId)
        .in("phone", normalizedNumbers)
        .limit(1);

      if (contacts && contacts.length > 0) {
        contactId = contacts[0].id;
      }
    }

    // 2. Also try via conversation linkage
    if (!contactId && conversationId) {
      const { data: conv } = await sb
        .from("conversations")
        .select("id, caller_number, contact_id")
        .eq("el_conv_id", conversationId)
        .maybeSingle();

      if (conv?.contact_id) {
        contactId = conv.contact_id;
      } else if (conv?.caller_number && conv.caller_number !== callerNumber) {
        const { data: contacts } = await sb
          .from("contacts")
          .select("id")
          .eq("company_id", companyId)
          .eq("phone", conv.caller_number)
          .limit(1);
        if (contacts && contacts.length > 0) {
          contactId = contacts[0].id;
        }
      }
    }

    // 3. Try to find contact_id from outbound_call_log
    if (!contactId && conversationId) {
      const { data: callLog } = await sb
        .from("outbound_call_log")
        .select("contact_id")
        .eq("el_conversation_id", conversationId)
        .maybeSingle();

      if (callLog?.contact_id) {
        contactId = callLog.contact_id;
      }
    }

    // 4. Run existing atomic RPC if we have outcomeAi and contactId
    if (outcomeAi && contactId) {
      const actionLogEntry = {
        ts: new Date().toISOString(),
        type: "post_call",
        outcome: outcomeAi,
        next_step: nextStep,
        conversation_id: conversationId,
      };

      const { data, error } = await sb.rpc("process_post_call_atomic", {
        p_contact_id: contactId,
        p_company_id: companyId,
        p_outcome: outcomeAi,
        p_next_step: nextStep || null,
        p_conversation_id: conversationId || null,
        p_action_log_entry: actionLogEntry,
      });

      if (error) {
        log("warn", "process_post_call_atomic failed", {
          request_id: requestId,
          error: error.message,
        });
      } else if (data?.success) {
        log("info", "Post-call action completed (atomic)", {
          request_id: requestId,
          contact_id: contactId,
          new_status: data.new_status,
          outcome_ai: outcomeAi,
          campaigns_excluded: data.campaigns_excluded,
        });
      }
    }

    // 5. CRM auto-update via outbound_call_log linkage
    if (contactId) {
      const sentiment = analyzeSentiment(transcript || []);
      const outcome = determineOutcome(callStatus, durationSeconds);
      const nextCallAt = suggestNextCallTime(outcome, sentiment);

      // Update contact atomically
      try {
        await sb.rpc("update_contact_after_call", {
          p_contact_id: contactId,
          p_outcome: outcome,
          p_duration_sec: durationSeconds || 0,
          p_agent_id: agentId || null,
          p_ai_summary: null, // summary is generated separately in the main webhook
          p_next_call_at: nextCallAt?.toISOString() ?? null,
          p_sentiment: sentiment,
        });

        log("info", "Contact CRM updated after call", {
          request_id: requestId,
          contact_id: contactId,
          outcome,
          sentiment,
        });
      } catch (err) {
        log("warn", "update_contact_after_call failed", {
          request_id: requestId,
          error: (err as Error).message,
        });
      }

      // Update outbound_call_log with outcome/sentiment if linked
      if (conversationId) {
        await sb
          .from("outbound_call_log")
          .update({
            outcome,
            sentiment,
            duration_sec: durationSeconds || 0,
            ended_at: new Date().toISOString(),
          })
          .eq("el_conversation_id", conversationId);
      }
    }

    if (!contactId) {
      log("info", "No matching contact found for post-call action", {
        request_id: requestId,
        caller_number: callerNumber,
      });
    }
  } catch (err) {
    log("warn", "Post-call actions failed (non-blocking)", {
      request_id: requestId,
      error: (err as Error).message,
    });
  }
}

function analyzeSentiment(transcript: any[]): string {
  if (!transcript.length) return "unknown";
  const positiveWords = ["sì", "perfetto", "ottimo", "interessato", "quando", "appuntamento", "grazie", "certo", "volentieri"];
  const negativeWords = ["no", "non mi interessa", "lasci stare", "occupato", "non voglio", "basta"];
  const text = transcript
    .filter((t: any) => t.role === "user")
    .map((t: any) => (t.message || t.text || "").toLowerCase())
    .join(" ");
  const posScore = positiveWords.filter((w) => text.includes(w)).length;
  const negScore = negativeWords.filter((w) => text.includes(w)).length;
  if (posScore > negScore + 1) return "positive";
  if (negScore > posScore) return "negative";
  return "neutral";
}

function determineOutcome(callStatus: string | undefined, durationSeconds: number | undefined): string {
  if (callStatus === "no-answer") return "no_answer";
  if (callStatus === "busy") return "busy";
  if (callStatus === "machine-detection") return "voicemail";
  if (durationSeconds && durationSeconds > 15) return "answered";
  if (durationSeconds && durationSeconds <= 15) return "no_answer";
  return "answered";
}

function suggestNextCallTime(outcome: string, sentiment: string): Date | null {
  const now = new Date();
  switch (outcome) {
    case "no_answer": {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    case "busy":
      return new Date(now.getTime() + 2 * 60 * 60 * 1000);
    case "voicemail": {
      const in3days = new Date(now);
      in3days.setDate(in3days.getDate() + 3);
      return in3days;
    }
    default:
      return null;
  }
}
