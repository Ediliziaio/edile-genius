import { useState } from "react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import BlogCard from "@/components/blog/BlogCard";
import { blogPosts, blogCategories } from "@/data/blogPosts";
import { usePageSEO } from "@/hooks/usePageSEO";

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState<string>("Tutti");

  usePageSEO({
    title: "Blog — AI e Innovazione nell'Edilizia | Edilizia.io",
    description: "Articoli, guide e casi studio sull'intelligenza artificiale applicata al settore edile italiano. Scopri come l'AI trasforma serramenti, fotovoltaico e ristrutturazioni.",
    canonical: "/blog",
  });

  const filtered = activeCategory === "Tutti"
    ? blogPosts
    : blogPosts.filter((p) => p.category === activeCategory);

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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Nessun articolo in questa categoria.</p>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
