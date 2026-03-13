

# Doc 5/7: PDF Assembly Engine

## Analysis

The project **already has a working PDF engine** in `src/lib/preventivo-pdf.tsx` using `@react-pdf/renderer`. It generates A4 PDFs with branded headers, cover photos, categorized item tables, totals, conditions, signatures, and footers. It's used by both `NuovoPreventivo` and `PreventivoDetail` via `PDFDownloadLink`.

The Doc 5/7 prompt proposes replacing this with `jspdf + html2canvas`. This is a **downgrade** — `@react-pdf/renderer` is already installed, produces cleaner vector PDFs, and is deeply integrated. Adding jsPDF would duplicate functionality and add 2 new dependencies.

## Recommended Approach

Instead of replacing the existing engine, **extend it** to support the new AI-generated sections from Doc 4:

1. **Extend `PreventivoPDF` to render AI section content** — The current PDF only renders `voci` (line items). It needs to also render content from `sezioni_json` (AI-generated text sections like presentazione, analisi progetto, descrizione lavori, etc.)

2. **Add render gallery support** — Display render images from `render_ids` in the PDF

3. **Create `useGeneraPDF` hook** — Download/preview/upload workflow with progress state

4. **Create `PDFPreviewPanel` component** — In-app preview panel with download, open-in-tab, and section status display

5. **Skip the email edge function** — No `RESEND_API_KEY` is configured. The email sending can be added later when the user sets up an email provider.

## Plan

### 1. Extend `src/lib/preventivo-pdf.tsx`
Add new section renderers to `PreventivoPDF`:
- Accept optional `sezioniContenuto` prop (the `sezioni_json` data from DB)
- Accept optional `sezioniTemplate` prop (the template section definitions with order/active/config)
- Render AI text sections (presentazione, analisi, descrizione, note) with title + wrapped paragraphs
- Render render gallery section (images from render storage URLs)
- Render condizioni contrattuali section from KB
- Keep all existing functionality intact (voci table, totals, signature, etc.)
- Order sections per template `ordine` field

### 2. Create `src/hooks/useGeneraPDF.ts`
- `generaPDF(preventivo, template)` — generates blob using existing `getPreventivoBlob`
- `scaricaPDF(...)` — downloads as file
- `apriAnteprima(...)` — opens in new tab
- `salvaStorage(...)` — uploads to `preventivi-pdf` bucket, updates `pdf_url` in DB
- Progress state tracking

### 3. Create `src/components/preventivo/PDFPreviewPanel.tsx`
- Shows section checklist (generated vs pending)
- Action buttons: Preview, Download, Open in new tab
- Progress bar during generation
- Uses `useGeneraPDF` hook

### Files
- **Edit**: `src/lib/preventivo-pdf.tsx` (add AI section renderers)
- **Create**: `src/hooks/useGeneraPDF.ts`
- **Create**: `src/components/preventivo/PDFPreviewPanel.tsx`

No new npm dependencies needed — `@react-pdf/renderer` is already installed.

