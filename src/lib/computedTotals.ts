import type { PreventivoVoce } from '@/lib/preventivo-pdf';

export interface ComputedTotals {
  subtotale: number;
  scontoTotale: number;
  imponibile: number;
  iva: number;
  totale: number;
  voceCount: number;
}

/**
 * Recomputes a PreventivoVoce totale from its quantities + discount.
 */
export function computeVoceTotale(v: PreventivoVoce): number {
  const lordo = v.quantita * v.prezzo_unitario;
  const sconto = lordo * ((v.sconto_percentuale ?? 0) / 100);
  return Math.round((lordo - sconto) * 100) / 100;
}

/**
 * Computes all order-level totals from a list of voci + IVA percentage.
 */
export function computeTotals(voci: PreventivoVoce[], ivaPercentuale = 22): ComputedTotals {
  let subtotale = 0;
  let scontoTotale = 0;

  for (const v of voci) {
    const lordo = v.quantita * v.prezzo_unitario;
    const sconto = lordo * ((v.sconto_percentuale ?? 0) / 100);
    subtotale += lordo;
    scontoTotale += sconto;
  }

  const imponibile = Math.round((subtotale - scontoTotale) * 100) / 100;
  const iva = Math.round(imponibile * (ivaPercentuale / 100) * 100) / 100;
  const totale = Math.round((imponibile + iva) * 100) / 100;

  return {
    subtotale: Math.round(subtotale * 100) / 100,
    scontoTotale: Math.round(scontoTotale * 100) / 100,
    imponibile,
    iva,
    totale,
    voceCount: voci.length,
  };
}

/** Format a number as Italian currency string (€) */
export function formatEuro(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
}
