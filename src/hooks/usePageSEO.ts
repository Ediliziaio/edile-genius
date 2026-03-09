import { useEffect } from "react";

interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
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

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function usePageSEO({ title, description, canonical, ogImage }: SEOConfig) {
  useEffect(() => {
    document.title = title;

    setMeta("description", description, true);

    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:url", canonical ? `${BASE_URL}${canonical}` : BASE_URL);
    setMeta("og:image", ogImage || DEFAULT_OG_IMAGE);

    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", ogImage || DEFAULT_OG_IMAGE);

    setCanonical(canonical ? `${BASE_URL}${canonical}` : BASE_URL);
  }, [title, description, canonical, ogImage]);
}
