// assemble-preventivo-pdf
// Merges: preventivo voci (rendered with pdf-lib) + KB PDF documents + divider pages
// The preventivo section is ALWAYS rendered fresh from DB data — never from a stale HTML file.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb, PageSizes } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BlockTipo = "kb_doc" | "divider" | "preventivo";

interface PdfBlock {
  tipo: BlockTipo;
  // kb_doc
  doc_id?: string;
  doc_nome?: string;
  include_copertina?: boolean;
  // divider
  testo?: string;
}

// ─── Color palette ───────────────────────────────────────────────────────────
const C_DARK   = rgb(0.07, 0.07, 0.15);   // #121225
const C_WHITE  = rgb(1, 1, 1);
const C_ACCENT = rgb(0.22, 0.47, 0.91);   // #3878E8
const C_GRAY   = rgb(0.55, 0.55, 0.60);
const C_LIGHT  = rgb(0.96, 0.96, 0.97);
const C_BLACK  = rgb(0.1, 0.1, 0.1);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function euro(n: number): string {
  return "€" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function truncate(s: string, max: number): string {
  if (!s) return "";
  return s.length > max ? s.substring(0, max - 1) + "…" : s;
}

// Draw text with word-wrap, returns final Y
function drawWrapped(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  font: any,
  color = C_BLACK,
  lineHeight = 1.4,
): number {
  const words = (text || "").split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      page.drawText(line, { x, y: curY, size, font, color });
      curY -= size * lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x, y: curY, size, font, color });
    curY -= size * lineHeight;
  }
  return curY;
}

// ─── Preventivo PDF generator (pdf-lib) ─────────────────────────────────────
async function buildPreventivoPdfPages(
  mergedPdf: PDFDocument,
  prev: any,
  company: any,
): Promise<number> {
  const regular = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const bold    = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  const PW = 595.28; // A4 width pt
  const PH = 841.89; // A4 height pt
  const ML = 50, MR = 50, MT = 50, MB = 60;
  const CW = PW - ML - MR; // content width
  const MIN_Y = MB + 20;   // minimum Y before new page

  let pages = 0;
  let page = mergedPdf.addPage([PW, PH]);
  pages++;
  let y = PH - MT;

  const newPage = () => {
    page = mergedPdf.addPage([PW, PH]);
    pages++;
    y = PH - MT;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MIN_Y) newPage();
  };

  // ── HEADER ──────────────────────────────────────────────────────────────
  // Dark bar at top
  page.drawRectangle({ x: 0, y: PH - 90, width: PW, height: 90, color: C_DARK });

  // Company name
  page.drawText(truncate(company?.name || "Azienda", 35), {
    x: ML, y: PH - 45, size: 16, font: bold, color: C_WHITE,
  });
  const companyDetails = [company?.address, company?.phone, company?.vat_number ? `P.IVA ${company.vat_number}` : null]
    .filter(Boolean).join("  ·  ");
  if (companyDetails) {
    page.drawText(truncate(companyDetails, 70), { x: ML, y: PH - 65, size: 8, font: regular, color: rgb(0.75, 0.75, 0.80) });
  }

  // Numero preventivo (right)
  const numLabel = "PREVENTIVO N.";
  const numValue = prev.numero_preventivo || "—";
  page.drawText(numLabel, { x: PW - MR - 140, y: PH - 38, size: 8, font: regular, color: C_GRAY });
  page.drawText(numValue, { x: PW - MR - 140, y: PH - 55, size: 18, font: bold, color: C_WHITE });
  const dateStr = new Date(prev.created_at).toLocaleDateString("it-IT");
  page.drawText(`Data: ${dateStr}`, { x: PW - MR - 140, y: PH - 75, size: 8, font: regular, color: rgb(0.75, 0.75, 0.80) });

  y = PH - 90 - 16;

  // ── OGGETTO ────────────────────────────────────────────────────────────
  if (prev.oggetto || prev.titolo) {
    page.drawText(truncate(prev.oggetto || prev.titolo, 80), {
      x: ML, y, size: 13, font: bold, color: C_DARK,
    });
    y -= 22;
  }

  // ── CLIENTE + PROGETTO boxes ────────────────────────────────────────────
  const boxH = 72;
  ensureSpace(boxH + 20);

  // Cliente box
  page.drawRectangle({ x: ML, y: y - boxH, width: CW / 2 - 6, height: boxH, color: C_LIGHT });
  page.drawText("CLIENTE", { x: ML + 10, y: y - 16, size: 7, font: bold, color: C_GRAY });
  page.drawText(truncate(prev.cliente_nome || "—", 38), { x: ML + 10, y: y - 30, size: 10, font: bold, color: C_DARK });
  if (prev.cliente_indirizzo) page.drawText(truncate(prev.cliente_indirizzo, 42), { x: ML + 10, y: y - 43, size: 8, font: regular, color: C_GRAY });
  const contact = [prev.cliente_telefono, prev.cliente_email].filter(Boolean).join("  ·  ");
  if (contact) page.drawText(truncate(contact, 45), { x: ML + 10, y: y - 55, size: 7, font: regular, color: C_GRAY });

  // Info box
  const bx2 = ML + CW / 2 + 6;
  page.drawRectangle({ x: bx2, y: y - boxH, width: CW / 2 - 6, height: boxH, color: C_LIGHT });
  page.drawText("PROGETTO", { x: bx2 + 10, y: y - 16, size: 7, font: bold, color: C_GRAY });
  if (prev.luogo_lavori) page.drawText(truncate(prev.luogo_lavori, 38), { x: bx2 + 10, y: y - 30, size: 9, font: regular, color: C_DARK });
  if (prev.tempi_esecuzione) page.drawText(truncate(prev.tempi_esecuzione, 38), { x: bx2 + 10, y: y - 43, size: 8, font: regular, color: C_GRAY });
  if (prev.data_scadenza) page.drawText(`Valido fino: ${new Date(prev.data_scadenza).toLocaleDateString("it-IT")}`, { x: bx2 + 10, y: y - 55, size: 7, font: regular, color: C_GRAY });

  y -= boxH + 16;

  // ── INTRO TEXT ────────────────────────────────────────────────────────
  if (prev.intro_testo) {
    ensureSpace(40);
    y = drawWrapped(page, prev.intro_testo, ML, y, CW, 9, regular, C_GRAY);
    y -= 10;
  }

  // ── VOCI TABLE ────────────────────────────────────────────────────────
  const voci: any[] = prev.voci || [];

  // Column widths
  const COLS = { desc: CW * 0.42, um: CW * 0.08, qty: CW * 0.08, price: CW * 0.13, sconto: CW * 0.09, tot: CW * 0.13, nr: CW * 0.07 };
  const ROW_H = 20;
  const HEADER_H = 22;

  const drawTableHeader = () => {
    ensureSpace(HEADER_H + 4);
    page.drawRectangle({ x: ML, y: y - HEADER_H, width: CW, height: HEADER_H, color: C_DARK });
    let cx = ML + 4;
    const headers = [
      { label: "#", w: COLS.nr },
      { label: "Descrizione", w: COLS.desc },
      { label: "U.M.", w: COLS.um },
      { label: "Qtà", w: COLS.qty },
      { label: "Prezzo unit.", w: COLS.price },
      { label: "Sconto", w: COLS.sconto },
      { label: "Totale", w: COLS.tot },
    ];
    for (const h of headers) {
      page.drawText(h.label, { x: cx, y: y - 14, size: 7, font: bold, color: C_WHITE });
      cx += h.w;
    }
    y -= HEADER_H;
  };

  let currentCategory = "";
  let rowIndex = 0;

  drawTableHeader();

  for (const v of voci) {
    // Category separator
    if (v.categoria && v.categoria !== currentCategory) {
      ensureSpace(18 + ROW_H);
      currentCategory = v.categoria;
      page.drawRectangle({ x: ML, y: y - 18, width: CW, height: 18, color: C_ACCENT });
      page.drawText(truncate(currentCategory.toUpperCase(), 60), {
        x: ML + 6, y: y - 12, size: 8, font: bold, color: C_WHITE,
      });
      y -= 18;
    }

    ensureSpace(ROW_H + 4);

    // Alternating row bg
    if (rowIndex % 2 === 0) {
      page.drawRectangle({ x: ML, y: y - ROW_H, width: CW, height: ROW_H, color: C_LIGHT });
    }

    // Row data
    let cx = ML + 4;
    page.drawText(String(v.ordine || rowIndex + 1), { x: cx, y: y - 13, size: 8, font: regular, color: C_GRAY });
    cx += COLS.nr;

    const voceLabel = truncate(v.titolo_voce || v.descrizione || "", 55);
    page.drawText(voceLabel, { x: cx, y: y - 13, size: 8, font: regular, color: C_BLACK });
    cx += COLS.desc;

    page.drawText(v.unita_misura || "nr", { x: cx, y: y - 13, size: 8, font: regular, color: C_GRAY });
    cx += COLS.um;

    page.drawText(String((v.quantita || 0).toFixed(2)), { x: cx, y: y - 13, size: 8, font: regular, color: C_BLACK });
    cx += COLS.qty;

    page.drawText(euro(v.prezzo_unitario || 0), { x: cx, y: y - 13, size: 8, font: regular, color: C_BLACK });
    cx += COLS.price;

    const sc = v.sconto_percentuale || 0;
    page.drawText(sc > 0 ? `${sc}%` : "—", { x: cx, y: y - 13, size: 8, font: regular, color: sc > 0 ? rgb(0.8, 0.3, 0.1) : C_GRAY });
    cx += COLS.sconto;

    page.drawText(euro(v.totale || 0), { x: cx, y: y - 13, size: 8, font: bold, color: C_DARK });

    y -= ROW_H;
    rowIndex++;

    // Draw bottom border
    page.drawLine({ start: { x: ML, y }, end: { x: ML + CW, y }, thickness: 0.3, color: rgb(0.88, 0.88, 0.9) });
  }

  // ── TOTALS ────────────────────────────────────────────────────────────
  ensureSpace(100);
  y -= 12;

  const totW = 200;
  const totX = ML + CW - totW;

  const drawTotRow = (label: string, value: string, isFinal = false) => {
    ensureSpace(20);
    if (isFinal) {
      page.drawRectangle({ x: totX - 4, y: y - 22, width: totW + 4, height: 22, color: C_DARK });
    }
    const lColor = isFinal ? C_WHITE : C_GRAY;
    const vColor = isFinal ? C_WHITE : C_DARK;
    const fnt = isFinal ? bold : regular;
    page.drawText(label, { x: totX, y: y - 14, size: isFinal ? 9 : 8, font: fnt, color: lColor });
    page.drawText(value, { x: totX + totW - 4 - bold.widthOfTextAtSize(value, isFinal ? 10 : 8), y: y - 14, size: isFinal ? 10 : 8, font: bold, color: vColor });
    y -= 22;
  };

  const sub = prev.subtotale || prev.imponibile || 0;
  const ivaPerc = prev.iva_percentuale || 22;
  const ivaImp = prev.iva_importo || sub * (ivaPerc / 100);
  const tot = prev.totale_finale || prev.totale || 0;

  drawTotRow("Imponibile:", euro(sub));
  drawTotRow(`IVA ${ivaPerc}%:`, euro(ivaImp));
  drawTotRow("TOTALE:", euro(tot), true);

  // ── CONDIZIONI + NOTE ─────────────────────────────────────────────────
  y -= 16;
  if (prev.condizioni_pagamento) {
    ensureSpace(50);
    page.drawText("CONDIZIONI DI PAGAMENTO", { x: ML, y, size: 8, font: bold, color: C_DARK });
    y -= 12;
    y = drawWrapped(page, prev.condizioni_pagamento, ML, y, CW, 8, regular, C_GRAY);
    y -= 8;
  }
  if (prev.note) {
    ensureSpace(40);
    page.drawText("NOTE", { x: ML, y, size: 8, font: bold, color: C_DARK });
    y -= 12;
    y = drawWrapped(page, prev.note, ML, y, CW, 8, regular, C_GRAY);
  }

  // ── FOOTER on each page ────────────────────────────────────────────────
  const allPages = mergedPdf.getPages();
  const startPage = allPages.length - pages;
  for (let i = startPage; i < allPages.length; i++) {
    const pg = allPages[i];
    const { width } = pg.getSize();
    pg.drawLine({ start: { x: ML, y: MB }, end: { x: width - MR, y: MB }, thickness: 0.5, color: C_LIGHT });
    const footerText = `${company?.name || "Azienda"} — Preventivo ${prev.numero_preventivo} — Pag. ${i - startPage + 1}/${pages}`;
    pg.drawText(footerText, { x: ML, y: MB - 14, size: 7, font: regular, color: C_GRAY });
  }

  return pages;
}

// ─── Divider page ────────────────────────────────────────────────────────────
async function addDividerPage(mergedPdf: PDFDocument, testo: string): Promise<void> {
  const page = mergedPdf.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const bold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await mergedPdf.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({ x: 0, y: 0, width, height, color: C_DARK });
  // Accent bar
  page.drawRectangle({ x: 0, y: height / 2 - 2, width, height: 4, color: C_ACCENT });

  const label = (testo || "─────").toUpperCase();
  const size = Math.min(32, Math.max(18, 600 / Math.max(label.length, 1)));
  const tw = bold.widthOfTextAtSize(label, size);
  page.drawText(label, { x: (width - tw) / 2, y: height / 2 + 20, size, font: bold, color: C_WHITE });

  const sub = "Sezione documentazione tecnica";
  const sw = regular.widthOfTextAtSize(sub, 10);
  page.drawText(sub, { x: (width - sw) / 2, y: height / 2 - 18, size: 10, font: regular, color: rgb(0.6, 0.6, 0.7) });
}

// ─── Merge PDF bytes from URL ────────────────────────────────────────────────
async function mergePdfFromUrl(mergedPdf: PDFDocument, url: string): Promise<number> {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const bytes = await resp.arrayBuffer();
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const indices = srcDoc.getPageIndices();
    const copied = await mergedPdf.copyPages(srcDoc, indices);
    copied.forEach(p => mergedPdf.addPage(p));
    return indices.length;
  } catch (err) {
    console.error("mergePdfFromUrl error:", url, String(err));
    return 0;
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const respond = (body: object, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return respond({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { preventivo_id, company_id, blocks } = body as {
      preventivo_id: string;
      company_id: string;
      blocks: PdfBlock[];
    };

    if (!preventivo_id || !company_id) return respond({ error: "preventivo_id e company_id richiesti" }, 400);

    // Fetch preventivo + company
    const { data: prev, error: prevErr } = await adminClient
      .from("preventivi")
      .select("*, companies(name, address, phone, vat_number)")
      .eq("id", preventivo_id)
      .single();
    if (prevErr || !prev) return respond({ error: "Preventivo non trovato" }, 404);

    const company = (prev as any).companies;

    // Use passed blocks or fall back to assembla_config in DB
    const effectiveBlocks: PdfBlock[] = (blocks && blocks.length > 0)
      ? blocks
      : (prev.assembla_config?.blocks || []);

    // If still empty, default to just preventivo
    const finalBlocks: PdfBlock[] = effectiveBlocks.length > 0
      ? effectiveBlocks
      : [{ tipo: "preventivo" }];

    const mergedPdf = await PDFDocument.create();
    let totalPages = 0;

    for (const block of finalBlocks) {
      if (block.tipo === "preventivo") {
        const n = await buildPreventivoPdfPages(mergedPdf, prev, company);
        totalPages += n;

      } else if (block.tipo === "divider") {
        await addDividerPage(mergedPdf, block.testo || "");
        totalPages += 1;

      } else if (block.tipo === "kb_doc" && block.doc_id) {
        const { data: doc } = await adminClient
          .from("preventivo_kb_documenti")
          .select("file_url, file_type, nome")
          .eq("id", block.doc_id)
          .single();

        if (!doc?.file_url) continue;

        if (block.include_copertina) {
          await addDividerPage(mergedPdf, doc.nome || block.doc_nome || "Documento");
          totalPages += 1;
        }

        const ft = (doc.file_type || "").toLowerCase();
        if (ft.includes("pdf")) {
          const n = await mergePdfFromUrl(mergedPdf, doc.file_url);
          totalPages += n;
        } else {
          // Non-PDF: placeholder page
          const pg = mergedPdf.addPage(PageSizes.A4);
          const { width: pw, height: ph } = pg.getSize();
          const hb = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
          const hr = await mergedPdf.embedFont(StandardFonts.Helvetica);
          pg.drawRectangle({ x: 0, y: 0, width: pw, height: ph, color: C_LIGHT });
          const lbl = `Allegato: ${doc.nome || block.doc_nome || "Documento"}`;
          pg.drawText(lbl, { x: 50, y: ph / 2 + 10, size: 14, font: hb, color: C_DARK });
          pg.drawText(`Tipo: ${doc.file_type || "n.d."} — disponibile separatamente`, { x: 50, y: ph / 2 - 14, size: 9, font: hr, color: C_GRAY });
          totalPages += 1;
        }
      }
    }

    if (mergedPdf.getPageCount() === 0) return respond({ error: "Nessuna pagina generata" }, 400);

    const mergedBytes = await mergedPdf.save();

    // Upload to storage
    const fileName = `preventivi/${company_id}/${preventivo_id}/assemblato_${Date.now()}.pdf`;
    const { error: uploadError } = await adminClient.storage
      .from("preventivi-pdf")
      .upload(fileName, mergedBytes, { contentType: "application/pdf", upsert: true });

    if (uploadError) return respond({ error: "Upload fallito: " + uploadError.message }, 500);

    const { data: { publicUrl } } = adminClient.storage.from("preventivi-pdf").getPublicUrl(fileName);

    // Persist to DB
    await adminClient.from("preventivi").update({
      pdf_finale_url: publicUrl,
      pdf_finale_generato_at: new Date().toISOString(),
      assembla_config: { blocks: finalBlocks },
    }).eq("id", preventivo_id);

    return respond({ pdf_url: publicUrl, pagine_totali: totalPages });

  } catch (err) {
    console.error("assemble-preventivo-pdf error:", err);
    return respond({ error: String(err) }, 500);
  }
});
