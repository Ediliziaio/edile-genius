

## Piano: Upgrade Preventivi Professionali (Audio + Foto → PDF Branded)

Questo spec richiede un upgrade significativo del sistema preventivi esistente: da semplice form audio→voci a un sistema completo con template aziendale branded, foto per voce, PDF professionale client-side con `@react-pdf/renderer`, e workflow avanzato.

### Cosa cambia rispetto all'esistente

| Area | Attuale | Nuovo |
|------|---------|-------|
| DB `preventivi` | 21 colonne base | +20 colonne (template_id, versione, titolo, foto_sopralluogo_urls, sconto globale, imponibile, iva_importo, totale_finale, condizioni, clausole, tracking apertura, link accettazione) |
| DB nuovo | — | Tabella `preventivo_templates` (branding, testi standard, layout) |
| Voci JSONB | `{descrizione, unita, quantita, prezzo, totale}` | `{id, ordine, categoria, titolo_voce, descrizione, unita_misura, quantita, prezzo_unitario, sconto_percentuale, totale, foto_urls[], note_voce, evidenziata}` |
| PDF | Edge function genera HTML | Client-side con `@react-pdf/renderer` (PDF vero, branded) |
| NuovoPreventivo | Form singolo + audio | Wizard 3 step (cliente → audio+foto → editor visuale con anteprima PDF) |
| PreventivoDetail | Tabella voci base | Tabs (Dettaglio, Cronologia, Tracking) + azioni (invia, accetta, revisione) |
| PreventiviList | Lista semplice | KPI cards + filtri tab per stato + ricerca |
| Edge function | Whisper + GPT-4o-mini basic | GPT-4o con prompt esperto (prezzario DEI, categorie, sconti) |
| Storage | `preventivi-audio`, `preventivi-pdf` | + `preventivi-media` (foto), `template-assets` (logo) |

### Implementazione (4 blocchi sequenziali)

**Blocco 1 — Database**
- Creare tabella `preventivo_templates` con branding, testi standard, layout toggles
- Estendere `preventivi` con ~20 nuove colonne (template_id, versione, titolo, foto fields, sconto globale, imponibile, iva_importo, totale_finale, condizioni, clausole, tempi_esecuzione, validita_giorni, data_scadenza, tracking apertura, link accettazione, firma_cliente_url)
- Trigger `generate_numero_preventivo` (formato PV-YYYY-NNN, auto data_scadenza)
- RLS company-scoped
- Storage buckets: `preventivi-media`, `template-assets`

**Blocco 2 — Edge Function + PDF**
- Riscrivere `process-preventivo-audio`: nuovo prompt GPT-4o esperto (prezzario DEI, categorie edilizie, sconti), nuovo formato voci con id/categoria/titolo_voce, calcolo totali con sconto
- Installare `@react-pdf/renderer`
- Creare `src/lib/preventivo-pdf.tsx`: template PDF professionale A4 multi-pagina con header azienda/logo, band titolo colorata, grid cliente/riferimenti, intro, foto copertina, tabella voci per categoria con subtotali, totali con sconto globale, condizioni/clausole, firma, footer pagina

**Blocco 3 — Frontend pagine**
- **NuovoPreventivo.tsx** → Wizard 3 step:
  - Step 1: dati cliente + cantiere
  - Step 2: audio (registrazione/upload) + foto sopralluogo (upload multiplo, grid preview, prima = copertina)
  - Step 3: editor visuale voci (card editabili con foto associabili per voce) + totali live + anteprima PDF
- **PreventivoDetail.tsx** → 3 tabs (Dettaglio con voci per categoria + foto, Cronologia timeline, Tracking apertura) + sidebar azioni (scarica PDF, invia, accetta/rifiuta, crea revisione)
- **PreventiviList.tsx** → KPI cards (totale, bozze, in attesa, valore accettati) + filtri tab per stato + tabella completa

**Blocco 4 — Template Settings**
- **TemplatePreventivo.tsx** (`/app/impostazioni/template-preventivo`): configurazione branding (logo upload, color picker), dati azienda, testi standard (intro, condizioni, clausole, firma), layout toggles (foto copertina, foto per voce, subtotali categoria, firma), anteprima PDF esempio
- Link da pagina Impostazioni

### Note tecniche
- `@react-pdf/renderer` genera PDF veri client-side (no edge function per PDF)
- Le foto da Storage privato vanno convertite in base64 via signed URLs prima di passarle al PDF
- L'anteprima PDF nel wizard usa `<PDFViewer>` con debounce 500ms
- Il formato voci JSONB cambia: i preventivi esistenti (formato vecchio) verranno mostrati con fallback compatibile

