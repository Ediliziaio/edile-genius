import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, animate } from "framer-motion";

interface CounterStatProps {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  duration?: number;
  className?: string;
}

const CounterStat = ({ value, prefix = "", suffix = "", label, duration = 2, className = "" }: CounterStatProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);
  const count = useMotionValue(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration,
        ease: "easeOut",
        onUpdate: (v) => setDisplay(Math.round(v)),
      });
      return controls.stop;
    }
  }, [isInView, value, duration, count]);

  return (
    <div ref={ref} className={`text-center ${className}`}>
      <div className="text-5xl md:text-6xl font-extrabold text-primary font-display">
        {prefix}{display}{suffix}
      </div>
      <div className="font-mono text-xs text-neutral-500 uppercase tracking-wider mt-2">
        {label}
      </div>
    </div>
  );
};

export default CounterStat;
