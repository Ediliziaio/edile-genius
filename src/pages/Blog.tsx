import { useState, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import BlogCard from "@/components/blog/BlogCard";
import { blogPosts, blogCategories } from "@/data/blogPosts";
import { usePageSEO } from "@/hooks/usePageSEO";

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState<string>("Tutti");
  const [searchQuery, setSearchQuery] = useState("");

  usePageSEO({
    title: "Blog — AI e Innovazione nell'Edilizia | Edilizia.io",
    description: "Articoli, guide e casi studio sull'intelligenza artificiale applicata al settore edile italiano. Scopri come l'AI trasforma serramenti, fotovoltaico e ristrutturazioni.",
    canonical: "/blog",
  });

  // CollectionPage JSON-LD
  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Blog — AI e Innovazione nell'Edilizia",
      description: "Articoli, guide e casi studio sull'intelligenza artificiale applicata al settore edile italiano.",
      url: "https://edilizia.io/blog",
      publisher: { "@type": "Organization", name: "Edilizia.io", url: "https://edilizia.io" },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: blogPosts.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `https://edilizia.io/blog/${p.slug}`,
          name: p.title,
        })),
      },
    };
    let script = document.querySelector('script[data-jsonld="collection"]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-jsonld", "collection");
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
    return () => { script?.remove(); };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return blogPosts.filter((p) => {
      // Category filter
      if (activeCategory !== "Tutti" && p.category !== activeCategory) return false;
      // Search filter
      if (!q) return true;
      const haystack = [
        p.title,
        p.description,
        ...(p.tags ?? []),
        ...(p.sections?.map((s) => `${s.heading} ${s.content}`) ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="inline-block font-mono text-xs uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
            Blog
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground leading-tight">
            AI e Innovazione<br className="hidden md:block" /> nell'Edilizia
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Guide pratiche, casi studio e strategie per portare l'intelligenza artificiale nella tua impresa edile.
          </p>
        </div>
      </section>

      {/* Search */}
      <div className="max-w-lg mx-auto px-6 pb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca articoli…"
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cancella ricerca"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {blogCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        {searchQuery && (
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {filtered.length} risultat{filtered.length === 1 ? "o" : "i"} per "<span className="font-medium text-foreground">{searchQuery}</span>"
          </p>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((post) => (
            <BlogCard key={post.slug} post={post} searchQuery={searchQuery} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            {searchQuery
              ? `Nessun risultato per "${searchQuery}". Prova con un altro termine.`
              : "Nessun articolo in questa categoria."}
          </p>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
