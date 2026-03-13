import type { ConfigurazioneTetto, AnalisiTetto } from '../types';

// ─── Dizionari descrittivi ────────────────────────────────────────────────────

const MANTO_DESC: Record<string, string> = {
  tegole_coppi:
    'tegole coppo in laterizio (canale e coppo), forma semicilindrica, disposizione alternata concava/convessa, giunture con malta o senza, tipica architettura mediterranea italiana',
  tegole_marsigliesi:
    'tegole marsigliesi in laterizio o calcestruzzo, profilo a doppia onda, incastro maschio-femmina, aspetto rustico toscano',
  tegole_portoghesi:
    'tegole portoghesi in laterizio, profilo a S singola onda, disposizione a file sfalsate, tono caldo',
  tegole_piane:
    'tegole piane in laterizio o calcestruzzo, superficie liscia, file parallele con sovrapposizione regolare, aspetto pulito e moderno',
  ardesia_naturale:
    'lastre di ardesia naturale nera/grigio scuro, tagliate a rettangolo, disposizione a squame di pesce, superficie rugosa con venature naturali',
  ardesia_sintetica:
    'lastre di ardesia sintetica, colore omogeneo grigio ardesia, superficie uniforme, aspetto contemporaneo',
  lamiera_grecata:
    'lamiera grecata in acciaio zincato o preverniciato, profilo a greche regolari parallele alla pendenza, giunti sovrapposti, linee nette e industriali',
  lamiera_aggraffata:
    'lamiera a doppia aggraffatura stante, pannelli stretti separati da nervature verticali arrotondate, aspetto elegante e moderno, senza viti a vista',
  lamiera_zinco_titanio:
    'lastre di zinco titanio naturale, colore grigio piombo con patina blu-grigia uniforme, superficie leggermente matta, giunti aggraffati',
  guaina_bituminosa:
    'guaina bituminosa ardesiata grigio antracite, superficie con graniglie minerali, aspetto pianeggiante con linee di sovrapposizione visibili, tipica di tetti piani',
  guaina_tpo:
    'membrana TPO bianca o grigio chiaro, completamente liscia, giunti saldati a caldo impercettibili, aspetto industriale pulito',
  tegole_fotovoltaiche:
    'tegole fotovoltaiche integrate tipo Solar Roof, superficie vitrea blu-nera scura, aspetto identico a tegole normali ma con riflesso vetrato uniforme, integrate flush con il piano del tetto',
};

const FINITURA_DESC: Record<string, string> = {
  opaco: 'finitura completamente opaca, nessun riflesso speculare, assorbimento totale della luce',
  semi_lucido: 'finitura semi-lucida con leggeri riflessi diffusi, naturale e realistico',
  lucido: 'finitura lucida con riflessi speculari visibili, aspetto smaltato',
};

const GRONDA_MATERIALE_DESC: Record<string, string> = {
  alluminio: 'grondaia e pluviali in alluminio preverniciato',
  rame: 'grondaia e pluviali in rame naturale con tono ramato caldo',
  acciaio_zincato: 'grondaia e pluviali in acciaio zincato grigio argento',
  pvc: 'grondaia e pluviali in PVC, aspetto plastico leggero',
  zinco_titanio: 'grondaia e pluviali in zinco titanio grigio piombo',
};

const LUCERNARIO_DESC: Record<string, string> = {
  piatto: 'lucernario a tetto piatto, vetro piano rasente la falda, filo tetto',
  sporgente: 'lucernario Velux sporgente con battente inclinato, telaio esterno visibile',
  abbaino: 'abbaino con frontone verticale, tetto proprio a spiovente, finestra verticale',
};

// ─── Build prompt ─────────────────────────────────────────────────────────────

export function buildTettoPrompt(
  config: ConfigurazioneTetto,
  analisi?: AnalisiTetto | null,
  tipoTetto?: string | null,
): string {
  const blocchi: string[] = [];

  // ── BLOCCO A: Contesto
  const tipoLabel = (tipoTetto || analisi?.tipo_tetto || 'sconosciuto').replace(/_/g, ' ');
  const contesto = analisi
    ? `Tetto attuale: tipo ${tipoLabel}, ${analisi.numero_falde} fald${analisi.numero_falde === 1 ? 'a' : 'e'}, manto attuale ${analisi.manto_attuale}, colore attuale ${analisi.colore_manto_attuale}.`
    : `Foto di un tetto di edificio (tipo: ${tipoLabel}).`;
  blocchi.push(`[CONTESTO] ${contesto}`);

  // ── BLOCCO B: Manto
  if (config.manto.attivo) {
    const descManto = MANTO_DESC[config.manto.tipo] || config.manto.tipo;
    const descFinitura = FINITURA_DESC[config.manto.finitura] || '';
    const coloreDesc = config.manto.descrizione_colore
      ? `colore ${config.manto.descrizione_colore} (${config.manto.colore_hex})`
      : `colore ${config.manto.colore_hex}`;

    blocchi.push(
      `[MANTO] Sostituisci l'intero manto di copertura con: ${descManto}. ` +
      `Applica ${coloreDesc}. ${descFinitura}. ` +
      `Rispetta la pendenza delle falde, le sovrapposizioni fisiche delle tegole/lamiera, le ombre proprie e portate. ` +
      `La dimensione degli elementi deve essere proporzionale alla scala reale dell'edificio.`,
    );
  }

  // ── BLOCCO C: Gronde
  if (config.gronde.attivo) {
    const descMat = GRONDA_MATERIALE_DESC[config.gronde.materiale] || config.gronde.materiale;
    blocchi.push(
      `[GRONDE] Sostituisci grondaie e pluviali con ${descMat}, ` +
      `colore ${config.gronde.colore_hex}. ` +
      `Mantieni forma, dimensione e percorso delle grondaie esistenti. ` +
      `Applica il colore a tutti i canali di raccolta e i tubi di discesa visibili.`,
    );
  }

  // ── BLOCCO D: Lucernari
  if (config.lucernari.attivo) {
    const descLuc = LUCERNARIO_DESC[config.lucernari.tipo] || config.lucernari.tipo;
    const posDesc: Record<string, string> = {
      centrale: 'in posizione centrale sulla falda',
      laterale: 'nella parte laterale della falda',
      distribuiti: 'distribuiti uniformemente sulla falda',
    };

    if (analisi?.presenza_lucernari) {
      blocchi.push(
        `[LUCERNARI] Mantieni i lucernari esistenti (${analisi.numero_lucernari}). ` +
        `Aggiorna il telaio esterno al colore ${config.lucernari.colore_telaio_hex}. ` +
        `Tipo: ${descLuc}.`,
      );
    } else {
      blocchi.push(
        `[LUCERNARI] Aggiungi ${config.lucernari.quantita} lucernar${config.lucernari.quantita === 1 ? 'io' : 'i'} ${descLuc}, ` +
        `${posDesc[config.lucernari.posizione]}, integrati con il manto senza soluzione di continuità. ` +
        `Telaio esterno colore ${config.lucernari.colore_telaio_hex}. ` +
        `Vetro con riflesso cielo naturale. ` +
        `Rispetta la pendenza della falda nella posizione del lucernario.`,
      );
    }
  }

  // ── BLOCCO E: Note libere
  if (config.note_libere?.trim()) {
    blocchi.push(`[NOTE] ${config.note_libere.trim()}`);
  }

  // ── BLOCCO Z: Vincoli finali
  blocchi.push(
    `[VINCOLI] NON modificare: pareti esterne, finestre, porte, balconi, vegetazione, cielo, terreno. ` +
    `Mantieni prospettiva, angolo di ripresa, ombre ambientali, meteo e ora del giorno dell'originale. ` +
    `Risultato deve sembrare una fotografia reale professionale.`,
  );

  return blocchi.join('\n\n');
}
