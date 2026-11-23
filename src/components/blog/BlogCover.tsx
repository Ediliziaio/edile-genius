import type { BlogPost } from "@/data/blogPosts";
import { visualPath } from "@/data/siteVisuals";

interface Props {
  post: BlogPost;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export default function BlogCover({ post, className, sizes = "(min-width: 1024px) 800px, calc(100vw - 48px)", priority = false }: Props) {
  const visual = post.heroVisual;
  return <picture className="block">
    {visual && <source type="image/webp" sizes={sizes} srcSet={[480, 800, 1440].map((width) => `${visualPath(visual, width as 480 | 800 | 1440)} ${width}w`).join(", ")} />}
    <img src={post.heroImage} alt={post.heroImageAlt} width={post.heroVisual ? 1440 : undefined} height={post.heroVisual ? 900 : undefined}
      loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" className={className} />
  </picture>;
}
