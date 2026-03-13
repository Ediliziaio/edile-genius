export const ANALISI_TETTO_PROMPT = `Analizza questo tetto e restituisci un JSON con questa struttura esatta:
{
  "tipo_tetto": "a_falde" | "piano" | "mansardato" | "padiglione" | "altro",
  "numero_falde": number,
  "manto_attuale": "descrizione breve del materiale attuale",
  "colore_manto_attuale": "descrizione colore in italiano",
  "colore_manto_hex": "#RRGGBB",
  "presenza_lucernari": boolean,
  "numero_lucernari": number,
  "presenza_abbaini": boolean,
  "colore_gronda_attuale": "descrizione colore grondaie",
  "colore_gronda_hex": "#RRGGBB",
  "colore_pluviali_hex": "#RRGGBB",
  "pendenza_stimata": "bassa" | "media" | "alta",
  "note_particolari": "comignoli, antenne, pannelli solari, ecc."
}
Rispondi SOLO con il JSON, senza markdown o testo aggiuntivo.`;
