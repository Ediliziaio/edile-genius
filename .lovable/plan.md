

# Doc 5/7: PDF Assembly Engine — Gap Analysis & Plan

## Already Implemented

The project already has a complete PDF generation system:

- **`src/lib/preventivo-pdf.tsx`** — Full PDF renderer using `@react-pdf/renderer` (774 lines) with cover page, grouped voci tables, AI sections, render gallery, totals, footer, watermark. Working.
- **`src/hooks/useGeneraPDF.ts`** — Hook with generate, download, preview, save-to-storage. Working.
- **`src/components/preventivo/PDFPreviewPanel.tsx`** — Panel with inline iframe preview, download, save buttons, AI section checklist. Working.
- **`supabase/functions/invia-preventivo-email/index.ts`** — Sends email via Resend with PDF download link, branded HTML template, updates stato to "inviato". Working.
- **`supabase/functions/generate-preventivo-pdf/index.ts`** — Server-side HTML generation for PDF. Working.
- **`PreventivoDetail.tsx`** — Uses `PDFDownloadLink` from `@react-pdf/renderer` for direct download. Working.

## What Doc 5 Proposes vs What Exists

Doc 5 proposes replacing `@react-pdf/renderer` with `jsPDF + html2canvas`. The existing implementation uses `@react-pdf/renderer` which is **more mature and already working**. Switching to jsPDF would be a regression — `@react-pdf/renderer` produces better quality PDFs with proper font embedding and layout.

The email function already exists and works with Resend. It uses a PDF download link approach rather than base64 attachment — this is actually better (smaller email, no attachment size limits).

## Gaps to Fill

### 1. Add "Invia al Cliente" button to PDFPreviewPanel
The current panel has preview/download/save but no email send button. Add an `onInvia` callback prop and a "Send to Client" button that invokes `invia-preventivo-email`.

### 2. Missing `RESEND_API_KEY` secret
The edge function checks for this secret but it's not in the configured secrets list. Need to prompt user to add it.

### 3. Email function: add PDF attachment option
The current email function only includes a download link. Doc 5 suggests attaching the PDF as base64. Add optional attachment support — download PDF from storage and attach if `pdf_path` exists.

## Files to Modify

| File | Action |
|------|--------|
| `src/components/preventivo/PDFPreviewPanel.tsx` | Add "Invia al Cliente" button with `onInvia` prop |
| `supabase/functions/invia-preventivo-email/index.ts` | Add PDF base64 attachment from storage when `pdf_path` available |

No new dependencies needed — `@react-pdf/renderer` is superior to jsPDF for this use case and already works. Skipping the jsPDF migration entirely.

