import { Link } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import type { BlogPost } from "@/data/blogPosts";

interface BlogCardProps {
  post: BlogPost;
}

const categoryColors: Record<string, string> = {
  Vocale: "bg-primary/10 text-primary",
  Operativo: "bg-amber-500/10 text-amber-600",
  Guide: "bg-blue-500/10 text-blue-600",
};

const BlogCard = ({ post }: BlogCardProps) => (
  <Link
    to={`/blog/${post.slug}`}
    className="group block bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
  >
    <div className="aspect-video overflow-hidden bg-muted">
      <img
        src={post.heroImage}
        alt={post.heroImageAlt}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
    <div className="p-6 space-y-3">
      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${categoryColors[post.category] ?? "bg-muted text-muted-foreground"}`}>
        {post.category}
      </span>
      <h3 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
        {post.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1"><Calendar size={12} />{new Date(post.date).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}</span>
        <span className="flex items-center gap-1"><Clock size={12} />{post.readTime}</span>
      </div>
    </div>
  </Link>
);

export default BlogCard;
