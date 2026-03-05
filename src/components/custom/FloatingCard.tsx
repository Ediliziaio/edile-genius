import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FloatingCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

const FloatingCard = ({ children, delay = 0, className = "" }: FloatingCardProps) => {
  return (
    <motion.div
      className={`bg-background shadow-card rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-700 ${className}`}
      animate={{
        y: [0, -10, 0],
        rotate: [-1, 1, -1],
      }}
      transition={{
        y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay },
        rotate: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
      }}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
};

export default FloatingCard;
