import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Calendar, Clock, Tag } from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import BlogArticle from "@/components/blog/BlogArticle";
import BlogCTA from "@/components/blog/BlogCTA";
import SocialShareButtons from "@/components/blog/SocialShareButtons";
import ScrollProgress from "@/components/custom/ScrollProgress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { blogPosts } from "@/data/blogPosts";
import { usePageSEO } from "@/hooks/usePageSEO";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);

  usePageSEO({
    title: post ? `${post.title} | Edilizia.io` : "Articolo non trovato | Edilizia.io",
    description: post?.description ?? "",
    canonical: post ? `/blog/${post.slug}` : "/blog",
    ogImage: post?.heroImage,
    ogType: "article",
    articleMeta: post
      ? {
          publishedTime: post.date,
          modifiedTime: post.dateModified,
          tags: post.tags,
          section: post.category,
        }
      : undefined,
  });

  // Inject Article + Breadcrumb JSON-LD
  useEffect(() => {
    if (!post) return;

    const wordCount = post.sections.reduce(
      (acc, s) => acc + s.content.split(/\s+/).length + (s.callout?.split(/\s+/).length || 0),
      0
    );

    const articleJsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      image: post.heroImage,
      datePublished: post.date,
      dateModified: post.dateModified || post.date,
      wordCount,
      articleSection: post.category,
      author: { "@type": "Organization", name: "Edilizia.io" },
      publisher: {
        "@type": "Organization",
        name: "Edilizia.io",
        url: "https://edilizia.io",
      },
      mainEntityOfPage: `https://edilizia.io/blog/${post.slug}`,
    };

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://edilizia.io" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://edilizia.io/blog" },
        { "@type": "ListItem", position: 3, name: post.title, item: `https://edilizia.io/blog/${post.slug}` },
      ],
    };

    const inject = (id: string, data: object) => {
      let script = document.querySelector(`script[data-jsonld="${id}"]`) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-jsonld", id);
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(data);
      return script;
    };

    const s1 = inject("article", articleJsonLd);
    const s2 = inject("breadcrumb", breadcrumbJsonLd);

    let s3: HTMLScriptElement | null = null;
    if (post.faqs && post.faqs.length > 0) {
      const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      };
      s3 = inject("faqpage", faqJsonLd);
    }

    return () => {
      s1?.remove();
      s2?.remove();
      s3?.remove();
    };
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  const shareUrl = `https://edilizia.io/blog/${post.slug}`;
  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ScrollProgress />

      <article className="max-w-4xl mx-auto px-6 pt-12 pb-20">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/blog">Blog</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1 max-w-[300px]">{post.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Meta */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(post.date).toLocaleDateString("it-IT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {post.readTime} di lettura
            </span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]">
              {post.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-muted-foreground">{post.description}</p>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-2.5 py-1 rounded-full text-xs font-medium"
              >
                <Tag size={10} />
                {t}
              </span>
            ))}
          </div>
          <SocialShareButtons url={shareUrl} title={post.title} />
        </div>

        {/* Hero Image */}
        <img
          src={post.heroImage}
          alt={post.heroImageAlt}
          className="w-full rounded-2xl mb-10 aspect-video object-cover"
        />

        {/* Table of Contents */}
        {post.sections.length > 2 && (
          <nav className="bg-muted/50 border border-border rounded-xl p-5 mb-10" aria-label="Indice contenuti">
            <h2 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Indice</h2>
            <ol className="space-y-1.5">
              {post.sections.map((s, i) => (
                <li key={i}>
                  <a
                    href={`#section-${i}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {i + 1}. {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Content */}
        <BlogArticle sections={post.sections} />

        {/* FAQ Section */}
        {post.faqs && post.faqs.length > 0 && (
          <section className="mt-16 mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">Domande Frequenti</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {post.faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-5 data-[state=open]:border-primary/30 data-[state=open]:bg-primary/5 transition-colors">
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* Bottom Social Share */}
        <div className="flex justify-center py-8 border-t border-border mt-12">
          <SocialShareButtons url={shareUrl} title={post.title} />
        </div>

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
                  className="group block rounded-xl border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <img
                    src={r.heroImage}
                    alt={r.heroImageAlt}
                    loading="lazy"
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {r.category}
                    </span>
                    <h4 className="text-sm font-bold text-foreground mt-1 group-hover:text-primary transition-colors line-clamp-2">
                      {r.title}
                    </h4>
                    <span className="text-xs text-muted-foreground mt-2 block">{r.readTime}</span>
                  </div>
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
