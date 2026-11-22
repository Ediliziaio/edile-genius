import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqItem = { q: string; a: string };

interface FaqListProps {
  items: FaqItem[];
  /** Nome del gruppo: con lo stesso nome si apre una sola risposta alla volta. */
  group?: string;
  className?: string;
  itemClassName?: string;
  questionClassName?: string;
  answerClassName?: string;
  /** Livello del titolo della domanda (default h3). */
  as?: "h3" | "h4";
}

/**
 * FAQ con <details>/<summary> nativi: le risposte sono SEMPRE nell'HTML (anche chiuse),
 * quindi Google e gli answer engine le leggono e corrispondono allo schema FAQPage.
 * Funziona anche senza JavaScript ed è accessibile da tastiera.
 */
const FaqList = ({
  items,
  group = "faq",
  className,
  itemClassName,
  questionClassName,
  answerClassName,
  as: Heading = "h3",
}: FaqListProps) => (
  <div className={cn("space-y-3", className)}>
    {items.map((f) => (
      <details
        key={f.q}
        name={group}
        className={cn(
          "faq-item group rounded-xl border border-neutral-200 bg-background px-5 transition-colors open:border-primary/40 open:bg-primary/[0.03]",
          itemClassName,
        )}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
          <Heading className={cn("text-left text-base font-semibold text-neutral-900", questionClassName)}>{f.q}</Heading>
          <ChevronDown size={18} className="shrink-0 text-neutral-400 transition-transform duration-200 group-open:rotate-180 group-open:text-primary" />
        </summary>
        <div className={cn("faq-answer pb-5 text-[15px] leading-relaxed text-neutral-500", answerClassName)}>{f.a}</div>
      </details>
    ))}
  </div>
);

export default FaqList;
