import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  pdf,
} from "@react-pdf/renderer";

import type { PreventivoSezione, RenderConfig } from '@/modules/preventivo/types';

// Types
export interface PreventivoVoce {
  id: string;
  ordine: number;
  categoria: string;
  titolo_voce: string;
  descrizione: string;
  unita_misura: string;
  quantita: number;
  prezzo_unitario: number;
  sconto_percentuale: number;
  totale: number;
  foto_urls: string[];
  note_voce: string;
  evidenziata: boolean;
}

export interface PreventivoData {
  numero_preventivo: string;
  titolo?: string;
  oggetto?: string;
  created_at: string;
  data_scadenza?: string;
  luogo_lavori?: string;
  cliente_nome?: string;
  cliente_indirizzo?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  cliente_piva?: string;
  cliente_codice_fiscale?: string;
  voci: PreventivoVoce[];
  subtotale: number;
  sconto_globale_percentuale?: number;
  sconto_globale_importo?: number;
  imponibile: number;
  iva_percentuale: number;
  iva_importo: number;
  totale_finale: number;
  intro?: string;
  condizioni?: string;
  condizioni_pagamento?: string;
  clausole?: string;
  note_finali?: string;
  firma_testo?: string;
  tempi_esecuzione?: string;
  note?: string;
  foto_copertina_url?: string;
  foto_sopralluogo_urls?: string[];
  validita_giorni?: number;
}

export interface TemplateConfig {
  logo_url?: string;
  colore_primario: string;
  colore_secondario: string;
  intestazione_azienda?: string;
  piede_pagina?: string;
  show_foto_copertina: boolean;
  show_foto_voci: boolean;
  show_subtotali_categoria: boolean;
  show_firma: boolean;
  show_condizioni: boolean;
  azienda_nome?: string;
  azienda_indirizzo?: string;
  azienda_telefono?: string;
  azienda_email?: string;
  azienda_piva?: string;
  azienda_cf?: string;
  azienda_rea?: string;
  azienda_sito?: string;
  // legacy compat
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_vat?: string;
}

// ── AI Section data passed from DB sezioni_json ──────────────────────────
export interface SezioneContenuto {
  testo: string;
  chunks_usati?: string[];
}

// ── Render gallery entry ─────────────────────────────────────────────────
export interface RenderEntry {
  url: string;
  titolo?: string;
  tipo?: string;
}

// ✅ createStyles — dynamic colors, NO gap/objectFit/textTransform/shorthand
const createStyles = (primario: string, secondario: string) =>
  StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 9,
      color: "#1a1a1a",
      paddingBottom: 50,
    },
    // HEADER
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingTop: 20,
      paddingRight: 30,
      paddingBottom: 16,
      paddingLeft: 30,
      borderBottomWidth: 3,
      borderBottomColor: primario,
    },
    logo: { width: 120, height: 50 },
    headerCompany: { fontSize: 11, fontFamily: "Helvetica-Bold", color: secondario },
    headerInfo: { fontSize: 8, color: "#6b7280", marginBottom: 2 },
    headerRight: { alignItems: "flex-end" },
    headerRightItem: { marginBottom: 2 },
    prevLabel: { fontSize: 7, color: "#9ca3af", marginBottom: 1 },
    prevNumber: { fontSize: 14, fontFamily: "Helvetica-Bold", color: secondario, textAlign: "right" },
    prevDate: { fontSize: 8, color: "#6b7280", textAlign: "right", marginTop: 2 },
    // TITLE BAND
    titleBand: {
      backgroundColor: primario,
      paddingTop: 14,
      paddingRight: 30,
      paddingBottom: 14,
      paddingLeft: 30,
      marginBottom: 16,
    },
    titleText: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "white" },
    titleSub: { fontSize: 9, color: "#ffffff", opacity: 0.9, marginTop: 3 },
    // INFO GRID — no gap, use marginRight
    infoGrid: {
      flexDirection: "row",
      marginLeft: 30,
      marginRight: 30,
      marginBottom: 20,
    },
    infoBox: {
      flex: 1,
      backgroundColor: "#f8f9fa",
      paddingTop: 10,
      paddingRight: 12,
      paddingBottom: 10,
      paddingLeft: 12,
      borderRadius: 4,
      marginRight: 12,
    },
    infoBoxLast: {
      flex: 1,
      backgroundColor: "#f8f9fa",
      paddingTop: 10,
      paddingRight: 12,
      paddingBottom: 10,
      paddingLeft: 12,
      borderRadius: 4,
    },
    infoLabel: { fontSize: 7, color: "#9ca3af", letterSpacing: 1, marginBottom: 4 },
    infoValue: { fontSize: 9, marginBottom: 1 },
    infoValueBold: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 },
    // INTRO
    introBox: {
      marginLeft: 30,
      marginRight: 30,
      marginBottom: 16,
      paddingLeft: 10,
      borderLeftWidth: 3,
      borderLeftColor: primario,
    },
    introText: { fontSize: 9, color: "#555555", lineHeight: 1.5 },
    // COVER PHOTOS
    coverPhotoRow: {
      flexDirection: "row",
      marginLeft: 30,
      marginRight: 30,
      marginBottom: 16,
    },
    coverPhoto: { width: 170, height: 120, borderRadius: 4, marginRight: 8 },
    // CATEGORY
    categoryHeader: {
      backgroundColor: primario,
      paddingTop: 6,
      paddingRight: 12,
      paddingBottom: 6,
      paddingLeft: 12,
      borderRadius: 3,
      marginTop: 14,
      marginBottom: 6,
      marginLeft: 30,
      marginRight: 30,
    },
    categoryText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white" },
    // TABLE
    tableArea: { marginLeft: 30, marginRight: 30 },
    tableHeader: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#d1d5db",
      paddingBottom: 4,
      marginBottom: 4,
    },
    tableRow: {
      flexDirection: "row",
      paddingTop: 4,
      paddingBottom: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: "#e5e7eb",
    },
    tableRowHighlight: { backgroundColor: "#fffce6" },
    colNum: { width: "5%" },
    colDesc: { width: "38%" },
    colUM: { width: "7%", textAlign: "center" },
    colQty: { width: "10%", textAlign: "right" },
    colPrice: { width: "13%", textAlign: "right" },
    colDiscount: { width: "10%", textAlign: "right" },
    colTotal: { width: "17%", textAlign: "right" },
    headerText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#9ca3af" },
    cellText: { fontSize: 8 },
    cellDescTitle: { fontSize: 8, fontFamily: "Helvetica-Bold" },
    cellDescBody: { fontSize: 7, color: "#6b7280", marginTop: 1 },
    cellNote: { fontSize: 7, color: "#b45309", marginTop: 1 },
    // VOCE PHOTOS
    vocePhotoRow: { flexDirection: "row", marginTop: 3 },
    vocePhoto: { width: 60, height: 45, borderRadius: 2, marginRight: 4 },
    // SUBTOTAL ROW
    subtotalRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingTop: 4,
      paddingBottom: 4,
      borderTopWidth: 0.5,
      borderTopColor: "#d1d5db",
      marginLeft: 30,
      marginRight: 30,
    },
    subtotalLabel: { fontSize: 8, color: "#6b7280", marginRight: 16 },
    subtotalValue: { fontSize: 8, fontFamily: "Helvetica-Bold", width: "17%", textAlign: "right" },
    // TOTALS
    totalsBox: { marginTop: 16, marginLeft: 30, marginRight: 30, alignItems: "flex-end" },
    totalRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingTop: 3,
      paddingBottom: 3,
    },
    totalLabel: { fontSize: 9, color: "#6b7280", marginRight: 32 },
    totalValue: { fontSize: 9, width: 80, textAlign: "right" },
    totalFinalRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingTop: 8,
      borderTopWidth: 2,
      borderTopColor: secondario,
      marginTop: 4,
    },
    totalFinalLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: secondario, marginRight: 32 },
    totalFinalValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: secondario, width: 80, textAlign: "right" },
    // VALIDITY
    validityBox: {
      marginTop: 12,
      marginLeft: 30,
      marginRight: 30,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 12,
      paddingRight: 12,
      backgroundColor: "#fffbeb",
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: "#f59e0b",
    },
    validityText: { fontSize: 8, color: "#92400e" },
    // CONDITIONS
    conditionsBox: {
      marginTop: 16,
      marginLeft: 30,
      marginRight: 30,
      paddingTop: 12,
      paddingRight: 12,
      paddingBottom: 12,
      paddingLeft: 12,
      backgroundColor: "#f8f9fa",
      borderRadius: 4,
    },
    conditionsTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 4 },
    conditionsText: { fontSize: 8, color: "#555555", lineHeight: 1.5 },
    // NOTES
    notesBox: {
      marginTop: 12,
      marginLeft: 30,
      marginRight: 30,
      paddingTop: 10,
      paddingRight: 10,
      paddingBottom: 10,
      paddingLeft: 10,
      backgroundColor: "#fff9e6",
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: "#f0c040",
    },
    notesText: { fontSize: 8, color: "#6b7280" },
    // SIGNATURE
    signatureBox: {
      marginTop: 32,
      marginLeft: 30,
      marginRight: 30,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    signatureCol: { width: "45%", textAlign: "center" },
    signatureLine: { borderTopWidth: 1, borderTopColor: "#cccccc", marginTop: 40, paddingTop: 4 },
    signatureLabel: { fontSize: 8, color: "#9ca3af" },
    // FOOTER
    footer: {
      position: "absolute",
      bottom: 20,
      left: 30,
      right: 30,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    footerText: { fontSize: 7, color: "#bbbbbb" },
  });

function formatEuro(n: number): string {
  return `€ ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("it-IT");
  } catch {
    return d;
  }
}

function groupByCategory(voci: PreventivoVoce[]): Map<string, PreventivoVoce[]> {
  const map = new Map<string, PreventivoVoce[]>();
  voci.sort((a, b) => a.ordine - b.ordine).forEach((v) => {
    const cat = v.categoria || "Generale";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(v);
  });
  return map;
}

interface Props {
  data: PreventivoData;
  template: TemplateConfig;
  /** AI-generated section content keyed by sezioneId */
  sezioniContenuto?: Record<string, SezioneContenuto>;
  /** Template section definitions for ordering and display */
  sezioniTemplate?: PreventivoSezione[];
  /** Render gallery entries */
  renderEntries?: RenderEntry[];
}

// ── AI Text Section sub-component ────────────────────────────────────────
const AITextSection: React.FC<{
  titolo: string;
  testo: string;
  primario: string;
}> = ({ titolo, testo, primario }) => {
  const paragraphs = testo.split(/\n\n+/).filter(p => p.trim());
  return (
    <View style={{ marginLeft: 30, marginRight: 30, marginBottom: 16 }} wrap={false}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <View style={{ width: 3, height: 12, backgroundColor: primario, marginRight: 6 }} />
        <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1e293b" }}>{titolo}</Text>
      </View>
      {paragraphs.map((p, i) => (
        <Text key={i} style={{ fontSize: 9, color: "#555555", lineHeight: 1.5, marginBottom: 4 }}>
          {p.trim()}
        </Text>
      ))}
    </View>
  );
};

// ── Render Gallery sub-component ─────────────────────────────────────────
const RenderGallerySection: React.FC<{
  entries: RenderEntry[];
  primario: string;
  titolo: string;
  mostraDisclaimer: boolean;
}> = ({ entries, primario, titolo, mostraDisclaimer }) => (
  <View style={{ marginLeft: 30, marginRight: 30, marginBottom: 16 }}>
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
      <View style={{ width: 3, height: 12, backgroundColor: primario, marginRight: 6 }} />
      <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1e293b" }}>{titolo}</Text>
    </View>
    {mostraDisclaimer && (
      <View style={{
        backgroundColor: "#fffce6", borderRadius: 3, paddingTop: 4, paddingBottom: 4,
        paddingLeft: 8, paddingRight: 8, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: "#f59e0b",
      }}>
        <Text style={{ fontSize: 7, color: "#92400e" }}>
          {"Le immagini sono render simulati generati dall'AI a scopo illustrativo."}
        </Text>
      </View>
    )}
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {entries.map((entry, i) => (
        <View key={i} style={{ width: "48%", marginRight: i % 2 === 0 ? "4%" : 0, marginBottom: 10 }}>
          <Image src={entry.url} style={{ width: "100%", height: 100, borderRadius: 3 }} />
          {entry.titolo && (
            <Text style={{ fontSize: 7, color: "#6b7280", marginTop: 2 }}>{entry.titolo}</Text>
          )}
          {entry.tipo && (
            <Text style={{ fontSize: 6, color: primario, marginTop: 1 }}>{entry.tipo}</Text>
          )}
        </View>
      ))}
    </View>
  </View>
);

export const PreventivoPDF: React.FC<Props> = ({
  data, template, sezioniContenuto, sezioniTemplate, renderEntries,
}) => {
  const primario = template.colore_primario || "#f4a100";
  const secondario = template.colore_secondario || "#1e293b";
  const S = React.useMemo(() => createStyles(primario, secondario), [primario, secondario]);
  const categorieMap = groupByCategory(data.voci || []);
  const isDraft = (data as any).stato === "bozza";

  const companyName = template.azienda_nome || template.company_name || "Azienda";
  const companyAddress = template.azienda_indirizzo || template.company_address;
  const companyPhone = template.azienda_telefono || template.company_phone;
  const companyEmail = template.azienda_email;
  const companyPiva = template.azienda_piva || template.company_vat;

  // Cover photos (max 3)
  const fotoCopertina: string[] = [];
  if (data.foto_copertina_url) fotoCopertina.push(data.foto_copertina_url);
  if (data.foto_sopralluogo_urls) {
    for (const u of data.foto_sopralluogo_urls) {
      if (fotoCopertina.length >= 3) break;
      if (!fotoCopertina.includes(u)) fotoCopertina.push(u);
    }
  }

  let globalRow = 0;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* WATERMARK BOZZA */}
        {isDraft && (
          <View style={{
            position: "absolute",
            top: "35%",
            left: "15%",
            width: "70%",
            transform: "rotate(-45deg)",
            opacity: 0.08,
          }} fixed>
            <Text style={{
              fontSize: 72,
              fontFamily: "Helvetica-Bold",
              color: "#000000",
              textAlign: "center",
            }}>BOZZA</Text>
          </View>
        )}
        {/* HEADER */}
        <View style={S.header}>
          <View>
            {template.logo_url && <Image src={template.logo_url} style={S.logo} />}
            <Text style={S.headerCompany}>{companyName}</Text>
            {companyAddress && <Text style={S.headerInfo}>{companyAddress}</Text>}
            {companyPhone && <Text style={S.headerInfo}>{"Tel: " + companyPhone}</Text>}
            {companyEmail && <Text style={S.headerInfo}>{companyEmail}</Text>}
            {companyPiva && <Text style={S.headerInfo}>{"P.IVA: " + companyPiva}</Text>}
          </View>
          <View style={S.headerRight}>
            <Text style={S.prevLabel}>{"PREVENTIVO"}</Text>
            <Text style={S.prevNumber}>{data.numero_preventivo}</Text>
            <Text style={S.prevDate}>{"Data: " + formatDate(data.created_at)}</Text>
            {data.data_scadenza && (
              <Text style={S.prevDate}>{"Valido fino al: " + formatDate(data.data_scadenza)}</Text>
            )}
          </View>
        </View>

        {/* TITLE BAND */}
        <View style={S.titleBand}>
          <Text style={S.titleText}>{data.titolo || data.oggetto || "Preventivo Lavori"}</Text>
          {data.tempi_esecuzione && (
            <Text style={S.titleSub}>{"Tempi: " + data.tempi_esecuzione}</Text>
          )}
        </View>

        {/* INFO GRID: Cliente + Riferimenti */}
        <View style={S.infoGrid}>
          <View style={S.infoBox}>
            <Text style={S.infoLabel}>{"DESTINATARIO"}</Text>
            <Text style={S.infoValueBold}>{data.cliente_nome || "—"}</Text>
            {data.cliente_indirizzo && <Text style={S.infoValue}>{data.cliente_indirizzo}</Text>}
            {data.cliente_email && <Text style={S.infoValue}>{data.cliente_email}</Text>}
            {data.cliente_telefono && <Text style={S.infoValue}>{"Tel: " + data.cliente_telefono}</Text>}
            {data.cliente_piva && <Text style={S.infoValue}>{"P.IVA: " + data.cliente_piva}</Text>}
          </View>
          <View style={S.infoBoxLast}>
            <Text style={S.infoLabel}>{"RIFERIMENTI"}</Text>
            <Text style={S.infoValue}>{"N. " + data.numero_preventivo}</Text>
            {data.luogo_lavori && <Text style={S.infoValue}>{"Luogo: " + data.luogo_lavori}</Text>}
            {data.oggetto && <Text style={S.infoValue}>{"Oggetto: " + data.oggetto}</Text>}
          </View>
        </View>

        {/* INTRO */}
        {data.intro && (
          <View style={S.introBox}>
            <Text style={S.introText}>{data.intro}</Text>
          </View>
        )}

        {/* COVER PHOTOS */}
        {template.show_foto_copertina && fotoCopertina.length > 0 && (
          <View style={S.coverPhotoRow}>
            {fotoCopertina.map((url, i) => (
              <Image key={i} src={url} style={S.coverPhoto} />
            ))}
          </View>
        )}

        {/* VOCI PER CATEGORIA */}
        {Array.from(categorieMap.entries()).map(([categoria, voci]) => {
          const totaleCat = voci.reduce((s, v) => s + (v.totale || 0), 0);
          return (
            <View key={categoria} wrap={false}>
              <View style={S.categoryHeader}>
                <Text style={S.categoryText}>{categoria.toUpperCase()}</Text>
              </View>
              <View style={S.tableArea}>
                <View style={S.tableHeader}>
                  <Text style={[S.colNum, S.headerText]}>{"#"}</Text>
                  <Text style={[S.colDesc, S.headerText]}>{"DESCRIZIONE"}</Text>
                  <Text style={[S.colUM, S.headerText]}>{"U.M."}</Text>
                  <Text style={[S.colQty, S.headerText]}>{"QTA"}</Text>
                  <Text style={[S.colPrice, S.headerText]}>{"PREZZO"}</Text>
                  <Text style={[S.colDiscount, S.headerText]}>{"SC."}</Text>
                  <Text style={[S.colTotal, S.headerText]}>{"TOTALE"}</Text>
                </View>
                {voci.map((v) => {
                  globalRow++;
                  return (
                    <View key={v.id} style={[S.tableRow, v.evidenziata ? S.tableRowHighlight : {}]}>
                      <Text style={[S.colNum, S.cellText]}>{String(globalRow)}</Text>
                      <View style={S.colDesc}>
                        <Text style={S.cellDescTitle}>{v.titolo_voce}</Text>
                        {v.descrizione && v.descrizione !== v.titolo_voce && (
                          <Text style={S.cellDescBody}>{v.descrizione}</Text>
                        )}
                        {v.note_voce ? <Text style={S.cellNote}>{v.note_voce}</Text> : null}
                        {template.show_foto_voci && v.foto_urls?.length > 0 && (
                          <View style={S.vocePhotoRow}>
                            {v.foto_urls.slice(0, 3).map((url, fi) => (
                              <Image key={fi} src={url} style={S.vocePhoto} />
                            ))}
                          </View>
                        )}
                      </View>
                      <Text style={[S.colUM, S.cellText]}>{v.unita_misura}</Text>
                      <Text style={[S.colQty, S.cellText]}>{v.quantita.toFixed(2)}</Text>
                      <Text style={[S.colPrice, S.cellText]}>{formatEuro(v.prezzo_unitario)}</Text>
                      <Text style={[S.colDiscount, S.cellText]}>
                        {v.sconto_percentuale > 0 ? v.sconto_percentuale + "%" : "—"}
                      </Text>
                      <Text style={[S.colTotal, S.cellText, { fontFamily: "Helvetica-Bold" }]}>
                        {formatEuro(v.totale)}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {template.show_subtotali_categoria && (
                <View style={S.subtotalRow}>
                  <Text style={S.subtotalLabel}>{"Subtotale " + categoria + ":"}</Text>
                  <Text style={S.subtotalValue}>{formatEuro(totaleCat)}</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* TOTALS */}
        <View style={S.totalsBox}>
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>{"Subtotale"}</Text>
            <Text style={S.totalValue}>{formatEuro(data.subtotale)}</Text>
          </View>
          {(data.sconto_globale_percentuale || 0) > 0 && (
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>{"Sconto " + data.sconto_globale_percentuale + "%"}</Text>
              <Text style={S.totalValue}>{"-" + formatEuro(data.sconto_globale_importo || 0)}</Text>
            </View>
          )}
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>{"Imponibile"}</Text>
            <Text style={S.totalValue}>{formatEuro(data.imponibile)}</Text>
          </View>
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>{"IVA " + data.iva_percentuale + "%"}</Text>
            <Text style={S.totalValue}>{formatEuro(data.iva_importo)}</Text>
          </View>
          <View style={S.totalFinalRow}>
            <Text style={S.totalFinalLabel}>{"TOTALE"}</Text>
            <Text style={S.totalFinalValue}>{formatEuro(data.totale_finale)}</Text>
          </View>
        </View>

        {/* VALIDITY */}
        {data.validita_giorni && (
          <View style={S.validityBox}>
            <Text style={S.validityText}>
              {"Il presente preventivo ha validita " + data.validita_giorni + " giorni dalla data di emissione" +
                (data.data_scadenza ? " (scade il " + formatDate(data.data_scadenza) + ")" : "") + "."}
            </Text>
          </View>
        )}

        {/* CONDITIONS */}
        {template.show_condizioni && (data.condizioni || data.condizioni_pagamento || data.clausole) && (
          <View style={S.conditionsBox}>
            {(data.condizioni_pagamento || data.condizioni) && (
              <View>
                <Text style={S.conditionsTitle}>{"CONDIZIONI DI PAGAMENTO"}</Text>
                <Text style={S.conditionsText}>{data.condizioni_pagamento || data.condizioni}</Text>
              </View>
            )}
            {data.clausole && (
              <View style={{ marginTop: 8 }}>
                <Text style={S.conditionsTitle}>{"CLAUSOLE E CONDIZIONI"}</Text>
                <Text style={S.conditionsText}>{data.clausole}</Text>
              </View>
            )}
          </View>
        )}

        {/* NOTES */}
        {(data.note || data.note_finali) && (
          <View style={S.notesBox}>
            <Text style={[S.conditionsTitle, { color: "#b08000" }]}>{"NOTE"}</Text>
            <Text style={S.notesText}>{data.note_finali || data.note}</Text>
          </View>
        )}

        {/* SIGNATURE */}
        {template.show_firma && (
          <View style={S.signatureBox}>
            <View style={S.signatureCol}>
              <View style={S.signatureLine}>
                <Text style={S.signatureLabel}>{"Firma e timbro"}</Text>
                <Text style={[S.signatureLabel, { color: "#555" }]}>{companyName}</Text>
              </View>
            </View>
            <View style={S.signatureCol}>
              <View style={S.signatureLine}>
                <Text style={S.signatureLabel}>{"Per accettazione"}</Text>
                <Text style={[S.signatureLabel, { color: "#555" }]}>{data.cliente_nome || ""}</Text>
              </View>
            </View>
          </View>
        )}

        {/* FOOTER */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>
            {template.piede_pagina || companyName + " — " + data.numero_preventivo}
          </Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) =>
            "Pagina " + pageNumber + " di " + totalPages
          } />
        </View>
      </Page>
    </Document>
  );
};

// Export utility functions
export async function getPreventivoBlob(data: PreventivoData, template: TemplateConfig): Promise<Blob> {
  return await pdf(<PreventivoPDF data={data} template={template} />).toBlob();
}

export async function downloadPreventivoAsPdf(data: PreventivoData, template: TemplateConfig, filename?: string): Promise<void> {
  const blob = await getPreventivoBlob(data, template);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `${data.numero_preventivo}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
