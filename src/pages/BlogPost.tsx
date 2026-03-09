import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import BlogArticle from "@/components/blog/BlogArticle";
import BlogCTA from "@/components/blog/BlogCTA";
import { blogPosts } from "@/data/blogPosts";
import { usePageSEO } from "@/hooks/usePageSEO";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);

  usePageSEO({
    title: post ? `${post.title} | Edilizia.io` : "Articolo non trovato | Edilizia.io",
    description: post?.description ?? "",
    canonical: post ? `/blog/${post.slug}` : "/blog",
  });

  // Inject Article JSON-LD
  useEffect(() => {
    if (!post) return;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      author: { "@type": "Organization", name: "Edilizia.io" },
      publisher: {
        "@type": "Organization",
        name: "Edilizia.io",
        url: "https://edilizia.io",
      },
      mainEntityOfPage: `https://edilizia.io/blog/${post.slug}`,
    };
    let script = document.querySelector('script[data-blog-jsonld]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-blog-jsonld", "true");
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
    return () => { script?.remove(); };
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <article className="max-w-4xl mx-auto px-6 pt-12 pb-20">
        {/* Back */}
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft size={14} /> Torna al blog
        </Link>

        {/* Meta */}
        <div className="space-y-4 mb-10">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar size={12} />{new Date(post.date).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span className="flex items-center gap-1"><Clock size={12} />{post.readTime} di lettura</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]">{post.category}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-muted-foreground">{post.description}</p>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-2.5 py-1 rounded-full text-xs font-medium">
                <Tag size={10} />{t}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <BlogArticle sections={post.sections} />

        {/* CTA */}
        <BlogCTA />

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-20">
            <h3 className="text-xl font-bold text-foreground mb-6">Articoli correlati</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/blog/${r.slug}`}
                  className="group block rounded-xl border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{r.category}</span>
                  <h4 className="text-sm font-bold text-foreground mt-1 group-hover:text-primary transition-colors line-clamp-2">
                    {r.title}
                  </h4>
                  <span className="text-xs text-muted-foreground mt-2 block">{r.readTime}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
