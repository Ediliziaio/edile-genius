import { useEffect } from "react";

interface ArticleMeta {
  publishedTime: string;
  modifiedTime?: string;
  tags?: string[];
  section?: string;
}

interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  articleMeta?: ArticleMeta;
}

const BASE_URL = "https://edilizia.io";
const DEFAULT_OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d4b67fae-6627-4500-892d-9d5bc6f9b445/id-preview-fa441762--7f87ea12-526b-43c3-a18c-a15621a5a582.lovable.app-1772781591174.png";

function setMeta(property: string, content: string, isName = false) {
  const attr = isName ? "name" : "property";
  let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMeta(property: string, isName = false) {
  const attr = isName ? "name" : "property";
  document.querySelector(`meta[${attr}="${property}"]`)?.remove();
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function usePageSEO({ title, description, canonical, ogImage, ogType, articleMeta }: SEOConfig) {
  useEffect(() => {
    document.title = title;

    setMeta("description", description, true);

    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:url", canonical ? `${BASE_URL}${canonical}` : BASE_URL);
    setMeta("og:image", ogImage || DEFAULT_OG_IMAGE);
    setMeta("og:type", ogType || "website");

    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", ogImage || DEFAULT_OG_IMAGE);

    if (articleMeta) {
      setMeta("article:published_time", articleMeta.publishedTime);
      if (articleMeta.modifiedTime) setMeta("article:modified_time", articleMeta.modifiedTime);
      if (articleMeta.section) setMeta("article:section", articleMeta.section);
      articleMeta.tags?.forEach((tag, i) => setMeta(`article:tag:${i}`, tag));
    }

    setCanonical(canonical ? `${BASE_URL}${canonical}` : BASE_URL);

    return () => {
      // Cleanup article-specific metas
      if (articleMeta) {
        removeMeta("article:published_time");
        removeMeta("article:modified_time");
        removeMeta("article:section");
        articleMeta.tags?.forEach((_, i) => removeMeta(`article:tag:${i}`));
      }
    };
  }, [title, description, canonical, ogImage, ogType, articleMeta]);
}
