import { log } from "../_shared/utils.ts";

/**
 * Post-Call Actions: Enhanced autonomous pipeline manager.
 * Auto-updates contact status, logs AI actions, removes from campaigns, schedules callbacks.
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
    let currentContact: any = null;

    if (callerNumber) {
      const normalizedNumbers = [callerNumber];
      if (callerNumber.startsWith("+39")) {
        normalizedNumbers.push(callerNumber.slice(3));
      } else if (!callerNumber.startsWith("+")) {
        normalizedNumbers.push(`+39${callerNumber}`);
      }

      const { data: contacts } = await sb
        .from("contacts")
        .select("id, status, ai_actions_log, call_attempts")
        .eq("company_id", companyId)
        .in("phone", normalizedNumbers)
        .limit(1);

      if (contacts && contacts.length > 0) {
        contactId = contacts[0].id;
        currentContact = contacts[0];
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
        const { data: c } = await sb.from("contacts")
          .select("id, status, ai_actions_log, call_attempts")
          .eq("id", contactId)
          .single();
        if (c) currentContact = c;
      } else if (conv?.caller_number && conv.caller_number !== callerNumber) {
        const { data: contacts } = await sb
          .from("contacts")
          .select("id, status, ai_actions_log, call_attempts")
          .eq("company_id", companyId)
          .eq("phone", conv.caller_number)
          .limit(1);
        if (contacts && contacts.length > 0) {
          contactId = contacts[0].id;
          currentContact = contacts[0];
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

    // 3. Build AI action log entry
    const actionLog = {
      ts: new Date().toISOString(),
      type: "post_call",
      outcome: outcomeAi,
      next_step: nextStep,
      conversation_id: conversationId,
    };

    const existingLog = Array.isArray(currentContact?.ai_actions_log) ? currentContact.ai_actions_log : [];
    const updatedLog = [...existingLog, actionLog].slice(-50); // Keep last 50 entries

    // 4. Map AI outcome to contact status with enhanced logic
    const statusMap: Record<string, string> = {
      appointment: "qualified",
      qualified: "qualified",
      callback: "callback",
      not_interested: "not_interested",
      do_not_call: "do_not_call",
      wrong_number: "invalid",
      voicemail: "new",
      no_answer: "new",
    };

    const newStatus = statusMap[outcomeAi];
    const skipStatuses = ["new"]; // don't downgrade to "new"

    const updateData: Record<string, any> = {
      last_contact_at: new Date().toISOString(),
      ai_actions_log: updatedLog,
      call_attempts: (currentContact?.call_attempts || 0) + 1,
    };

    if (newStatus && !skipStatuses.includes(newStatus)) {
      updateData.status = newStatus;

      // ── APPOINTMENT: set next_call_at as reminder ──
      if (outcomeAi === "appointment") {
        // Set reminder for tomorrow 9am (confirmation call)
        const reminder = new Date();
        reminder.setDate(reminder.getDate() + 1);
        if (reminder.getDay() === 0) reminder.setDate(reminder.getDate() + 1);
        if (reminder.getDay() === 6) reminder.setDate(reminder.getDate() + 2);
        reminder.setHours(9, 0, 0, 0);
        updateData.next_call_at = reminder.toISOString();
      }

      // ── CALLBACK: schedule callback for next business day ──
      if (outcomeAi === "callback") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow.getDay() === 6) tomorrow.setDate(tomorrow.getDate() + 2);
        tomorrow.setHours(10, 0, 0, 0);
        updateData.next_call_at = tomorrow.toISOString();
      }

      // ── NOT_INTERESTED / DO_NOT_CALL: remove from active campaigns ──
      if (outcomeAi === "not_interested" || outcomeAi === "do_not_call") {
        try {
          // Get active campaigns for this company
          const { data: activeCampaigns } = await sb
            .from("campaigns")
            .select("id")
            .eq("company_id", companyId)
            .in("status", ["active", "scheduled"]);

          if (activeCampaigns && activeCampaigns.length > 0) {
            const campaignIds = activeCampaigns.map((c: any) => c.id);
            const { count } = await sb
              .from("campaign_contacts")
              .update({ status: "excluded", updated_at: new Date().toISOString() })
              .eq("contact_id", contactId)
              .in("campaign_id", campaignIds)
              .in("status", ["pending", "retry"]);

            if (count && count > 0) {
              log("info", "Excluded contact from active campaigns", {
                request_id: requestId,
                contact_id: contactId,
                campaigns_affected: count,
              });
            }
          }
        } catch (err) {
          log("warn", "Failed to exclude from campaigns (non-blocking)", {
            request_id: requestId,
            error: (err as Error).message,
          });
        }
      }

      // Store next_step as note
      if (nextStep) {
        updateData.notes = nextStep;
      }
    }

    await sb.from("contacts").update(updateData).eq("id", contactId);

    log("info", "Post-call action completed", {
      request_id: requestId,
      contact_id: contactId,
      new_status: updateData.status || "(unchanged)",
      outcome_ai: outcomeAi,
      actions_logged: updatedLog.length,
    });
  } catch (err) {
    log("warn", "Post-call actions failed (non-blocking)", {
      request_id: requestId,
      error: (err as Error).message,
    });
  }
}
