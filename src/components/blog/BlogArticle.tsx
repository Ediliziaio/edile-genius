import type { BlogSection } from "@/data/blogPosts";

interface BlogArticleProps {
  sections: BlogSection[];
}

const BlogArticle = ({ sections }: BlogArticleProps) => (
  <div className="space-y-10">
    {sections.map((s, i) => (
      <section key={i}>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">{s.heading}</h2>
        <div className="prose prose-neutral max-w-none">
          {s.content.split("\n\n").map((p, j) => (
            <p
              key={j}
              className="text-muted-foreground leading-relaxed mb-4 text-[15px]"
              dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground font-semibold'>$1</strong>").replace(/\n/g, "<br/>") }}
            />
          ))}
        </div>
      </section>
    ))}
  </div>
);

export default BlogArticle;
