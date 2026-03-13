import type { PreventivoSezione } from '../types';

export const SEZIONI_DEFAULT: PreventivoSezione[] = [
  {
    id: crypto.randomUUID(),
    tipo: 'copertina',
    titolo: 'Copertina',
    attiva: true,
    ordine: 0,
    sorgente: 'manuale',
    config: { tipo: 'copertina', mostra_foto_progetto: true },
  },
  {
    id: crypto.randomUUID(),
    tipo: 'presentazione_azienda',
    titolo: 'Chi siamo',
    attiva: true,
    ordine: 1,
    sorgente: 'kb_document',
    config: { tipo: 'presentazione_azienda', max_pagine: 2 },
  },
  {
    id: crypto.randomUUID(),
    tipo: 'analisi_progetto',
    titolo: 'Analisi del progetto',
    attiva: true,
    ordine: 2,
    sorgente: 'ai_generated',
    config: {
      tipo: 'analisi_progetto',
      usa_renders: true,
      usa_kb: false,
      lunghezza: 'media',
      tono: 'professionale',
    },
  },
  {
    id: crypto.randomUUID(),
    tipo: 'render_visivi',
    titolo: 'Proposte visive',
    attiva: true,
    ordine: 3,
    sorgente: 'renders',
    config: {
      tipo: 'render_visivi',
      render_ids: [],
      layout: 'affiancato',
      mostra_before: true,
      mostra_disclaimer: true,
      disclaimer_text:
        'Le immagini di render sono elaborate con intelligenza artificiale a scopo puramente illustrativo e non costituiscono impegno contrattuale sulla resa finale dei materiali.',
    },
  },
  {
    id: crypto.randomUUID(),
    tipo: 'schede_prodotti',
    titolo: 'Prodotti e materiali',
    attiva: true,
    ordine: 4,
    sorgente: 'kb_document',
    config: {
      tipo: 'schede_prodotti',
      categoria_kb: 'scheda_tecnica',
      max_prodotti: 4,
      query_hint: '',
    },
  },
  {
    id: crypto.randomUUID(),
    tipo: 'descrizione_lavori',
    titolo: 'Descrizione dei lavori',
    attiva: true,
    ordine: 5,
    sorgente: 'ai_generated',
    config: {
      tipo: 'descrizione_lavori',
      usa_renders: true,
      usa_kb: true,
      lunghezza: 'dettagliata',
      tono: 'tecnico',
    },
  },
  {
    id: crypto.randomUUID(),
    tipo: 'computo_metrico',
    titolo: 'Computo metrico estimativo',
    attiva: true,
    ordine: 6,
    sorgente: 'tabella',
    config: { tipo: 'computo_metrico', usa_stime_ai: true, voce_manuale: true },
  },
  {
    id: crypto.randomUUID(),
    tipo: 'offerta_economica',
    titolo: 'Offerta economica',
    attiva: true,
    ordine: 7,
    sorgente: 'tabella',
    config: {
      tipo: 'offerta_economica',
      mostra_prezzi_unitari: true,
      mostra_sconto: false,
      mostra_iva: true,
      valuta: 'EUR',
    },
  },
  {
    id: crypto.randomUUID(),
    tipo: 'condizioni_contrattuali',
    titolo: 'Condizioni generali',
    attiva: false,
    ordine: 8,
    sorgente: 'kb_document',
    config: {
      tipo: 'condizioni_contrattuali',
      categoria_kb: 'condizioni_contrattuali',
    },
  },
  {
    id: crypto.randomUUID(),
    tipo: 'note_finali',
    titolo: 'Note e ringraziamenti',
    attiva: true,
    ordine: 9,
    sorgente: 'ai_generated',
    config: {
      tipo: 'note_finali',
      usa_renders: false,
      usa_kb: false,
      lunghezza: 'breve',
      tono: 'formale',
    },
  },
];

export const TIPO_SEZIONE_META: Record<string, {
  label: string;
  emoji: string;
  desc: string;
  colore: string;
}> = {
  copertina:               { label: 'Copertina',           emoji: '📄', desc: 'Prima pagina con dati progetto e cliente',         colore: 'violet' },
  presentazione_azienda:   { label: 'Chi siamo',           emoji: '🏢', desc: 'Estrae dal KB aziendale',                          colore: 'blue' },
  analisi_progetto:        { label: 'Analisi progetto',    emoji: '🔍', desc: 'AI analizza foto e render',                        colore: 'amber' },
  render_visivi:           { label: 'Render visivi',       emoji: '🖼️', desc: 'Gallery before/after con disclaimer',              colore: 'indigo' },
  schede_prodotti:         { label: 'Schede prodotti',     emoji: '📋', desc: 'AI seleziona prodotti rilevanti dal KB',            colore: 'green' },
  descrizione_lavori:      { label: 'Descr. lavori',       emoji: '🔧', desc: 'AI genera descrizione tecnica dettagliata',         colore: 'orange' },
  computo_metrico:         { label: 'Computo metrico',     emoji: '📐', desc: 'Stime mq AI + inserimento manuale',                 colore: 'teal' },
  offerta_economica:       { label: 'Offerta economica',   emoji: '💶', desc: 'Tabella prezzi con IVA e totali',                   colore: 'emerald' },
  condizioni_contrattuali: { label: 'Condizioni',          emoji: '📜', desc: 'Dal KB aziendale (opzionale)',                      colore: 'gray' },
  note_finali:             { label: 'Note finali',         emoji: '✍️', desc: 'Messaggio conclusivo personalizzato',               colore: 'rose' },
  portfolio_riferimenti:   { label: 'Portfolio',           emoji: '🖼️', desc: 'Lavori precedenti dal KB',                         colore: 'purple' },
  certificazioni:          { label: 'Certificazioni',     emoji: '🏅', desc: 'Certificati e attestati dal KB',                    colore: 'yellow' },
};
