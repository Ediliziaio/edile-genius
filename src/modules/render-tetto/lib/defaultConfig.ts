import type { ConfigurazioneTetto } from '../types';

export const DEFAULT_CONFIG_TETTO: ConfigurazioneTetto = {
  manto: {
    attivo: true,
    tipo: 'tegole_marsigliesi',
    colore_hex: '#8B4513',
    descrizione_colore: 'rosso mattone classico',
    finitura: 'semi_lucido',
  },
  gronde: {
    attivo: false,
    materiale: 'alluminio',
    colore_hex: '#808080',
  },
  lucernari: {
    attivo: false,
    quantita: 2,
    tipo: 'piatto',
    posizione: 'centrale',
    colore_telaio_hex: '#2C2C2C',
  },
  note_libere: '',
};
