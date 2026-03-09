import type { BlogSection } from "@/data/blogPosts";
import { TrendingUp, Lightbulb } from "lucide-react";

interface BlogArticleProps {
  sections: BlogSection[];
}

const StatsGrid = ({ stats }: { stats: { label: string; value: string }[] }) => (
  <div className="grid grid-cols-2 gap-4 my-6">
    {stats.map((s, i) => (
      <div
        key={i}
        className="bg-primary/5 border border-primary/10 rounded-xl p-5 text-center"
      >
        <div className="text-2xl md:text-3xl font-extrabold text-primary mb-1">{s.value}</div>
        <div className="text-xs md:text-sm text-muted-foreground font-medium">{s.label}</div>
      </div>
    ))}
  </div>
);

const CalloutBox = ({ text }: { text: string }) => (
  <div className="my-6 border-l-4 border-primary bg-primary/5 rounded-r-xl p-5 flex gap-3 items-start">
    <Lightbulb className="text-primary shrink-0 mt-0.5" size={20} />
    <p className="text-sm text-foreground leading-relaxed">{text}</p>
  </div>
);

const RenderParagraph = ({ html }: { html: string }) => (
  <p
    className="text-muted-foreground leading-relaxed mb-4 text-[15px]"
    dangerouslySetInnerHTML={{
      __html: html
        .replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground font-semibold'>$1</strong>")
        .replace(/\n/g, "<br/>"),
    }}
  />
);

const BlogArticle = ({ sections }: BlogArticleProps) => (
  <div className="space-y-10">
    {sections.map((s, i) => (
      <section key={i} id={`section-${i}`}>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">{s.heading}</h2>

        {/* Section image */}
        {s.image && (
          <img
            src={s.image}
            alt={s.imageAlt || s.heading}
            loading="lazy"
            className="w-full rounded-xl mb-6 aspect-video object-cover"
          />
        )}

        {/* Content paragraphs */}
        <div className="prose prose-neutral max-w-none">
          {s.content.split("\n\n").map((p, j) => (
            <RenderParagraph key={j} html={p} />
          ))}
        </div>

        {/* Stats grid */}
        {s.stats && s.stats.length > 0 && <StatsGrid stats={s.stats} />}

        {/* Callout box */}
        {s.callout && <CalloutBox text={s.callout} />}
      </section>
    ))}
  </div>
);

export default BlogArticle;
