// assemble-preventivo-pdf
// Merges: preventivo main PDF + optional KB documents (PDF/DOCX) + divider pages
// Uses pdf-lib for PDF manipulation via CDN

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb, PageSizes } from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PdfBlock {
  tipo: "kb_doc" | "divider" | "preventivo";
  doc_id?: string;
  doc_nome?: string;
  include_copertina?: boolean;
  testo?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { preventivo_id, company_id, blocks } = body as {
      preventivo_id: string;
      company_id: string;
      blocks: PdfBlock[];
    };

    if (!preventivo_id || !company_id) {
      return new Response(JSON.stringify({ error: "preventivo_id e company_id richiesti" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Fetch preventivo to get the existing PDF url
    const { data: prev, error: prevError } = await adminClient
      .from("preventivi")
      .select("id, numero_preventivo, pdf_url, company_id")
      .eq("id", preventivo_id)
      .single();

    if (prevError || !prev) {
      return new Response(JSON.stringify({ error: "Preventivo non trovato" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Start building merged PDF
    const mergedPdf = await PDFDocument.create();
    const helvetica = await mergedPdf.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

    let totalPages = 0;

    // Helper: add a divider page
    const addDividerPage = async (testo: string) => {
      const page = mergedPdf.addPage(PageSizes.A4);
      const { width, height } = page.getSize();
      page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.07, 0.07, 0.15) });
      const fontSize = 28;
      const textWidth = helveticaBold.widthOfTextAtSize(testo, fontSize);
      page.drawText(testo, {
        x: (width - textWidth) / 2,
        y: height / 2 - fontSize / 2,
        size: fontSize,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });
      totalPages++;
    };

    // Helper: fetch a PDF from a URL and merge its pages
    const mergePdfFromUrl = async (url: string): Promise<number> => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const bytes = await resp.arrayBuffer();
        const srcDoc = await PDFDocument.load(bytes);
        const pageIndices = srcDoc.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);
        copiedPages.forEach(p => mergedPdf.addPage(p));
        return pageIndices.length;
      } catch (err) {
        console.error("Error merging PDF from URL:", url, err);
        return 0;
      }
    };

    // Process blocks in order
    for (const block of blocks) {
      if (block.tipo === "preventivo") {
        // Merge main preventivo PDF
        if (prev.pdf_url) {
          const pages = await mergePdfFromUrl(prev.pdf_url);
          totalPages += pages;
        }
      } else if (block.tipo === "divider") {
        await addDividerPage(block.testo || "─────");
      } else if (block.tipo === "kb_doc" && block.doc_id) {
        // Fetch KB document
        const { data: doc } = await adminClient
          .from("preventivo_kb_documenti")
          .select("file_url, file_type, nome")
          .eq("id", block.doc_id)
          .single();

        if (!doc?.file_url) continue;

        if (block.include_copertina) {
          await addDividerPage(doc.nome || block.doc_nome || "Documento");
        }

        const fileType = (doc.file_type || "").toLowerCase();
        if (fileType.includes("pdf")) {
          const pages = await mergePdfFromUrl(doc.file_url);
          totalPages += pages;
        } else {
          // Non-PDF: add a placeholder page
          const page = mergedPdf.addPage(PageSizes.A4);
          const { width, height } = page.getSize();
          const label = `[Allegato: ${doc.nome || block.doc_nome || "Documento"}]`;
          const subLabel = `Tipo file: ${doc.file_type || "sconosciuto"} — scaricabile separatamente`;
          page.drawText(label, { x: 50, y: height - 100, size: 14, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
          page.drawText(subLabel, { x: 50, y: height - 130, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
          totalPages++;
        }
      }
    }

    // If no blocks specified (or empty), just merge the main preventivo PDF
    if (blocks.length === 0 && prev.pdf_url) {
      totalPages += await mergePdfFromUrl(prev.pdf_url);
    }

    // Serialize merged PDF
    const mergedBytes = await mergedPdf.save();

    // Upload to Supabase Storage
    const fileName = `preventivi/${company_id}/${preventivo_id}/assemblato_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("preventivi-pdf")
      .upload(fileName, mergedBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Errore upload PDF: " + uploadError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: { publicUrl } } = adminClient.storage
      .from("preventivi-pdf")
      .getPublicUrl(fileName);

    // Update preventivo with final PDF url
    await adminClient.from("preventivi").update({
      pdf_finale_url: publicUrl,
      pdf_finale_generato_at: new Date().toISOString(),
    }).eq("id", preventivo_id);

    return new Response(JSON.stringify({
      pdf_url: publicUrl,
      pagine_totali: totalPages,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("assemble-preventivo-pdf error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
