import { useParams, Link, Navigate } from "react-router-dom";
import { Calendar, Clock, Tag } from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import BlogArticle from "@/components/blog/BlogArticle";
import BlogCTA from "@/components/blog/BlogCTA";
import RelatedServices from "@/components/custom/RelatedServices";
import SocialShareButtons from "@/components/blog/SocialShareButtons";
import ScrollProgress from "@/components/custom/ScrollProgress";
import FaqList from "@/components/custom/FaqList";
import { blogPosts } from "@/data/blogPosts";
import { usePageSEO } from "@/hooks/usePageSEO";
import { BLOG_SEO } from "@/data/blogSeo";
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

  // Article + Breadcrumb (+ FAQ) JSON-LD, renderizzato nell'HTML statico via SEOHead.
  const jsonLd = post
    ? ((): Record<string, unknown>[] => {
        const wordCount = post.sections.reduce(
          (acc, s) => acc + s.content.split(/\s+/).length + (s.callout?.split(/\s+/).length || 0),
          0,
        );
        const graph: Record<string, unknown>[] = [
          {
            "@type": "Article",
            headline: post.title,
            description: post.description,
            abstract: post.summary || post.description,
            image: post.heroImage,
            datePublished: post.date,
            dateModified: post.dateModified || post.date,
            wordCount,
            articleSection: post.category,
            keywords: post.tags.join(", "),
            inLanguage: "it-IT",
            author: {
              "@type": "Person",
              name: "Florin Andriciuc",
              jobTitle: "Founder & CEO",
              worksFor: { "@type": "Organization", name: "AEDIX" },
              url: "https://edilizia.io/chi-siamo",
            },
            publisher: {
              "@type": "Organization",
              name: "Edilizia.io",
              url: "https://edilizia.io",
              logo: { "@type": "ImageObject", url: "https://edilizia.io/favicon.png" },
            },
            mainEntityOfPage: `https://edilizia.io/blog/${post.slug}`,
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://edilizia.io" },
              { "@type": "ListItem", position: 2, name: "Blog", item: "https://edilizia.io/blog" },
              { "@type": "ListItem", position: 3, name: post.title, item: `https://edilizia.io/blog/${post.slug}` },
            ],
          },
        ];
        if (post.faqs && post.faqs.length > 0) {
          graph.push({
            "@type": "FAQPage",
            mainEntity: post.faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          });
        }
        return graph;
      })()
    : undefined;

  const seoTags = usePageSEO({
    title: post ? (BLOG_SEO[post.slug]?.title ?? `${post.title} | Edilizia.io`) : "Articolo non trovato | Edilizia.io",
    description: post ? (BLOG_SEO[post.slug]?.description ?? post.description) : "",
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
    jsonLd,
  });

  if (!post) return <Navigate to="/blog" replace />;

  const shareUrl = `https://edilizia.io/blog/${post.slug}`;
  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {seoTags}
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
            <span className="flex items-center gap-1">
              Di <span className="font-semibold text-foreground">Florin Andriciuc</span>, Founder AEDIX
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

        {/* In sintesi — answer block estraibile dagli AI (AEO) */}
        {post.summary && (
          <div className="mb-8 rounded-2xl border-l-4 border-primary bg-primary/5 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">In sintesi</h2>
            <p className="text-[17px] leading-relaxed text-foreground">{post.summary}</p>
          </div>
        )}

        {/* Punti chiave — featured-snippet / AEO */}
        {post.keyTakeaways && post.keyTakeaways.length > 0 && (
          <div className="mb-10 rounded-2xl border border-border bg-muted/40 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">Punti chiave</h2>
            <ul className="space-y-2">
              {post.keyTakeaways.map((k, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
                  <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
            <FaqList items={post.faqs.map((f) => ({ q: f.question, a: f.answer }))} group="faq-articolo" />
          </section>
        )}

        {/* Bottom Social Share */}
        <div className="flex justify-center py-8 border-t border-border mt-12">
          <SocialShareButtons url={shareUrl} title={post.title} />
        </div>

        {/* CTA */}
        <RelatedServices pageKey={post.slug} title="Approfondisci i servizi collegati" className="py-10" />
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
