// ─── Analisi AI ───────────────────────────────────────────────────────────────

export interface AnalisiTetto {
  tipo_tetto: 'a_falde' | 'piano' | 'mansardato' | 'padiglione' | 'altro';
  numero_falde: number;
  manto_attuale: string;
  colore_manto_attuale: string;
  colore_manto_hex: string;
  presenza_lucernari: boolean;
  numero_lucernari: number;
  presenza_abbaini: boolean;
  colore_gronda_attuale: string;
  colore_gronda_hex: string;
  colore_pluviali_hex: string;
  pendenza_stimata: 'bassa' | 'media' | 'alta';
  note_particolari: string;
}

// ─── Configurazione ───────────────────────────────────────────────────────────

export type TipoManto =
  | 'tegole_coppi'
  | 'tegole_marsigliesi'
  | 'tegole_portoghesi'
  | 'tegole_piane'
  | 'ardesia_naturale'
  | 'ardesia_sintetica'
  | 'lamiera_grecata'
  | 'lamiera_aggraffata'
  | 'lamiera_zinco_titanio'
  | 'guaina_bituminosa'
  | 'guaina_tpo'
  | 'tegole_fotovoltaiche';

export type MaterialeGrondaia =
  | 'alluminio'
  | 'rame'
  | 'acciaio_zincato'
  | 'pvc'
  | 'zinco_titanio';

export interface ConfigLucernari {
  attivo: boolean;
  quantita: 1 | 2 | 3 | 4;
  tipo: 'piatto' | 'sporgente' | 'abbaino';
  posizione: 'centrale' | 'laterale' | 'distribuiti';
  colore_telaio_hex: string;
}

export interface ConfigurazioneTetto {
  manto: {
    attivo: boolean;
    tipo: TipoManto;
    colore_hex: string;
    descrizione_colore: string;
    finitura: 'opaco' | 'semi_lucido' | 'lucido';
  };
  gronde: {
    attivo: boolean;
    materiale: MaterialeGrondaia;
    colore_hex: string;
  };
  lucernari: ConfigLucernari;
  note_libere: string;
}
