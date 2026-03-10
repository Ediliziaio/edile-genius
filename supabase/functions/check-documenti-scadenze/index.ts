import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date();
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
    const in15 = new Date(today); in15.setDate(in15.getDate() + 15);
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);

    const { data: docs, error } = await adminClient
      .from("documenti_azienda")
      .select("*, cantiere_operai(nome, cognome), companies(name)")
      .lte("data_scadenza", in30.toISOString().split("T")[0]);

    if (error) throw error;
    if (!docs || docs.length === 0) {
      return new Response(JSON.stringify({ message: "Nessun documento in scadenza" }), { headers: corsHeaders });
    }

    const alerts: any[] = [];

    for (const doc of docs) {
      const scadenza = new Date(doc.data_scadenza);
      const diffDays = Math.ceil((scadenza.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let alertType = "";
      let shouldUpdate = false;

      if (diffDays <= 0 && !doc.alert_scaduto) {
        alertType = "scaduto";
        shouldUpdate = true;
        await adminClient.from("documenti_azienda").update({ alert_scaduto: true, stato: "scaduto" }).eq("id", doc.id);
      } else if (diffDays <= 7 && diffDays > 0 && !doc.alert_7g) {
        alertType = "7g";
        shouldUpdate = true;
        await adminClient.from("documenti_azienda").update({ alert_7g: true, stato: "in_scadenza" }).eq("id", doc.id);
      } else if (diffDays <= 15 && diffDays > 7 && !doc.alert_15g) {
        alertType = "15g";
        shouldUpdate = true;
        await adminClient.from("documenti_azienda").update({ alert_15g: true }).eq("id", doc.id);
      } else if (diffDays <= 30 && diffDays > 15 && !doc.alert_30g) {
        alertType = "30g";
        shouldUpdate = true;
        await adminClient.from("documenti_azienda").update({ alert_30g: true }).eq("id", doc.id);
      }

      if (shouldUpdate) {
        alerts.push({
          documento: doc.nome,
          tipo: doc.tipo,
          operaio: doc.cantiere_operai ? `${doc.cantiere_operai.nome} ${doc.cantiere_operai.cognome || ""}` : "Azienda",
          scadenza: doc.data_scadenza,
          alert: alertType,
          company_id: doc.company_id,
          company_name: (doc as any).companies?.name,
        });
      }
    }

    // Send email alerts grouped by company
    if (RESEND_API_KEY && alerts.length > 0) {
      const byCompany = alerts.reduce((acc: any, a) => {
        if (!acc[a.company_id]) acc[a.company_id] = { name: a.company_name, alerts: [] };
        acc[a.company_id].alerts.push(a);
        return acc;
      }, {});

      // Get company admin emails from profiles
      for (const [companyId, data] of Object.entries(byCompany)) {
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("email")
          .eq("company_id", companyId);

        if (!profiles?.length) continue;

        const companyAlerts = (data as any).alerts;
        const alertRows = companyAlerts.map((a: any) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${a.operaio}</td>
            <td style="padding:8px;border-bottom:1px solid #eee">${a.tipo}</td>
            <td style="padding:8px;border-bottom:1px solid #eee">${a.documento}</td>
            <td style="padding:8px;border-bottom:1px solid #eee">${a.scadenza}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;color:${a.alert === 'scaduto' ? '#dc2626' : a.alert === '7g' ? '#ea580c' : '#ca8a04'}">${a.alert === 'scaduto' ? '⛔ SCADUTO' : `⚠️ ${a.alert}`}</td>
          </tr>
        `).join("");

        const html = `
          <div style="font-family:sans-serif;max-width:600px;margin:auto">
            <h2 style="color:#1a1a2e">🔔 Alert Scadenze Documenti</h2>
            <p>I seguenti documenti richiedono attenzione:</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              <thead><tr style="background:#f1f5f9">
                <th style="padding:8px;text-align:left">Persona</th>
                <th style="padding:8px;text-align:left">Tipo</th>
                <th style="padding:8px;text-align:left">Documento</th>
                <th style="padding:8px;text-align:left">Scadenza</th>
                <th style="padding:8px;text-align:left">Stato</th>
              </tr></thead>
              <tbody>${alertRows}</tbody>
            </table>
            <p style="color:#666;font-size:12px">Accedi a edilizia.io per gestire i documenti.</p>
          </div>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Edilizia.io <noreply@edilizia.io>",
            to: profiles.map((p: any) => p.email),
            subject: `⚠️ ${companyAlerts.length} documenti in scadenza — ${(data as any).name}`,
            html,
          }),
        });
      }
    }

    return new Response(JSON.stringify({ alerts_sent: alerts.length, details: alerts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("check-documenti-scadenze error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
