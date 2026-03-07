import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instanceId, companyId, reportData } = await req.json();

    if (!instanceId || !companyId) {
      return new Response(JSON.stringify({ error: "instanceId and companyId required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const parsed = typeof reportData === "string" ? JSON.parse(reportData) : reportData || {};

    // Insert report
    const { data: report, error: reportErr } = await sb
      .from("agent_reports")
      .insert({
        instance_id: instanceId,
        company_id: companyId,
        date: parsed.data || new Date().toISOString().split("T")[0],
        raw_data: parsed,
        report_html: parsed.report_html || null,
        report_summary: parsed.report_summary || null,
        status: "sent",
      })
      .select()
      .single();

    if (reportErr) {
      return new Response(JSON.stringify({ error: reportErr.message }), { status: 500, headers: corsHeaders });
    }

    // Update instance counters
    const { data: instance } = await sb
      .from("agent_template_instances")
      .select("reports_generated")
      .eq("id", instanceId)
      .single();

    await sb
      .from("agent_template_instances")
      .update({
        reports_generated: ((instance as any)?.reports_generated || 0) + 1,
        last_run_at: new Date().toISOString(),
      })
      .eq("id", instanceId);

    return new Response(
      JSON.stringify({ success: true, reportId: report.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: corsHeaders });
  }
});
