import { useEffect } from "react";
import { Head } from "vite-react-ssg";

interface ArticleMeta {
  publishedTime: string;
  modifiedTime?: string;
  tags?: string[];
  section?: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  articleMeta?: ArticleMeta;
  /** Pagine che non devono essere indicizzate (es. landing offerta). */
  noindex?: boolean;
  /** JSON-LD structured data (oggetto singolo o array → @graph). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const BASE_URL = "https://edilizia.io";
const DEFAULT_OG_IMAGE = "https://edilizia.io/og-image.png";
const OG_IMAGE_ALT = "Edilizia.io — AI per il Settore Edile";

/* ── Aggiornamento imperativo del <head> lato client ──
   Il componente <Head> (react-helmet) alimenta l'HTML statico durante il
   prerender (SSG), ma non riconcilia in modo affidabile su navigazione SPA
   e sulle rotte non prerenderizzate (offerte). Questo effetto garantisce che
   title/description/canonical/robots/OG siano sempre corretti nel browser. */
function setMetaAttr(selector: string, create: () => HTMLElement, content: string) {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
function metaByName(name: string) {
  return () => {
    const m = document.createElement("meta");
    m.setAttribute("name", name);
    return m;
  };
}
function metaByProp(prop: string) {
  return () => {
    const m = document.createElement("meta");
    m.setAttribute("property", prop);
    return m;
  };
}

/**
 * Head per-pagina gestito da react-helmet-async (via vite-react-ssg).
 * A differenza della vecchia versione basata su useEffect, questi tag vengono
 * renderizzati nell'HTML statico durante il prerender (SSG): così SEO, social
 * crawler e crawler AI (che non eseguono JS) leggono title/description/canonical/
 * OG e JSON-LD unici per ogni rotta.
 */
export function SEOHead({
  title,
  description,
  canonical,
  ogImage,
  ogType,
  articleMeta,
  noindex = false,
  jsonLd,
}: SEOConfig) {
  const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  const image = ogImage || DEFAULT_OG_IMAGE;
  const jsonLdString = jsonLd
    ? JSON.stringify(
        Array.isArray(jsonLd)
          ? { "@context": "https://schema.org", "@graph": jsonLd }
          : { "@context": "https://schema.org", ...jsonLd },
      )
    : null;

  // Client-side: garantisce head corretto su navigazione SPA e rotte non SSG.
  useEffect(() => {
    document.title = title;
    const robots = noindex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
    setMetaAttr('meta[name="description"]', metaByName("description"), description);
    setMetaAttr('meta[name="robots"]', metaByName("robots"), robots);
    setMetaAttr('meta[property="og:title"]', metaByProp("og:title"), title);
    setMetaAttr('meta[property="og:description"]', metaByProp("og:description"), description);
    setMetaAttr('meta[property="og:url"]', metaByProp("og:url"), url);
    setMetaAttr('meta[property="og:image"]', metaByProp("og:image"), image);
    setMetaAttr('meta[property="og:type"]', metaByProp("og:type"), ogType || "website");
    setMetaAttr('meta[name="twitter:title"]', metaByName("twitter:title"), title);
    setMetaAttr('meta[name="twitter:description"]', metaByName("twitter:description"), description);
    setMetaAttr('meta[name="twitter:image"]', metaByName("twitter:image"), image);
    setMetaAttr('meta[name="twitter:card"]', metaByName("twitter:card"), "summary_large_image");
    setMetaAttr('meta[property="og:site_name"]', metaByProp("og:site_name"), "Edilizia.io");
    setMetaAttr('meta[property="og:locale"]', metaByProp("og:locale"), "it_IT");
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
  }, [title, description, url, image, ogType, noindex]);

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="robots"
        content={
          noindex
            ? "noindex, nofollow"
            : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        }
      />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType || "website"} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Edilizia.io" />
      <meta property="og:locale" content="it_IT" />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={OG_IMAGE_ALT} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Article */}
      {articleMeta && (
        <meta property="article:published_time" content={articleMeta.publishedTime} />
      )}
      {articleMeta?.modifiedTime && (
        <meta property="article:modified_time" content={articleMeta.modifiedTime} />
      )}
      {articleMeta?.section && (
        <meta property="article:section" content={articleMeta.section} />
      )}
      {articleMeta?.tags?.map((tag, i) => (
        <meta key={i} property="article:tag" content={tag} />
      ))}

      {jsonLdString && (
        <script type="application/ld+json">{jsonLdString}</script>
      )}
    </Head>
  );
}

/**
 * Backward-compat: restituisce l'elemento <SEOHead/> da renderizzare nella
 * pagina. Uso: `return (<>{usePageSEO({ title, description, canonical })}<Page/></>)`.
 */
export function usePageSEO(config: SEOConfig) {
  return <SEOHead {...config} />;
}
