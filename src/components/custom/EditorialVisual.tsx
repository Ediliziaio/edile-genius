import { cn } from "@/lib/utils";
import { visualPath, type SiteVisual } from "@/data/siteVisuals";

interface Props {
  visual: SiteVisual;
  className?: string;
  sizes?: string;
  priority?: boolean;
  compact?: boolean;
}

/** An informative illustration, with responsive files and space reserved before it loads. */
export default function EditorialVisual({ visual, className, priority = false, compact = false, sizes = "(min-width: 1024px) 520px, calc(100vw - 48px)" }: Props) {
  return (
    <figure className={cn("min-w-0", className)}>
      <picture className="block overflow-hidden rounded-2xl bg-neutral-100">
        <source type="image/webp" srcSet={[480, 800, 1440].map((width) => `${visualPath(visual, width as 480 | 800 | 1440)} ${width}w`).join(", ")} sizes={sizes} />
        <img src={visualPath(visual)} alt={compact ? "" : visual.alt} width={1440} height={900}
          loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async"
          className="aspect-[8/5] w-full object-cover" />
      </picture>
      {!compact && <figcaption className="mt-2 text-xs leading-relaxed text-neutral-500">Illustrazione generata con AI.</figcaption>}
    </figure>
  );
}
