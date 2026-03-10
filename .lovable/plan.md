

## Piano: Upgrade PDF Template e Allineamento allo Spec v2

### Problema principale
Il template PDF attuale (`preventivo-pdf.tsx`) usa proprietà CSS **non supportate** da `@react-pdf/renderer` che causano errori silenziosi o crash:
- `gap`, `objectFit`, `textTransform`, `fontStyle: "italic"`, shorthand `padding`/`margin`, `paddingVertical`, flex decimali

Lo spec v2 fornisce un template corretto e professionale che rispetta tutte le limitazioni di react-pdf.

### Cosa cambia

| Area | Problema | Azione |
|------|----------|--------|
| `preventivo-pdf.tsx` | Usa CSS vietati (gap, objectFit, textTransform, shorthand) | **Riscrittura completa** con stili spec v2 (createStyles dinamico, padding espliciti, flex interi, .toUpperCase() in JS) |
| DB `preventivo_templates` | Mancano colonne azienda (nome, indirizzo, P.IVA, telefono, email, CF, REA, sito), font, attivo, oggetto_default, note_finali, valuta, iva_inclusa_default | **Migration** per aggiungere ~12 colonne |
| DB `preventivi` | Mancano `luogo_lavori`, `ai_elaborato`, `pdf_generato_at`, `pdf_versione`, `invio_email`, `data_invio`, `email_aperta_at`, `link_aperto_at`, `link_aperto_count`, `accettato_online_at`, `sconto_globale_percentuale`, `sconto_globale_importo`, `condizioni_pagamento`, `note_finali` | **Migration** per aggiungere colonne mancanti |
| Edge function `process-preventivo-audio` | Flusso attuale funziona (FormData), ma prompt GPT usa `gpt-4o-mini` | **Upgrade prompt** a quello dello spec (geometra esperto 20 anni, prezzari DEI 2025, categorie ordinate) |
| `NuovoPreventivo.tsx` | Funzionale ma non sfrutta nuovi campi (luogo_lavori, sconto globale %) | **Aggiornare** per usare i nuovi campi |
| `PreventivoDetail.tsx` | Non usa campi tracking/invio | **Aggiornare** per mostrare tracking e azioni invio |
| `TemplatePreventivo.tsx` | Non ha sezione dati azienda | **Aggiungere** form dati azienda (nome, indirizzo, P.IVA, etc.) |

### Blocchi di implementazione

**Blocco 1 — DB Migration**
- Aggiungere colonne mancanti a `preventivo_templates` (dati azienda, font, attivo, oggetto_default, note_finali, valuta, iva_inclusa_default)
- Aggiungere colonne mancanti a `preventivi` (~14 colonne per tracking, invio, sconto globale split)

**Blocco 2 — PDF Template rewrite**
- Riscrivere `src/lib/preventivo-pdf.tsx` con il template dello spec:
  - `createStyles()` dinamico con colori dal template
  - Header con logo + dati azienda dal template (non più da companies)
  - Band titolo colorata con data/scadenza/tempi
  - Grid cliente/riferimenti con padding espliciti
  - Intro con bordo sinistro colorato
  - Foto copertina row (max 3)
  - Voci per categoria con header colorato + tabella + foto per voce
  - Subtotali categoria
  - Totali con sconto globale % e importo separati
  - Validità box giallo
  - Condizioni/clausole/note separate
  - Firma doppia
  - Footer fisso con paginazione
  - Funzioni export `downloadPreventivoAsPdf()` e `getPreventivoBlob()`
- Aggiornare le interfacce `PreventivoData` e `TemplateConfig` per i nuovi campi

**Blocco 3 — Edge Function upgrade**
- Aggiornare il prompt GPT in `process-preventivo-audio` con quello dello spec (geometra esperto, prezzari DEI 2025, output con titolo/oggetto/luogo/tempi/intro/avvertenze)
- Salvare i nuovi campi (luogo_lavori, intro, note_finali, ai_elaborato)

**Blocco 4 — Frontend updates**
- `TemplatePreventivo.tsx`: aggiungere sezione "Dati Azienda" (nome, indirizzo, telefono, email, P.IVA, CF, REA, sito web)
- `NuovoPreventivo.tsx`: aggiungere campo sconto globale %, luogo lavori; passare dati azienda dal template al PDF
- `PreventivoDetail.tsx`: mostrare tracking (email aperta, link aperto N volte), pulsante "Invia al cliente"

