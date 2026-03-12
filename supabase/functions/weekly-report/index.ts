import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

const FN = "weekly-report";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let targetCompanyId: string | null = null;
    try {
      const body = await req.json();
      targetCompanyId = body.company_id || null;
    } catch { /* cron call with no body */ }

    const companyQuery = sb.from("companies").select("id, name");
    if (targetCompanyId) companyQuery.eq("id", targetCompanyId);
    const { data: companies } = await companyQuery;
    if (!companies || companies.length === 0) return jsonOk({ message: "No companies" }, rid);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoISO = weekAgo.toISOString();
    // Week start = Monday of the current week
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
    const weekStartDate = weekStart.toISOString().split("T")[0];

    const reports: { company: string; sent: boolean; error?: string }[] = [];

    for (const company of companies) {
      try {
        // Gather weekly stats
        const [totalCallsRes, qualifiedCallsRes, newContactsRes, newPreventiviRes, creditsRes] =
          await Promise.all([
            sb.from("conversations")
              .select("id", { count: "exact", head: true })
              .eq("company_id", company.id)
              .gte("started_at", weekAgoISO),
            sb.from("conversations")
              .select("id", { count: "exact", head: true })
              .eq("company_id", company.id)
              .gte("started_at", weekAgoISO)
              .in("outcome", ["qualified", "appointment", "interested"]),
            sb.from("contacts")
              .select("id", { count: "exact", head: true })
              .eq("company_id", company.id)
              .gte("created_at", weekAgoISO),
            sb.from("preventivi")
              .select("id", { count: "exact", head: true })
              .eq("company_id", company.id)
              .gte("created_at", weekAgoISO),
            sb.from("ai_credits")
              .select("balance_eur")
              .eq("company_id", company.id)
              .single(),
          ]);

        const totalCalls = totalCallsRes.count || 0;
        const qualifiedCalls = qualifiedCallsRes.count || 0;
        const newContacts = newContactsRes.count || 0;
        const newPreventivi = newPreventiviRes.count || 0;

        const conversionRate = totalCalls > 0
          ? ((qualifiedCalls / totalCalls) * 100).toFixed(1)
          : "0.0";

        // Get admin email
        const { data: adminRoles } = await sb.from("user_roles")
          .select("user_id")
          .eq("role", "company_admin");

        const { data: adminProfiles } = await sb.from("profiles")
          .select("id, email, full_name, company_id")
          .eq("company_id", company.id);

        const adminProfile = adminProfiles?.find((p: any) =>
          adminRoles?.some((r: any) => r.user_id === p.id)
        );

        if (!adminProfile?.email) {
          reports.push({ company: company.name, sent: false, error: "No admin email" });
          continue;
        }

        // Build HTML report
        const html = buildReportHtml({
          adminName: adminProfile.full_name || "",
          companyName: company.name,
          totalCalls,
          qualifiedCalls,
          conversionRate,
          newContacts,
          newPreventivi,
          balance: Number(creditsRes.data?.balance_eur || 0),
        });

        // Create log entry
        const { data: logEntry } = await sb.from("weekly_reports_log").upsert({
          company_id: company.id,
          week_start: weekStartDate,
          status: "pending",
          retry_count: 0,
        }, { onConflict: "company_id,week_start" }).select("id").single();

        // Send via Resend with retry
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          const emailPayload = {
            from: "EdileGenius <noreply@edilegenius.com>",
            to: adminProfile.email,
            subject: `📊 Report Settimanale — ${company.name}`,
            html,
          };

          const { sent, attempts } = await sendEmailWithRetry(resendKey, emailPayload);

          if (logEntry?.id) {
            await sb.from("weekly_reports_log").update({
              status: sent ? "sent" : "failed",
              sent_at: sent ? new Date().toISOString() : null,
              error_message: sent ? null : "Max retries exceeded",
              retry_count: attempts,
            }).eq("id", logEntry.id);
          }

          reports.push({
            company: company.name,
            sent,
            ...(sent ? {} : { error: `Failed after ${attempts} attempts` }),
          });
        } else {
          log("info", "Weekly report generated (no email service)", { request_id: rid, company_id: company.id });
          if (logEntry?.id) {
            await sb.from("weekly_reports_log").update({
              status: "failed",
              error_message: "RESEND_API_KEY not configured",
            }).eq("id", logEntry.id);
          }
          reports.push({ company: company.name, sent: false, error: "RESEND_API_KEY not configured" });
        }
      } catch (companyErr) {
        reports.push({ company: company.name, sent: false, error: (companyErr as Error).message.slice(0, 100) });
      }
    }

    log("info", "Weekly reports processed", { request_id: rid, reports: reports.length });
    return jsonOk({ reports }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});

/** Send email with exponential backoff retry (max 3 attempts) */
async function sendEmailWithRetry(
  resendKey: string,
  payload: { from: string; to: string; subject: string; html: string },
  maxRetries = 3
): Promise<{ sent: boolean; attempts: number }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) return { sent: true, attempts: attempt };

      const errText = await res.text();
      log("warn", `Email attempt ${attempt}/${maxRetries} failed: ${res.status}`, { error: errText.slice(0, 100) });

      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); // 2s, 4s
      }
    } catch (err) {
      log("warn", `Email attempt ${attempt}/${maxRetries} error`, { error: (err as Error).message });
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  return { sent: false, attempts: maxRetries };
}

function buildReportHtml(d: {
  adminName: string; companyName: string; totalCalls: number;
  qualifiedCalls: number; conversionRate: string; newContacts: number;
  newPreventivi: number; balance: number;
}): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e;">
<h1 style="color:#3ECF6E;font-size:24px;">📊 Report Settimanale</h1>
<p>Ciao ${d.adminName},</p>
<p>Ecco il riepilogo della settimana per <strong>${d.companyName}</strong>:</p>
<table style="width:100%;border-collapse:collapse;margin:20px 0;">
<tr style="background:#f8f9fa;"><td style="padding:12px;border:1px solid #dee2e6;font-weight:600;">📞 Chiamate totali</td><td style="padding:12px;border:1px solid #dee2e6;text-align:right;font-size:20px;">${d.totalCalls}</td></tr>
<tr><td style="padding:12px;border:1px solid #dee2e6;font-weight:600;">✅ Qualificate / Appuntamenti</td><td style="padding:12px;border:1px solid #dee2e6;text-align:right;font-size:20px;">${d.qualifiedCalls}</td></tr>
<tr style="background:#f8f9fa;"><td style="padding:12px;border:1px solid #dee2e6;font-weight:600;">📈 Tasso conversione</td><td style="padding:12px;border:1px solid #dee2e6;text-align:right;font-size:20px;">${d.conversionRate}%</td></tr>
<tr><td style="padding:12px;border:1px solid #dee2e6;font-weight:600;">👤 Nuovi contatti</td><td style="padding:12px;border:1px solid #dee2e6;text-align:right;font-size:20px;">${d.newContacts}</td></tr>
<tr style="background:#f8f9fa;"><td style="padding:12px;border:1px solid #dee2e6;font-weight:600;">📋 Preventivi creati</td><td style="padding:12px;border:1px solid #dee2e6;text-align:right;font-size:20px;">${d.newPreventivi}</td></tr>
<tr><td style="padding:12px;border:1px solid #dee2e6;font-weight:600;">💰 Saldo crediti</td><td style="padding:12px;border:1px solid #dee2e6;text-align:right;font-size:20px;">€${d.balance.toFixed(2)}</td></tr>
</table>
<p style="color:#637485;font-size:13px;">Report generato automaticamente da EdileGenius AI.</p>
</body></html>`;
}
