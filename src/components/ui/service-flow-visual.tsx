import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Diagramma animato della pagina servizio: cosa entra (a sinistra), il nucleo AI al centro,
 * cosa esce (a destra). I "pacchetti" scorrono lungo le linee con animateMotion (SVG nativo,
 * funziona anche nel prerender). Colori del brand.
 */

type Flusso = { in: [string, string, string]; out: [string, string, string]; core: string };

const FLUSSI: Record<string, Flusso> = {
  "automazione-ai": { in: ["Telefono", "WhatsApp", "Email"], out: ["Appuntamenti", "Rapportini", "Pratiche"], core: "Agenti AI" },
  "preventivazione-ai": { in: ["Nota vocale", "Foto", "Listini"], out: ["Preventivo PDF", "Computo", "Confronto offerte"], core: "Preventivi AI" },
  "render-ai": { in: ["Foto", "Materiali", "Colori"], out: ["Render", "Prima / dopo", "PDF al cliente"], core: "Render AI" },
  "ai-per-progettisti": { in: ["Capitolati", "Tavole e BIM", "Note vocali"], out: ["Sintesi", "Bozze relazioni", "Computi"], core: "AI tecnica" },
  "controllo-e-analisi": { in: ["Costi", "Fatture", "Avanzamento"], out: ["Margini", "Avvisi", "Report"], core: "Analisi AI" },
  "gare-e-appalti-ai": { in: ["Bandi", "Disciplinari", "Referenze"], out: ["Partecipo / no", "Checklist", "Bozza offerta"], core: "AI gare" },
  "sicurezza-e-conformita-ai": { in: ["DURC", "Attestati", "Foto cantiere"], out: ["Scadenze", "Bozze POS", "Solleciti"], core: "AI sicurezza" },
  "cantiere-e-acquisti-ai": { in: ["Cronoprogramma", "Foto cantiere", "DDT"], out: ["Ritardi previsti", "Ordini", "Magazzino"], core: "AI cantiere" },
  "marketing-e-vendite-ai": { in: ["Lavori fatti", "Recensioni", "Contatti"], out: ["Contenuti", "Risposte", "Follow-up"], core: "Marketing AI" },
  "progettazione-sistemi-ai": { in: ["Processi", "Dati", "Strumenti"], out: ["Agenti", "Automazioni", "Integrazioni"], core: "Su misura" },
  "consulenza-ai": { in: ["Processi", "Costi", "Obiettivi"], out: ["Priorità", "Roadmap", "Ritorno atteso"], core: "Analisi" },
  "formazione-e-affiancamento": { in: ["Ufficio", "Tecnici", "Cantiere"], out: ["Guide", "Abitudini", "Risultati"], core: "Formazione" },
};

const W = 560;
const H = 380;
const CX = W / 2;
const CY = H / 2;
const ROWS = [78, 190, 302];
const NODE_W = 132;
const NODE_H = 44;

const pathIn = (y: number) => `M${24 + NODE_W},${y} C${CX - 70},${y} ${CX - 110},${CY} ${CX - 52},${CY}`;
const pathOut = (y: number) => `M${CX + 52},${CY} C${CX + 110},${CY} ${CX + 70},${y} ${W - 24 - NODE_W},${y}`;

const Node = ({ x, y, label, side, delay }: { x: number; y: number; label: string; side: "in" | "out"; delay: number }) => (
  <motion.g initial={{ opacity: 0, x: side === "in" ? -16 : 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay }}>
    <rect x={x} y={y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={12} fill="#fff" stroke={side === "in" ? "#dde3de" : "#3BCE78"} strokeWidth={side === "in" ? 1 : 1.4} />
    <circle cx={side === "in" ? x + 18 : x + NODE_W - 18} cy={y} r={4.5} fill={side === "in" ? "#9ca3af" : "#3BCE78"} />
    <text
      x={side === "in" ? x + 32 : x + NODE_W - 32}
      y={y + 4.5}
      textAnchor={side === "in" ? "start" : "end"}
      fontSize={13}
      fontWeight={600}
      fill="#111827"
      fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
    >
      {label}
    </text>
  </motion.g>
);

const ServiceFlowVisual = ({ slug, className = "" }: { slug: string; className?: string }) => {
  const f = FLUSSI[slug];
  const reduce = useReducedMotion() ?? false;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!f) return null;

  return (
    <div className={`relative ${className}`} aria-hidden>
      <div className="pointer-events-none absolute inset-[10%] rounded-full bg-primary/15 blur-3xl" />
      <svg viewBox={`0 0 ${W} ${H}`} className="relative w-full h-auto overflow-visible">
        <defs>
          <radialGradient id={`${uid}core`} cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#6EDC9C" />
            <stop offset="1" stopColor="#1A9E60" />
          </radialGradient>
          <linearGradient id={`${uid}line`} x1="0" x2="1">
            <stop offset="0" stopColor="#cdd4cf" />
            <stop offset="1" stopColor="#3BCE78" />
          </linearGradient>
        </defs>

        {/* linee */}
        {ROWS.map((y) => (
          <path key={`i${y}`} d={pathIn(y)} fill="none" stroke={`url(#${uid}line)`} strokeWidth={1.6} strokeDasharray="4 5" />
        ))}
        {ROWS.map((y) => (
          <path key={`o${y}`} d={pathOut(y)} fill="none" stroke="#3BCE78" strokeOpacity={0.55} strokeWidth={1.6} />
        ))}

        {/* pacchetti in movimento */}
        {!reduce &&
          ROWS.map((y, i) => (
            <circle key={`pi${y}`} r={4} fill="#9ca3af">
              <animateMotion dur="2.4s" begin={`${i * 0.5}s`} repeatCount="indefinite" path={pathIn(y)} />
            </circle>
          ))}
        {!reduce &&
          ROWS.map((y, i) => (
            <circle key={`po${y}`} r={4.5} fill="#1A9E60">
              <animateMotion dur="2.4s" begin={`${1.2 + i * 0.5}s`} repeatCount="indefinite" path={pathOut(y)} />
            </circle>
          ))}

        {/* nodi */}
        {f.in.map((l, i) => (
          <Node key={l} x={24} y={ROWS[i]} label={l} side="in" delay={0.2 + i * 0.1} />
        ))}
        {f.out.map((l, i) => (
          <Node key={l} x={W - 24 - NODE_W} y={ROWS[i]} label={l} side="out" delay={0.6 + i * 0.1} />
        ))}

        {/* nucleo AI */}
        <motion.g initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, delay: 0.35 }} style={{ transformOrigin: `${CX}px ${CY}px` }}>
          <circle cx={CX} cy={CY} r={78} fill="#3BCE78" opacity={0.08} />
          <circle cx={CX} cy={CY} r={66} fill="none" stroke="#3BCE78" strokeOpacity={0.5} strokeWidth={1.2} strokeDasharray="3 7">
            {!reduce && <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="18s" repeatCount="indefinite" />}
          </circle>
          <circle cx={CX} cy={CY} r={52} fill={`url(#${uid}core)`} />
          {!reduce && (
            <circle cx={CX} cy={CY} r={52} fill="none" stroke="#3BCE78" strokeWidth={2}>
              <animate attributeName="r" values="52;74" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="2.4s" repeatCount="indefinite" />
            </circle>
          )}
          <text x={CX} y={CY - 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#ffffff" opacity={0.85} letterSpacing={1.5} fontFamily="'JetBrains Mono', monospace">
            AI
          </text>
          <text x={CX} y={CY + 14} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="#ffffff" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif">
            {f.core}
          </text>
        </motion.g>

        {/* etichette di colonna */}
        <text x={24} y={26} fontSize={10.5} fill="#9ca3af" letterSpacing={1.6} fontFamily="'JetBrains Mono', monospace">
          COSA ENTRA
        </text>
        <text x={W - 24} y={26} textAnchor="end" fontSize={10.5} fill="#1A9E60" letterSpacing={1.6} fontFamily="'JetBrains Mono', monospace">
          COSA ESCE
        </text>
      </svg>
    </div>
  );
};

export default ServiceFlowVisual;
