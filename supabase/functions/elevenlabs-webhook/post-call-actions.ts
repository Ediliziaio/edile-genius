import { log } from "../_shared/utils.ts";

/**
 * Post-Call Actions: auto-update contact status based on AI-classified outcome.
 * Matches conversation caller_number to contacts phone field.
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
      // Normalize: try with and without country code prefix
      const normalizedNumbers = [callerNumber];
      if (callerNumber.startsWith("+39")) {
        normalizedNumbers.push(callerNumber.slice(3));
      } else if (!callerNumber.startsWith("+")) {
        normalizedNumbers.push(`+39${callerNumber}`);
      }

      const { data: contacts } = await sb
        .from("contacts")
        .select("id, status")
        .eq("company_id", companyId)
        .in("phone", normalizedNumbers)
        .limit(1);

      if (contacts && contacts.length > 0) {
        contactId = contacts[0].id;
      }
    }

    // 2. Also try to find contact via conversation's existing contact linkage
    if (!contactId && conversationId) {
      const { data: conv } = await sb
        .from("conversations")
        .select("id, caller_number")
        .eq("el_conv_id", conversationId)
        .maybeSingle();

      if (conv?.caller_number && conv.caller_number !== callerNumber) {
        const { data: contacts } = await sb
          .from("contacts")
          .select("id, status")
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

    // 3. Map AI outcome to contact status
    const statusMap: Record<string, string> = {
      appointment: "qualified",
      qualified: "qualified",
      callback: "callback",
      not_interested: "not_interested",
      do_not_call: "do_not_call",
      wrong_number: "invalid",
      voicemail: "new",     // don't change status on voicemail
      no_answer: "new",     // don't change status on no answer
    };

    const newStatus = statusMap[outcomeAi];
    const skipStatuses = ["new"]; // don't downgrade to "new"

    if (newStatus && !skipStatuses.includes(newStatus)) {
      const updateData: Record<string, any> = {
        status: newStatus,
        last_contact_at: new Date().toISOString(),
      };

      // Set callback time if outcome is callback (next business day 10am)
      if (outcomeAi === "callback") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Skip weekend
        if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow.getDay() === 6) tomorrow.setDate(tomorrow.getDate() + 2);
        tomorrow.setHours(10, 0, 0, 0);
        updateData.next_call_at = tomorrow.toISOString();
      }

      // Store next_step as note
      if (nextStep) {
        updateData.notes = nextStep;
      }

      await sb.from("contacts").update(updateData).eq("id", contactId);

      log("info", "Post-call action: contact updated", {
        request_id: requestId,
        contact_id: contactId,
        new_status: newStatus,
        outcome_ai: outcomeAi,
      });
    } else {
      // Still update last_contact_at
      await sb.from("contacts").update({
        last_contact_at: new Date().toISOString(),
      }).eq("id", contactId);

      log("info", "Post-call action: updated last_contact_at only", {
        request_id: requestId,
        contact_id: contactId,
        outcome_ai: outcomeAi,
      });
    }
  } catch (err) {
    log("warn", "Post-call actions failed (non-blocking)", {
      request_id: requestId,
      error: (err as Error).message,
    });
  }
}
