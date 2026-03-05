import { motion, useScroll, useSpring } from "framer-motion";

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-[112px] left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-primary-light origin-left z-[100]"
      style={{ scaleX }}
    />
  );
};

export default ScrollProgress;
