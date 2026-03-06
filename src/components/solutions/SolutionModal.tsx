import { memo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Solution, settoreConfig, tipoAIConfig } from "@/data/solutions";

interface SolutionModalProps {
  solution: Solution | null;
  onClose: () => void;
}

const SolutionModal = memo(({ solution, onClose }: SolutionModalProps) => {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (solution) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [solution, handleEscape]);

  return (
    <AnimatePresence>
      {solution && (() => {
        const config = settoreConfig[solution.settore];
        const aiConfig = tipoAIConfig[solution.tipoAI];
        return (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />
            {/* Content */}
            <motion.div
              className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.25, 1, 0.35, 1] } }}
              exit={{ opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.2 } }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                aria-label="Chiudi"
              >
                <X size={20} />
              </button>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                  {config.emoji} {config.label}
                </span>
                <span className="font-mono text-[10px] bg-neutral-800 text-white px-2 py-1 rounded-full">
                  #{String(solution.id).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${aiConfig.color}15`, color: aiConfig.color }}>
                  {aiConfig.label}
                </span>
              </div>

              {/* Icon + Title */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-[40px] shrink-0"
                  style={{ backgroundColor: `${config.color}12` }}>
                  {solution.icon}
                </div>
                <h2 id="modal-title" className="font-display text-2xl md:text-[32px] font-extrabold text-neutral-900 leading-tight">
                  {solution.title}
                </h2>
              </div>

              {/* Full Description */}
              <p className="text-neutral-600 leading-relaxed mb-8 whitespace-pre-line">{solution.fullDescription}</p>

              {/* Come Funziona */}
              <div className="mb-8">
                <h3 className="font-display text-lg font-bold text-neutral-900 mb-4">Come Funziona</h3>
                <div className="space-y-4">
                  {solution.howItWorks.map((s, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0"
                        style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-display font-semibold text-neutral-900 text-sm">{s.step}</p>
                        <p className="text-neutral-500 text-sm">{s.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ROI Metrics */}
              <div className="mb-8">
                <h3 className="font-display text-lg font-bold text-neutral-900 mb-4">ROI Atteso</h3>
                <div className="grid grid-cols-3 gap-4">
                  {solution.roiMetrics.map((m, i) => (
                    <div key={i} className="text-center p-4 rounded-2xl" style={{ backgroundColor: config.colorBg }}>
                      <p className="font-display text-2xl font-extrabold" style={{ color: config.color }}>{m.value}</p>
                      <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider mt-1">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ideal For */}
              <div className="mb-8">
                <h3 className="font-display text-lg font-bold text-neutral-900 mb-3">Per chi è ideale</h3>
                <ul className="space-y-2">
                  {solution.idealFor.map((item, i) => (
                    <li key={i} className="flex gap-2 items-center text-sm text-neutral-600">
                      <span style={{ color: config.color }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Integrations */}
              <div className="mb-8">
                <h3 className="font-display text-lg font-bold text-neutral-900 mb-3">Si integra con</h3>
                <div className="flex flex-wrap gap-2">
                  {solution.integrations.map((integ, i) => (
                    <span key={i} className="bg-neutral-100 text-neutral-600 font-mono text-xs px-3 py-1.5 rounded-lg">
                      {integ}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <a
                href="#cta-soluzioni"
                onClick={onClose}
                className="block w-full bg-primary text-primary-foreground text-center py-4 rounded-xl font-display font-bold text-base hover:opacity-90 transition-opacity"
              >
                Prenota Demo per questa Soluzione →
              </a>
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
});

SolutionModal.displayName = "SolutionModal";
export default SolutionModal;
