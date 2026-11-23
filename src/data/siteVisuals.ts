export interface SiteVisual {
  id: string;
  alt: string;
}

export const SITE_VISUALS = {
  voice: { id: "agenti-vocali-edilizia", alt: "Cuffie, telefono e agenda di un ufficio edile: illustrazione AI dell'assistenza alle chiamate." },
  documents: { id: "documenti-tecnici-ai", alt: "Tavole tecniche e documenti ordinati con una checklist: illustrazione generata con AI." },
  site: { id: "cantiere-digitale-ai", alt: "Tablet, disegni e dispositivi di protezione su un banco in cantiere: illustrazione AI." },
  consulting: { id: "consulenza-ai-edilizia", alt: "Mani di professionisti che organizzano un processo su tavole e schede: illustrazione AI." },
  windows: { id: "serramenti-showroom-ai", alt: "Campioni di finestre e materiali in uno showroom di serramenti illustrativo generato con AI." },
  solar: { id: "fotovoltaico-ai", alt: "Impianto fotovoltaico su un tetto e strumenti per il sopralluogo: illustrazione generata con AI." },
  estimates: { id: "computo-metrico-ai", alt: "Modello architettonico, tavole e riferimenti dimensionali per un computo: illustrazione AI." },
  render: { id: "render-ristrutturazioni-ai", alt: "Visualizzazione illustrativa di una ristrutturazione generata con intelligenza artificiale." },
} satisfies Record<string, SiteVisual>;

export const SERVICE_VISUALS: Record<string, SiteVisual> = {
  "automazione-ai": SITE_VISUALS.voice,
  "preventivazione-ai": SITE_VISUALS.estimates,
  "render-ai": SITE_VISUALS.render,
  "ai-per-progettisti": SITE_VISUALS.documents,
  "controllo-e-analisi": SITE_VISUALS.estimates,
  "gare-e-appalti-ai": SITE_VISUALS.documents,
  "sicurezza-e-conformita-ai": SITE_VISUALS.site,
  "cantiere-e-acquisti-ai": SITE_VISUALS.site,
  "marketing-e-vendite-ai": SITE_VISUALS.voice,
  "progettazione-sistemi-ai": SITE_VISUALS.consulting,
  "consulenza-ai": SITE_VISUALS.consulting,
  "formazione-e-affiancamento": SITE_VISUALS.consulting,
};

export const SECTOR_VISUALS: Record<string, SiteVisual> = {
  "artigiani-micro-imprese": SITE_VISUALS.site,
  "piccole-imprese": SITE_VISUALS.estimates,
  "medie-imprese": SITE_VISUALS.consulting,
  "grandi-aziende-general-contractor": SITE_VISUALS.documents,
  "serramentisti-infissi": SITE_VISUALS.windows,
  "installatori-fotovoltaico": SITE_VISUALS.solar,
  "imprese-ristrutturazione": SITE_VISUALS.render,
  "imprese-edili-generali": SITE_VISUALS.site,
  "posatori-pavimentisti": SITE_VISUALS.render,
  "lattonieri-coperture": SITE_VISUALS.site,
  "impianti-idraulici-termici": SITE_VISUALS.site,
  "impianti-elettrici": SITE_VISUALS.site,
  "cartongessisti-finiture": SITE_VISUALS.render,
  "progettisti-studi-tecnici": SITE_VISUALS.documents,
};

export const visualPath = (visual: SiteVisual, size?: 480 | 800 | 1440) =>
  `/visuals/20261123/${visual.id}${size ? `-${size}.webp` : ".jpg"}`;

export const visualSEO = (visual: SiteVisual) => ({
  ogImage: `https://edilizia.io${visualPath(visual)}`,
  ogImageAlt: visual.alt,
  ogImageWidth: 1440,
  ogImageHeight: 900,
});
