import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { preventivo_id } = await req.json();
    if (!preventivo_id) {
      return new Response(JSON.stringify({ error: "preventivo_id richiesto" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: prev, error } = await adminClient
      .from("preventivi")
      .select("*, companies(name, address, phone, vat_number)")
      .eq("id", preventivo_id)
      .single();

    if (error || !prev) {
      return new Response(JSON.stringify({ error: "Preventivo non trovato" }), { status: 404, headers: corsHeaders });
    }

    const voci = (prev.voci as any[]) || [];
    const company = (prev as any).companies;

    // Generate HTML
    const vociRows = voci.map((v: any, i: number) => `
      <tr>
        <td>${i + 1}</td>
        <td>${v.descrizione || ""}</td>
        <td>${v.unita || ""}</td>
        <td style="text-align:right">${(v.quantita || 0).toFixed(2)}</td>
        <td style="text-align:right">€${(v.prezzo_unitario || 0).toFixed(2)}</td>
        <td style="text-align:right">€${(v.totale || 0).toFixed(2)}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; font-size: 14px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .company { font-weight: bold; font-size: 18px; }
  .company-details { font-size: 12px; color: #666; margin-top: 4px; }
  .title { font-size: 22px; font-weight: bold; color: #1a1a2e; margin: 20px 0; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
  .info-box { background: #f8f9fa; padding: 16px; border-radius: 8px; }
  .info-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .info-value { font-size: 14px; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #1a1a2e; color: white; padding: 10px; text-align: left; font-size: 12px; }
  td { padding: 10px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #f8f9fa; }
  .totals { text-align: right; margin-top: 20px; }
  .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 8px 0; }
  .totals .total-final { font-size: 20px; font-weight: bold; color: #1a1a2e; border-top: 2px solid #1a1a2e; padding-top: 12px; }
  .notes { background: #fff3cd; padding: 16px; border-radius: 8px; margin-top: 30px; }
  .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
</style></head>
<body>
  <div class="header">
    <div>
      <div class="company">${company?.name || "Azienda"}</div>
      <div class="company-details">${company?.address || ""}<br>${company?.phone || ""}<br>P.IVA: ${company?.vat_number || ""}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;color:#888">PREVENTIVO N.</div>
      <div style="font-size:20px;font-weight:bold;color:#1a1a2e">${prev.numero_preventivo}</div>
      <div style="font-size:12px;color:#888;margin-top:4px">Data: ${new Date(prev.created_at).toLocaleDateString("it-IT")}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="info-label">Cliente</div>
      <div class="info-value">${prev.cliente_nome || "—"}</div>
      <div style="font-size:12px;color:#666;margin-top:4px">${prev.cliente_indirizzo || ""}</div>
      <div style="font-size:12px;color:#666">${prev.cliente_telefono || ""} ${prev.cliente_email || ""}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Oggetto</div>
      <div class="info-value">${prev.oggetto || "—"}</div>
    </div>
  </div>

  <table>
    <thead><tr><th>#</th><th>Descrizione</th><th>U.M.</th><th style="text-align:right">Q.tà</th><th style="text-align:right">Prezzo Unit.</th><th style="text-align:right">Totale</th></tr></thead>
    <tbody>${vociRows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Subtotale:</span><span>€${(prev.subtotale || 0).toFixed(2)}</span></div>
    <div class="row"><span>IVA (${prev.iva_percentuale || 22}%):</span><span>€${((prev.totale || 0) - (prev.subtotale || 0)).toFixed(2)}</span></div>
    <div class="row total-final"><span>TOTALE:</span><span>€${(prev.totale || 0).toFixed(2)}</span></div>
  </div>

  ${prev.note ? `<div class="notes"><strong>Note:</strong> ${prev.note}</div>` : ""}

  <div class="footer">Documento generato automaticamente — ${company?.name || "Edilizia.io"}</div>
</body>
</html>`;

    // Save HTML as the "PDF" (client will convert with html2pdf.js)
    const pdfPath = `${prev.company_id}/${prev.id}.html`;
    const { error: storageErr } = await adminClient.storage
      .from("preventivi-pdf")
      .upload(pdfPath, html, { contentType: "text/html", upsert: true });

    if (storageErr) throw new Error(`Storage error: ${storageErr.message}`);

    const { data: urlData } = adminClient.storage.from("preventivi-pdf").getPublicUrl(pdfPath);

    // Update preventivo with pdf_url
    await adminClient.from("preventivi").update({ pdf_url: urlData.publicUrl }).eq("id", preventivo_id);

    return new Response(JSON.stringify({ html, pdf_url: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("generate-preventivo-pdf error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
