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

    // Optional: restrict to specific company or run for all
    let targetCompanyId: string | null = null;
    try {
      const body = await req.json();
      targetCompanyId = body.company_id || null;
    } catch { /* cron call with no body */ }

    // Get companies to report on
    const companyQuery = sb.from("companies").select("id, name");
    if (targetCompanyId) companyQuery.eq("id", targetCompanyId);
    const { data: companies } = await companyQuery;
    if (!companies || companies.length === 0) return jsonOk({ message: "No companies" }, rid);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoISO = weekAgo.toISOString();
    const reports: { company: string; sent: boolean; error?: string }[] = [];

    for (const company of companies) {
      try {
        // Gather weekly stats
        const { count: totalCalls } = await sb.from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id)
          .gte("started_at", weekAgoISO);

        const { count: qualifiedCalls } = await sb.from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id)
          .gte("started_at", weekAgoISO)
          .in("outcome", ["qualified", "appointment", "interested"]);

        const { count: newContacts } = await sb.from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id)
          .gte("created_at", weekAgoISO);

        const { count: newPreventivi } = await sb.from("preventivi")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id)
          .gte("created_at", weekAgoISO);

        const { data: credits } = await sb.from("ai_credits")
          .select("balance_eur")
          .eq("company_id", company.id)
          .single();

        const conversionRate = (totalCalls || 0) > 0
          ? ((qualifiedCalls || 0) / (totalCalls || 0) * 100).toFixed(1)
          : "0.0";

        // Get admin email
        const { data: adminRoles } = await sb.from("user_roles")
          .select("user_id")
          .eq("role", "company_admin");

        const { data: adminProfiles } = await sb.from("profiles")
          .select("id, email, full_name, company_id")
          .eq("company_id", company.id);

        const adminProfile = adminProfiles?.find(p =>
          adminRoles?.some(r => r.user_id === p.id)
        );

        if (!adminProfile?.email) {
          reports.push({ company: company.name, sent: false, error: "No admin email" });
          continue;
        }

        // Build HTML report
        const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e;">
<h1 style="color:#3ECF6E;font-size:24px;">📊 Report Settimanale</h1>
<p>Ciao ${adminProfile.full_name || ""},</p>
<p>Ecco il riepilogo della settimana per <strong>${company.name}</strong>:</p>

<table style="width:100%;border-collapse:collapse;margin:20px 0;">
<tr style="background:#f8f9fa;"><td style="padding:12px;border:1px solid #dee2e6;font-weight:600;">📞 Chiamate totali</td><td style="padding:12px;border:1px solid #dee2e6;text-align:right;font-size:20px;">${totalCalls || 0}</td></tr>
<tr><td style="padding:12px;border:1px solid #dee2e6;font-weight:600;">✅ Qualificate / Appuntamenti</td><td style="padding:12px;border:1px solid #dee2e6;text-align:right;font-size:20px;">${qualifiedCalls || 0}</td></tr>
<tr style="background:#f8f9fa;"><td style="padding:12px;border:1px solid #dee2e6;font-weight:600;">📈 Tasso conversione</td><td style="padding:12px;border:1px solid #dee2e6;text-align:right;font-size:20px;">${conversionRate}%</td></tr>
<tr><td style="padding:12px;border:1px solid #dee2e6;font-weight:600;">👤 Nuovi contatti</td><td style="padding:12px;border:1px solid #dee2e6;text-align:right;font-size:20px;">${newContacts || 0}</td></tr>
<tr style="background:#f8f9fa;"><td style="padding:12px;border:1px solid #dee2e6;font-weight:600;">📋 Preventivi creati</td><td style="padding:12px;border:1px solid #dee2e6;text-align:right;font-size:20px;">${newPreventivi || 0}</td></tr>
<tr><td style="padding:12px;border:1px solid #dee2e6;font-weight:600;">💰 Saldo crediti</td><td style="padding:12px;border:1px solid #dee2e6;text-align:right;font-size:20px;">€${Number(credits?.balance_eur || 0).toFixed(2)}</td></tr>
</table>

<p style="color:#637485;font-size:13px;">Report generato automaticamente da EdileGenius AI.</p>
</body></html>`;

        // Send via Resend if configured
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "EdileGenius <noreply@edilegenius.com>",
              to: adminProfile.email,
              subject: `📊 Report Settimanale — ${company.name}`,
              html,
            }),
          });

          if (emailRes.ok) {
            reports.push({ company: company.name, sent: true });
          } else {
            const errText = await emailRes.text();
            reports.push({ company: company.name, sent: false, error: `Resend ${emailRes.status}: ${errText.slice(0, 100)}` });
          }
        } else {
          // No email service — log the report
          log("info", "Weekly report generated (no email service)", { request_id: rid, company_id: company.id });
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
