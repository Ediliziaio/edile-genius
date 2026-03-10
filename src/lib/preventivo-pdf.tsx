import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

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
  cliente_nome?: string;
  cliente_indirizzo?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  cliente_piva?: string;
  cliente_codice_fiscale?: string;
  voci: PreventivoVoce[];
  subtotale: number;
  sconto_globale?: number;
  imponibile: number;
  iva_percentuale: number;
  iva_importo: number;
  totale_finale: number;
  intro?: string;
  condizioni?: string;
  clausole?: string;
  firma_testo?: string;
  tempi_esecuzione?: string;
  note?: string;
  foto_copertina_url?: string;
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
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_vat?: string;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#333" },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1a1a2e" },
  companyDetails: { fontSize: 8, color: "#666", marginTop: 3 },
  prevNumber: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1a1a2e", textAlign: "right" },
  prevDate: { fontSize: 8, color: "#888", textAlign: "right", marginTop: 2 },
  // Title band
  titleBand: { padding: "10 16", borderRadius: 4, marginBottom: 16 },
  titleText: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#fff" },
  // Info grid
  infoGrid: { flexDirection: "row", gap: 16, marginBottom: 20 },
  infoBox: { flex: 1, backgroundColor: "#f8f9fa", padding: 12, borderRadius: 4 },
  infoLabel: { fontSize: 7, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  infoValue: { fontSize: 9 },
  // Intro
  intro: { fontSize: 9, color: "#555", marginBottom: 16, lineHeight: 1.5 },
  // Category header
  categoryHeader: { backgroundColor: "#f1f3f5", padding: "6 10", borderRadius: 3, marginTop: 12, marginBottom: 6 },
  categoryText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1a1a2e" },
  // Table
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd", paddingBottom: 4, marginBottom: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  tableRowHighlight: { backgroundColor: "#fffce6" },
  colNum: { width: "5%" },
  colDesc: { width: "38%" },
  colUM: { width: "7%", textAlign: "center" },
  colQty: { width: "10%", textAlign: "right" },
  colPrice: { width: "13%", textAlign: "right" },
  colDiscount: { width: "10%", textAlign: "right" },
  colTotal: { width: "17%", textAlign: "right" },
  headerText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#888", textTransform: "uppercase" },
  cellText: { fontSize: 8 },
  cellDescTitle: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  cellDescBody: { fontSize: 7, color: "#666", marginTop: 1 },
  // Subtotals
  subtotalRow: { flexDirection: "row", justifyContent: "flex-end", paddingVertical: 4, borderTopWidth: 0.5, borderTopColor: "#ddd" },
  subtotalLabel: { fontSize: 8, color: "#666", marginRight: 16 },
  subtotalValue: { fontSize: 8, fontFamily: "Helvetica-Bold", width: "17%", textAlign: "right" },
  // Totals
  totalsBox: { marginTop: 16, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 32, paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: "#666" },
  totalValue: { fontSize: 9, width: 80, textAlign: "right" },
  totalFinalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 32, paddingTop: 8, borderTopWidth: 2, borderTopColor: "#1a1a2e", marginTop: 4 },
  totalFinalLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1a1a2e" },
  totalFinalValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1a1a2e", width: 80, textAlign: "right" },
  // Conditions
  conditionsBox: { marginTop: 24, padding: 12, backgroundColor: "#f8f9fa", borderRadius: 4 },
  conditionsTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  conditionsText: { fontSize: 8, color: "#555", lineHeight: 1.5 },
  // Signature
  signatureBox: { marginTop: 32, flexDirection: "row", justifyContent: "space-between" },
  signatureCol: { width: "45%", textAlign: "center" },
  signatureLine: { borderTopWidth: 1, borderTopColor: "#ccc", marginTop: 40, paddingTop: 4 },
  signatureLabel: { fontSize: 8, color: "#888" },
  // Footer
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, textAlign: "center", fontSize: 7, color: "#bbb" },
  // Notes
  notesBox: { marginTop: 16, padding: 10, backgroundColor: "#fff9e6", borderRadius: 4, borderLeftWidth: 3, borderLeftColor: "#f0c040" },
  notesText: { fontSize: 8, color: "#666" },
  // Photo
  photo: { width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 4, marginBottom: 12 },
  vociPhoto: { width: 60, height: 45, objectFit: "cover", borderRadius: 2, marginTop: 2 },
});

function formatEuro(n: number): string {
  return `€${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function groupByCategory(voci: PreventivoVoce[]): Record<string, PreventivoVoce[]> {
  const groups: Record<string, PreventivoVoce[]> = {};
  voci.sort((a, b) => a.ordine - b.ordine).forEach((v) => {
    const cat = v.categoria || "Generale";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(v);
  });
  return groups;
}

interface Props {
  data: PreventivoData;
  template: TemplateConfig;
}

export const PreventivoPDF: React.FC<Props> = ({ data, template }) => {
  const primario = template.colore_primario || "#1a1a2e";
  const groups = groupByCategory(data.voci || []);
  let globalRowIndex = 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {template.logo_url && (
              <Image src={template.logo_url} style={{ width: 120, marginBottom: 6 }} />
            )}
            <Text style={styles.companyName}>{template.company_name || "Azienda"}</Text>
            <Text style={styles.companyDetails}>
              {[template.company_address, template.company_phone, template.company_vat ? `P.IVA: ${template.company_vat}` : ""].filter(Boolean).join("\n")}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: "#888", textAlign: "right" }}>PREVENTIVO N.</Text>
            <Text style={styles.prevNumber}>{data.numero_preventivo}</Text>
            <Text style={styles.prevDate}>
              Data: {new Date(data.created_at).toLocaleDateString("it-IT")}
            </Text>
            {data.data_scadenza && (
              <Text style={styles.prevDate}>
                Validità: {new Date(data.data_scadenza).toLocaleDateString("it-IT")}
              </Text>
            )}
          </View>
        </View>

        {/* Title Band */}
        <View style={[styles.titleBand, { backgroundColor: primario }]}>
          <Text style={styles.titleText}>
            {data.titolo || data.oggetto || "Preventivo Lavori"}
          </Text>
        </View>

        {/* Client / Ref Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={[styles.infoValue, { fontFamily: "Helvetica-Bold" }]}>{data.cliente_nome || "—"}</Text>
            {data.cliente_indirizzo && <Text style={[styles.infoValue, { fontSize: 8, color: "#666" }]}>{data.cliente_indirizzo}</Text>}
            {data.cliente_telefono && <Text style={[styles.infoValue, { fontSize: 8, color: "#666" }]}>{data.cliente_telefono}</Text>}
            {data.cliente_email && <Text style={[styles.infoValue, { fontSize: 8, color: "#666" }]}>{data.cliente_email}</Text>}
            {data.cliente_piva && <Text style={[styles.infoValue, { fontSize: 8, color: "#666" }]}>P.IVA: {data.cliente_piva}</Text>}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Riferimenti</Text>
            <Text style={styles.infoValue}>{data.oggetto || "—"}</Text>
            {data.tempi_esecuzione && <Text style={[styles.infoValue, { fontSize: 8, color: "#666", marginTop: 4 }]}>⏱ {data.tempi_esecuzione}</Text>}
          </View>
        </View>

        {/* Intro */}
        {data.intro && <Text style={styles.intro}>{data.intro}</Text>}

        {/* Cover Photo */}
        {template.show_foto_copertina && data.foto_copertina_url && (
          <Image src={data.foto_copertina_url} style={styles.photo} />
        )}

        {/* Voci Table by Category */}
        {Object.entries(groups).map(([categoria, voci]) => {
          const catSubtotal = voci.reduce((s, v) => s + (v.totale || 0), 0);
          return (
            <View key={categoria} wrap={false}>
              {/* Category Header */}
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryText}>{categoria}</Text>
              </View>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.colNum, styles.headerText]}>#</Text>
                <Text style={[styles.colDesc, styles.headerText]}>Descrizione</Text>
                <Text style={[styles.colUM, styles.headerText]}>U.M.</Text>
                <Text style={[styles.colQty, styles.headerText]}>Q.tà</Text>
                <Text style={[styles.colPrice, styles.headerText]}>Prezzo</Text>
                <Text style={[styles.colDiscount, styles.headerText]}>Sconto</Text>
                <Text style={[styles.colTotal, styles.headerText]}>Totale</Text>
              </View>

              {/* Rows */}
              {voci.map((v) => {
                globalRowIndex++;
                return (
                  <View key={v.id} style={[styles.tableRow, v.evidenziata ? styles.tableRowHighlight : {}]}>
                    <Text style={[styles.colNum, styles.cellText]}>{globalRowIndex}</Text>
                    <View style={styles.colDesc}>
                      <Text style={styles.cellDescTitle}>{v.titolo_voce}</Text>
                      {v.descrizione && v.descrizione !== v.titolo_voce && (
                        <Text style={styles.cellDescBody}>{v.descrizione}</Text>
                      )}
                      {v.note_voce && (
                        <Text style={[styles.cellDescBody, { fontStyle: "italic" }]}>💡 {v.note_voce}</Text>
                      )}
                      {template.show_foto_voci && v.foto_urls?.length > 0 && (
                        <View style={{ flexDirection: "row", gap: 4, marginTop: 3 }}>
                          {v.foto_urls.slice(0, 3).map((url, fi) => (
                            <Image key={fi} src={url} style={styles.vociPhoto} />
                          ))}
                        </View>
                      )}
                    </View>
                    <Text style={[styles.colUM, styles.cellText]}>{v.unita_misura}</Text>
                    <Text style={[styles.colQty, styles.cellText]}>{v.quantita.toFixed(2)}</Text>
                    <Text style={[styles.colPrice, styles.cellText]}>{formatEuro(v.prezzo_unitario)}</Text>
                    <Text style={[styles.colDiscount, styles.cellText]}>
                      {v.sconto_percentuale > 0 ? `${v.sconto_percentuale}%` : "—"}
                    </Text>
                    <Text style={[styles.colTotal, styles.cellText, { fontFamily: "Helvetica-Bold" }]}>
                      {formatEuro(v.totale)}
                    </Text>
                  </View>
                );
              })}

              {/* Category Subtotal */}
              {template.show_subtotali_categoria && (
                <View style={styles.subtotalRow}>
                  <Text style={styles.subtotalLabel}>Subtotale {categoria}:</Text>
                  <Text style={styles.subtotalValue}>{formatEuro(catSubtotal)}</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotale</Text>
            <Text style={styles.totalValue}>{formatEuro(data.subtotale)}</Text>
          </View>
          {(data.sconto_globale || 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sconto {data.sconto_globale}%</Text>
              <Text style={styles.totalValue}>-{formatEuro(data.subtotale * (data.sconto_globale! / 100))}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Imponibile</Text>
            <Text style={styles.totalValue}>{formatEuro(data.imponibile)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA ({data.iva_percentuale}%)</Text>
            <Text style={styles.totalValue}>{formatEuro(data.iva_importo)}</Text>
          </View>
          <View style={styles.totalFinalRow}>
            <Text style={styles.totalFinalLabel}>TOTALE</Text>
            <Text style={styles.totalFinalValue}>{formatEuro(data.totale_finale)}</Text>
          </View>
        </View>

        {/* Notes */}
        {data.note && (
          <View style={styles.notesBox}>
            <Text style={[styles.conditionsTitle, { color: "#b08000" }]}>📝 Note</Text>
            <Text style={styles.notesText}>{data.note}</Text>
          </View>
        )}

        {/* Conditions & Clausole */}
        {template.show_condizioni && (data.condizioni || data.clausole) && (
          <View style={styles.conditionsBox}>
            {data.condizioni && (
              <>
                <Text style={styles.conditionsTitle}>Condizioni di Pagamento</Text>
                <Text style={styles.conditionsText}>{data.condizioni}</Text>
              </>
            )}
            {data.clausole && (
              <>
                <Text style={[styles.conditionsTitle, { marginTop: 8 }]}>Clausole</Text>
                <Text style={styles.conditionsText}>{data.clausole}</Text>
              </>
            )}
          </View>
        )}

        {/* Signature */}
        {template.show_firma && (
          <View style={styles.signatureBox}>
            <View style={styles.signatureCol}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureLabel}>{data.firma_testo || "Il Responsabile"}</Text>
              </View>
            </View>
            <View style={styles.signatureCol}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureLabel}>Il Cliente (per accettazione)</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {template.piede_pagina || `${template.company_name || "Edile Genius"} — Preventivo ${data.numero_preventivo}`}
        </Text>
      </Page>
    </Document>
  );
};
