import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const StickyMobileCTA = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-background/80 backdrop-blur-md border-t border-border md:hidden"
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <a
            href="#cta-finale"
            className="block w-full bg-primary text-primary-foreground text-center py-3.5 rounded-xl font-bold text-sm shadow-button-green hover:bg-primary-dark transition-all"
          >
            Prenota Demo Gratuita →
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyMobileCTA;
