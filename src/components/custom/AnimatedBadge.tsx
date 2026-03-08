import { motion, useInView } from "framer-motion";
import { useRef, forwardRef, ReactNode } from "react";

interface AnimatedBadgeProps {
  children: ReactNode;
  variant?: "verde" | "arancio" | "neutral" | "dark";
  pulse?: boolean;
}

const variantStyles = {
  verde: "bg-primary-light text-primary-dark border border-primary/30",
  arancio: "bg-[hsl(18_100%_95%)] text-accent-orange",
  neutral: "bg-neutral-100 text-neutral-700",
  dark: "bg-neutral-800 text-neutral-100",
};

const AnimatedBadge = forwardRef<HTMLDivElement, AnimatedBadgeProps>(
  ({ children, variant = "verde", pulse = false }, _ref) => {
    const internalRef = useRef(null);
    const isInView = useInView(internalRef, { once: true });

    return (
      <motion.div
        ref={internalRef}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] font-semibold ${variantStyles[variant]}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {pulse && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
        {children}
      </motion.div>
    );
  }
);

AnimatedBadge.displayName = "AnimatedBadge";

export default AnimatedBadge;
