import { Link } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import type { BlogPost } from "@/data/blogPosts";
import type { ReactNode } from "react";
import BlogCover from "./BlogCover";

interface BlogCardProps {
  post: BlogPost;
  searchQuery?: string;
}

const highlightText = (text: string, query: string): ReactNode => {
  if (!query?.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">{part}</mark>
    ) : part
  );
};

const categoryColors: Record<string, string> = {
  Vocale: "bg-primary/10 text-primary",
  Operativo: "bg-amber-500/10 text-amber-600",
  Guide: "bg-blue-500/10 text-blue-600",
};

const BlogCard = ({ post, searchQuery = "" }: BlogCardProps) => (
  <Link
    to={`/blog/${post.slug}`}
    className="group block bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
  >
    <div className="aspect-video overflow-hidden bg-muted">
      <BlogCover post={post} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500" sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, calc(100vw - 48px)" />
    </div>
    <div className="p-6 space-y-3">
      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${categoryColors[post.category] ?? "bg-muted text-muted-foreground"}`}>
        {post.category}
      </span>
      <h3 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
        {highlightText(post.title, searchQuery)}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{highlightText(post.description, searchQuery)}</p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1"><Calendar size={12} />{post.dateModified && post.dateModified !== post.date ? "Aggiornato " : ""}<time dateTime={post.dateModified || post.date}>{new Date(post.dateModified || post.date).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}</time></span>
        <span className="flex items-center gap-1"><Clock size={12} />{post.readTime}</span>
      </div>
    </div>
  </Link>
);

export default BlogCard;
