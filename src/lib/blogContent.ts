import type { BlogPost, BlogSection } from "@/data/blogPosts";

export function markdownSections(markdown: string): BlogSection[] {
  return markdown.trim().split(/^## /m).filter(Boolean).map((part) => {
    const newline = part.indexOf("\n");
    return { heading: part.slice(0, newline).trim(), content: part.slice(newline + 1).trim() };
  });
}

export function articleWordCount(sections: BlogSection[]): number {
  return sections.map((section) => `${section.content} ${section.callout || ""}`)
    .join(" ").replace(/<[^>]*>/g, " ").replace(/\*\*/g, "").split(/\s+/).filter(Boolean).length;
}

const generalTerms = new Set(["edilizia", "edili", "edile", "imprese", "impresa", "gestione", "intelligenza", "artificiale", "come", "delle", "della", "dello", "degli", "tutti"]);
const terms = (post: BlogPost) => new Set(post.tags.join(" ").toLocaleLowerCase("it").normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter((word) => word.length > 3 && !generalTerms.has(word)));

/** Rank by subject and connected services; stable source order resolves equal scores. */
export function relatedBlogPosts(current: BlogPost, posts: BlogPost[], serviceMap: Record<string, string[]>, limit = 3): BlogPost[] {
  const currentTerms = terms(current);
  const currentServices = new Set(serviceMap[current.slug] || []);
  const ranked = posts.filter((post) => post.slug !== current.slug).map((post, index) => ({
    post, index,
    score: [...terms(post)].filter((term) => currentTerms.has(term)).length * 3
      + (serviceMap[post.slug] || []).filter((service) => currentServices.has(service)).length * 4
      + (current.category === post.category ? 1 : 0),
  })).sort((a, b) => b.score - a.score || a.index - b.index).map(({ post }) => post);
  const preferred = [...new Set(current.relatedSlugs || [])]
    .map((slug) => posts.find((post) => post.slug === slug && post.slug !== current.slug))
    .filter((post): post is BlogPost => Boolean(post));
  return [...preferred, ...ranked.filter((post) => !preferred.some((item) => item.slug === post.slug))].slice(0, limit);
}
