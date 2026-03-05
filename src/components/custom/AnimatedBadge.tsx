import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";

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

const AnimatedBadge = ({ children, variant = "verde", pulse = false }: AnimatedBadgeProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] font-semibold ${variantStyles[variant]}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {pulse && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
      {children}
    </motion.div>
  );
};

export default AnimatedBadge;
