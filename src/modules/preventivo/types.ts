// ─── Type Aliases ─────────────────────────────────────────────────────────────

export type StatoPreventivo =
  | 'bozza'
  | 'generazione'
  | 'pronto'
  | 'inviato'
  | 'accettato'
  | 'rifiutato';

export type StatoKBDocumento =
  | 'caricato'
  | 'elaborazione'
  | 'indicizzato'
  | 'errore';

export type ConfidenzaAnalisi = 'bassa' | 'media' | 'alta';

// ─── Sezioni del preventivo ───────────────────────────────────────────────────

export type TipoSezione =
  | 'copertina'
  | 'presentazione_azienda'
  | 'analisi_progetto'
  | 'render_visivi'
  | 'schede_prodotti'
  | 'descrizione_lavori'
  | 'computo_metrico'
  | 'offerta_economica'
  | 'condizioni_contrattuali'
  | 'note_finali'
  | 'portfolio_riferimenti'
  | 'certificazioni'
  | 'garanzie'
  | 'firma_cliente'
  | 'superfici_computo';

export interface PreventivoSezione {
  id: string;
  tipo: TipoSezione;
  titolo: string;
  attiva: boolean;
  ordine: number;
  sorgente: 'ai_generated' | 'kb_document' | 'manuale' | 'renders' | 'tabella';
  config: SectionConfig;
  contenuto_generato?: string;
  chunks_usati?: string[];
}

export type SectionConfig =
  | CopertinaConfig
  | PresentazioneConfig
  | RenderConfig
  | ComputoConfig
  | OffertaConfig
  | KBSectionConfig
  | AIGeneratedConfig
  | TestoLiberoConfig
  | FirmaClienteConfig
  | SuperficiComputoConfig;

export interface CopertinaConfig {
  tipo: 'copertina';
  mostra_foto_progetto: boolean;
  sottotitolo_custom?: string;
}

export interface PresentazioneConfig {
  tipo: 'presentazione_azienda';
  documento_id?: string;
  max_pagine: number;
}

export interface RenderConfig {
  tipo: 'render_visivi';
  render_ids: string[];
  layout: 'singolo' | 'affiancato' | 'griglia';
  mostra_before: boolean;
  mostra_disclaimer: boolean;
  disclaimer_text: string;
}

export interface ComputoConfig {
  tipo: 'computo_metrico';
  usa_stime_ai: boolean;
  voce_manuale: boolean;
}

export interface OffertaConfig {
  tipo: 'offerta_economica';
  mostra_prezzi_unitari: boolean;
  mostra_sconto: boolean;
  mostra_iva: boolean;
  valuta: 'EUR' | 'USD';
}

export interface KBSectionConfig {
  tipo: 'schede_prodotti' | 'condizioni_contrattuali' | 'certificazioni' | 'portfolio_riferimenti' | 'garanzie';
  categoria_kb: string;
  max_prodotti?: number;
  query_hint?: string;
}

export interface AIGeneratedConfig {
  tipo: 'analisi_progetto' | 'descrizione_lavori' | 'note_finali';
  usa_renders: boolean;
  usa_kb: boolean;
  lunghezza: 'breve' | 'media' | 'dettagliata';
  tono: 'formale' | 'professionale' | 'tecnico';
  istruzioni_custom?: string;
}

export interface TestoLiberoConfig {
  tipo: 'testo_libero';
  contenuto_html?: string;
}

export interface FirmaClienteConfig {
  tipo: 'firma_cliente';
  mostra_data: boolean;
  mostra_timbro: boolean;
  testo_accettazione?: string;
}

export interface SuperficiComputoConfig {
  tipo: 'superfici_computo';
  usa_stime_ai: boolean;
  mostra_confidenza: boolean;
}

// ─── Voci preventivo ─────────────────────────────────────────────────────────

export interface PreventivoVoce {
  id: string;
  descrizione: string;
  categoria: string;
  unita_misura: 'mq' | 'ml' | 'cad' | 'corpo' | 'ore';
  quantita: number;
  prezzo_unitario: number;
  importo: number;
  note?: string;
  da_stime_ai?: boolean;
}

// ─── Documento KB ─────────────────────────────────────────────────────────────

export type CategoriaKB =
  | 'presentazione_azienda'
  | 'catalogo_prodotti'
  | 'scheda_tecnica'
  | 'listino_prezzi'
  | 'condizioni_contrattuali'
  | 'portfolio'
  | 'certificazioni'
  | 'garanzie'
  | 'altro';

export interface KBDocumento {
  id: string;
  company_id: string;
  nome: string;
  descrizione?: string;
  file_url: string;
  file_type: 'pdf' | 'docx' | 'txt' | 'xlsx';
  file_size_kb: number;
  pagine?: number;
  categoria: CategoriaKB;
  stato: StatoKBDocumento;
  errore_msg?: string;
  indicizzato_at?: string;
  chunks_count: number;
  tags?: string[];
  visibile: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Analisi superfici ────────────────────────────────────────────────────────

export interface SuperficieStimata {
  elemento: string;
  mq_stimati: number;
  confidenza: ConfidenzaAnalisi;
  note: string;
  foto_ref?: string;
}

export interface AnalisiSuperfici {
  superfici: SuperficieStimata[];
  note_generali: string;
  suggerimenti_voci: Array<{
    descrizione: string;
    categoria: string;
    unita: string;
    quantita_suggerita: number;
  }>;
}

// ─── Preventivo completo ──────────────────────────────────────────────────────

export interface Preventivo {
  id: string;
  company_id: string;
  progetto_id?: string;
  template_id?: string;
  numero_preventivo: string;
  titolo?: string;
  stato: StatoPreventivo;

  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  cliente_indirizzo?: string;

  oggetto_lavori?: string;
  indirizzo_cantiere?: string;
  note_interne?: string;

  render_ids: string[];
  foto_analisi_urls: string[];
  superfici_stimate?: AnalisiSuperfici;

  sezioni_json: Record<string, {
    testo: string;
    chunks_usati?: string[];
  }>;
  voci: PreventivoVoce[];

  subtotale?: number;
  iva_percentuale: number;
  totale?: number;
  totale_finale?: number;
  sconto_globale_percentuale?: number;

  pdf_url?: string;
  pdf_generato_at?: string;
  validita_giorni?: number;
  created_at: string;
  updated_at: string;
}

// ─── Template ─────────────────────────────────────────────────────────────────

export interface PreventivoTemplate {
  id: string;
  company_id: string;
  nome: string;
  descrizione?: string;
  is_default: boolean;
  sezioni: PreventivoSezione[];
  branding_json?: {
    logoUrl?: string;
    colore_primario?: string;
    colore_secondario?: string;
    piede_pagina?: string;
  };
}
