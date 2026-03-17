import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { preventivo_id, messaggio_personalizzato, pdf_url } = await req.json();

  // Load preventivo
  const { data: preventivo, error: prevErr } = await supabase
    .from("preventivi")
    .select("*")
    .eq("id", preventivo_id)
    .single();

  if (prevErr || !preventivo) {
    return new Response(
      JSON.stringify({ error: "Preventivo non trovato" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Load company
  const { data: company } = await supabase
    .from("companies")
    .select("name, email, logo_url")
    .eq("id", preventivo.company_id)
    .single();

  const companyName = company?.name || "";
  const companyEmail = company?.email || "";

  if (!preventivo.cliente_email) {
    return new Response(
      JSON.stringify({ error: "Email cliente mancante nel preventivo" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Try to download PDF from storage for attachment
  let pdfAttachment: { filename: string; content: string } | null = null;
  const pdfPath = (preventivo as Record<string, unknown>).pdf_path as string | undefined;

  if (pdfPath) {
    try {
      const { data: pdfFile } = await supabase.storage
        .from("preventivi-pdf")
        .download(pdfPath);
      if (pdfFile) {
        const pdfBytes = await pdfFile.arrayBuffer();
        const pdfBase64 = btoa(
          String.fromCharCode(...new Uint8Array(pdfBytes))
        );
        pdfAttachment = {
          filename: `Preventivo_${preventivo.numero_preventivo || preventivo_id}.pdf`,
          content: pdfBase64,
        };
      }
    } catch {
      // If download fails, fall back to link-only
      console.warn("Could not download PDF for attachment, using link only");
    }
  }

  // Build HTML email
  const brandColor = "#2563EB";
  const totalFormatted = preventivo.totale_lordo
    ? Number(preventivo.totale_lordo).toLocaleString("it-IT", {
        minimumFractionDigits: 2,
      })
    : "—";

  const validitaHtml = preventivo.valido_fino_al
    ? `<br/>Offerta valida fino al: ${new Date(
        preventivo.valido_fino_al
      ).toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`
    : "";

  const messaggioHtml = messaggio_personalizzato
    ? `<p style="margin:16px 0;color:#334155">${messaggio_personalizzato}</p>`
    : "";

  const downloadUrl = pdf_url || (preventivo as Record<string, unknown>).pdf_url as string || "";
  const downloadButtonHtml = downloadUrl
    ? `<div style="text-align:center;margin:24px 0">
        <a href="${downloadUrl}" style="background:${brandColor};color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
          📥 Scarica il Preventivo PDF
        </a>
      </div>`
    : "";

  const attachmentNote = pdfAttachment
    ? `<p style="font-size:13px;color:#64748b;text-align:center">Il preventivo è anche allegato a questa email.</p>`
    : "";

  const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px">
  <div style="background:${brandColor};color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center">
    <h1 style="margin:0;font-size:20px">📄 Il tuo preventivo è pronto</h1>
  </div>
  <div style="background:white;padding:24px;border-radius:0 0 12px 12px">
    <p>Gentile <strong>${preventivo.cliente_nome || "Cliente"}</strong>,</p>
    <p>Ti inviamo il preventivo N° <strong>${preventivo.numero_preventivo || "—"}</strong> relativo ai lavori concordati.</p>
    ${messaggioHtml}
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0">
      <strong>Importo totale: € ${totalFormatted}</strong>
      ${validitaHtml}
    </div>
    ${downloadButtonHtml}
    ${attachmentNote}
    <p style="font-size:13px;color:#64748b;text-align:center">
      Per accettare l'offerta o richiedere modifiche, rispondi direttamente a questa email.
    </p>
  </div>
  <div style="text-align:center;padding:16px;color:#94a3b8;font-size:12px">
    ${companyName}<br/>${companyEmail}
  </div>
</div>
</body></html>`;

  // Send via Resend
  const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_KEY) {
    return new Response(
      JSON.stringify({
        error: "Email provider non configurato (RESEND_API_KEY mancante)",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const emailPayload: Record<string, unknown> = {
    from: `${companyName || "Preventivo"} <noreply@resend.dev>`,
    to: [preventivo.cliente_email],
    subject: `Preventivo N° ${preventivo.numero_preventivo || ""} — ${companyName}`,
    html: emailHtml,
  };

  if (pdfAttachment) {
    emailPayload.attachments = [pdfAttachment];
  }

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailPayload),
  });

  if (!emailRes.ok) {
    const errBody = await emailRes.json();
    return new Response(
      JSON.stringify({ error: "Errore invio email", details: errBody }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Update stato → inviato
  await supabase
    .from("preventivi")
    .update({ stato: "inviato", inviato_il: new Date().toISOString() } as any)
    .eq("id", preventivo_id);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
