import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "send-cantiere-report-email";

  try {
    // ── Auth: internal-only (service role or cron secret) ──
    const authHeader = req.headers.get("Authorization");
    const isServiceRole = authHeader === `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
    if (!isServiceRole) {
      return jsonError("Unauthorized — internal only", "auth_error", 401, rid);
    }

    const { report_id, destinatari, company_id } = await req.json();
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Verify report belongs to company
    const { data: report } = await sb.from("agent_reports").select("*").eq("id", report_id).eq("company_id", company_id).single();
    if (!report) return jsonError("Report non trovato", "not_found", 404, rid);

    const { data: company } = await sb.from("companies").select("name").eq("id", company_id).single();

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return jsonError("RESEND_API_KEY non configurata", "system_error", 500, rid);

    let cantiereNome = "Cantiere";
    if ((report as any).cantiere_id) {
      const { data: cantiere } = await sb.from("cantieri").select("nome").eq("id", (report as any).cantiere_id).single();
      if (cantiere) cantiereNome = cantiere.nome;
    }

    for (const email of destinatari) {
      try {
        await fetchWithTimeout("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `${company?.name || "Edilizia.io"} <noreply@edilegenius.it>`,
            to: [email],
            subject: `📋 Report Cantiere ${cantiereNome} — ${report.date}`,
            html: report.report_html || "<p>Report non disponibile</p>",
            text: report.report_summary || "",
          }),
        }, 10_000);
      } catch (e) {
        log("warn", "Resend email failed", { request_id: rid, fn: FN, to: email, error: e instanceof Error ? e.message : "unknown" });
      }
    }

    log("info", "Emails sent", { request_id: rid, fn: FN, count: destinatari.length });
    return jsonOk({ success: true, inviata_a: destinatari }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
