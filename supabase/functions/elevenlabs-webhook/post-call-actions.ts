import { log } from "../_shared/utils.ts";

/**
 * Post-Call Actions: Atomic pipeline using process_post_call_atomic RPC.
 * Single transaction: contact update + action log + campaign exclusion.
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
  }
) {
  const { companyId, conversationId, callerNumber, outcomeAi, nextStep, requestId } = opts;

  if (!outcomeAi) {
    log("info", "No AI outcome — skipping post-call actions", { request_id: requestId });
    return;
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

    if (!contactId) {
      log("info", "No matching contact found for post-call action", {
        request_id: requestId,
        caller_number: callerNumber,
      });
      return;
    }

    // 3. Build action log entry
    const actionLogEntry = {
      ts: new Date().toISOString(),
      type: "post_call",
      outcome: outcomeAi,
      next_step: nextStep,
      conversation_id: conversationId,
    };

    // 4. Execute atomic RPC — single transaction for all updates
    const { data, error } = await sb.rpc("process_post_call_atomic", {
      p_contact_id: contactId,
      p_company_id: companyId,
      p_outcome: outcomeAi,
      p_next_step: nextStep || null,
      p_conversation_id: conversationId || null,
      p_action_log_entry: actionLogEntry,
    });

    if (error) {
      throw new Error(`process_post_call_atomic failed: ${error.message}`);
    }

    if (!data?.success) {
      log("warn", "Post-call atomic RPC returned failure", {
        request_id: requestId,
        contact_id: contactId,
        error: data?.error,
      });
      return;
    }

    log("info", "Post-call action completed (atomic)", {
      request_id: requestId,
      contact_id: contactId,
      new_status: data.new_status,
      outcome_ai: outcomeAi,
      campaigns_excluded: data.campaigns_excluded,
    });
  } catch (err) {
    log("warn", "Post-call actions failed (non-blocking)", {
      request_id: requestId,
      error: (err as Error).message,
    });
  }
}
