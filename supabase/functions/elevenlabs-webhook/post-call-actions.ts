import { log } from "../_shared/utils.ts";

/**
 * Post-Call Actions: Atomic pipeline using process_post_call_atomic RPC.
 * Single transaction: contact update + action log + campaign exclusion.
 * Also updates outbound_call_log and contacts via update_contact_after_call (only when no AI outcome).
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
    log("info", "No AI outcome — using sentiment-based fallback for contact update", { request_id: requestId });
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

      // Auto DNC: if customer explicitly requested no more calls, enforce it immediately
      if (outcomeAi === "do_not_call") {
        const { error: dncErr } = await sb
          .from("contacts")
          .update({ do_not_call: true, do_not_call_reason: "Richiesta durante chiamata AI" })
          .eq("id", contactId)
          .eq("do_not_call", false); // only update if not already flagged
        if (!dncErr) {
          log("info", "Contact auto-flagged as DNC from call outcome", {
            request_id: requestId,
            contact_id: contactId,
          });
        }
      }
    }

    // 5. CRM auto-update via update_contact_after_call — ONLY when AI outcome was NOT available
    //    This prevents the simpler duration-based logic from overwriting the AI classification.
    if (contactId && !outcomeAi) {
      const sentiment = analyzeSentiment(transcript || []);
      const outcome = determineOutcome(callStatus, durationSeconds);
      const nextCallAt = suggestNextCallTime(outcome, sentiment);

      try {
        // Fetch current next_call_at to avoid overwriting a future date with an earlier one
        const { data: currentContact } = await sb
          .from("contacts")
          .select("next_call_at")
          .eq("id", contactId)
          .single();
        const existingNextCall = currentContact?.next_call_at ? new Date(currentContact.next_call_at) : null;
        const safeNextCallAt = nextCallAt && existingNextCall && existingNextCall > nextCallAt
          ? existingNextCall.toISOString()
          : (nextCallAt?.toISOString() ?? null);

        await sb.rpc("update_contact_after_call", {
          p_contact_id: contactId,
          p_outcome: outcome,
          p_duration_sec: durationSeconds || 0,
          p_agent_id: agentId || null,
          p_ai_summary: null,
          p_next_call_at: safeNextCallAt,
          p_sentiment: sentiment,
        });

        log("info", "Contact CRM updated after call (fallback, no AI outcome)", {
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
    }

    // 6. Update outbound_call_log with outcome/sentiment if linked
    if (contactId && conversationId) {
      const sentiment = analyzeSentiment(transcript || []);
      const outcome = outcomeAi || determineOutcome(callStatus, durationSeconds);
      const isVoicemail = outcome === "voicemail";

      await sb
        .from("outbound_call_log")
        .update({
          outcome,
          sentiment,
          duration_sec: durationSeconds || 0,
          ended_at: new Date().toISOString(),
          is_voicemail: isVoicemail,
        })
        .eq("el_conversation_id", conversationId);

      // 7. Voicemail tracking: increment counter; auto-pause after 3 consecutive voicemails
      if (isVoicemail) {
        const { data: contactData } = await sb
          .from("contacts")
          .select("voicemail_count")
          .eq("id", contactId)
          .single();

        const newVoicemailCount = (contactData?.voicemail_count ?? 0) + 1;
        const MAX_VOICEMAILS = 3;

        const voicemailUpdate: Record<string, unknown> = {
          voicemail_count: newVoicemailCount,
          last_voicemail_at: new Date().toISOString(),
        };

        // After MAX_VOICEMAILS consecutive voicemails, block further outbound calls
        if (newVoicemailCount >= MAX_VOICEMAILS) {
          voicemailUpdate.do_not_call = true;
          voicemailUpdate.do_not_call_reason = `Segreteria per ${MAX_VOICEMAILS} chiamate consecutive — sospeso automaticamente`;
          log("warn", "Contact auto-paused: too many voicemails", {
            request_id: requestId,
            contact_id: contactId,
            voicemail_count: newVoicemailCount,
          });
        }

        await sb.from("contacts").update(voicemailUpdate).eq("id", contactId);
      } else if (outcome === "answered" || outcome === "appointment" || outcome === "qualified") {
        // Reset voicemail counter when contact actually answers
        await sb.from("contacts").update({ voicemail_count: 0 }).eq("id", contactId);
      }
    }

    // 8. Callback auto-scheduling: if a next_call_at was suggested and agent is known,
    //    automatically create a pending scheduled_call so the cron picks it up.
    if (contactId && agentId) {
      const outcome = outcomeAi || determineOutcome(callStatus, durationSeconds);
      const nextCallAt = suggestNextCallTime(outcome, analyzeSentiment(transcript || []));

      if (nextCallAt && nextCallAt > new Date()) {
        // Avoid duplicate scheduling: check no pending call already exists for this contact
        const { count: existing } = await sb
          .from("scheduled_calls")
          .select("id", { count: "exact", head: true })
          .eq("contact_id", contactId)
          .eq("status", "pending")
          .gte("scheduled_at", new Date().toISOString());

        if (!existing || existing === 0) {
          const { error: schedErr } = await sb.from("scheduled_calls").insert({
            company_id: companyId,
            contact_id: contactId,
            agent_id: agentId,
            scheduled_at: nextCallAt.toISOString(),
            status: "pending",
            notes: `Richiamata automatica — esito precedente: ${outcome}`,
          });

          if (!schedErr) {
            log("info", "Callback auto-scheduled", {
              request_id: requestId,
              contact_id: contactId,
              scheduled_at: nextCallAt.toISOString(),
              outcome,
            });
          }
        }
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

  // Multi-word negative phrases must be checked before single positive words
  // to correctly handle negations like "non mi interessa", "non sono interessato"
  const negationPrefixes = ["non ", "no ", "niente ", "neanche ", "mai "];
  const positiveRoots = ["interessat", "perfetto", "ottimo", "quando", "appuntamento", "certo", "volentieri", "disponibil", "procediamo", "confermo"];
  const strongNegatives = ["lasci stare", "non mi interessa", "non voglio", "basta così", "non sono interessato", "rimuovete", "non chiamate", "toglietemi"];

  const userMessages = transcript
    .filter((t: any) => t.role === "user")
    .map((t: any) => (t.message || t.text || "").toLowerCase());

  const fullText = userMessages.join(" ");

  // Count strong negatives first (multi-word, unambiguous)
  let negScore = strongNegatives.filter((phrase) => fullText.includes(phrase)).length;

  // Count positive roots — but discount if preceded by a negation within the same sentence
  let posScore = 0;
  for (const msg of userMessages) {
    for (const root of positiveRoots) {
      if (!msg.includes(root)) continue;
      const preceded = negationPrefixes.some((neg) => {
        const idx = msg.indexOf(root);
        return idx > 0 && msg.slice(Math.max(0, idx - 20), idx).includes(neg);
      });
      if (preceded) negScore++;
      else posScore++;
    }
  }

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
