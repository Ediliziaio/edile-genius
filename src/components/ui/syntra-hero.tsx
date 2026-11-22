// Hero animata di Edilizia.io — adattata dal blocco "syntra-hero" (21st.dev).
// Il "nucleo" isometrico rappresenta il sistema AI dell'impresa: al passaggio del
// mouse (o al tocco) si apre nei 5 livelli dal dato grezzo ai risultati.
// Adattamenti: Tailwind 3 (niente sintassi v4), framer-motion, palette verde del
// brand, testi in italiano, navbar del sito invece di quella del template.

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { ComponentType, CSSProperties, MouseEvent, PointerEvent as ReactPointerEvent, ReactNode, SVGProps } from "react";
import { Link } from "react-router-dom";
import {
  LazyMotion,
  animate,
  domAnimation,
  m,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import type { MotionValue } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Clock,
  ClipboardList,
  Database,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Gauge,
  LineChart,
  Mail,
  MousePointer2,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Timer,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────────────────────────── palette ───────────────────────────── */

const ACCENT = "#3BCE78"; // = hsl(var(--primary))
const ACCENT_DEEP = "#1A9E60"; // = hsl(var(--primary-dark))

const BLOCK_CSS = `
.n3-root {
  --color-n3-page: #f6f8f6;
  --color-n3-ink: #111827;
  --color-n3-grey: #6b7280;
  --color-n3-line: #dde3de;
  --color-n3-accent: ${ACCENT};
  --color-n3-accent-deep: ${ACCENT_DEEP};
  --font-n3-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
  --n3-gutter: 20px;
  --n3-nav-space: 76px;
}
@media (min-width: 640px) { .n3-root { --n3-gutter: 32px; } }
@media (min-width: 1024px) { .n3-root { --n3-gutter: 56px; } }
.n3-frame { padding-left: var(--n3-gutter); padding-right: var(--n3-gutter); }
.n3-hero { min-height: min(calc(100dvh - var(--n3-nav-space)), 900px); }
@media (max-width: 1023px) { .n3-hero { min-height: 0; } }
.n3-h1 { font-size: clamp(2.2rem, 1rem + 3.3vw, 4rem); line-height: 1.06; letter-spacing: -0.035em; }
.n3-bg {
  background:
    radial-gradient(ellipse 60% 70% at 74% 52%, rgb(255 255 255 / 0.95) 0%, rgb(255 255 255 / 0) 70%),
    radial-gradient(ellipse 40% 45% at 78% 58%, rgb(59 206 120 / 0.08) 0%, rgb(59 206 120 / 0) 70%),
    radial-gradient(ellipse 50% 40% at 100% 0%, rgb(226 233 228 / 0.7) 0%, rgb(226 233 228 / 0) 70%),
    var(--color-n3-page);
}
.n3-halo { border-radius: 9999px; background: radial-gradient(closest-side, rgb(255 255 255 / 0.9), rgb(255 255 255 / 0)); }
.n3-floor, .n3-floor-lit {
  --n3-floor-area: radial-gradient(ellipse 75% 80% at 72% 70%, #000 20%, transparent 100%);
  --n3-floor-edges: linear-gradient(to left, transparent 0%, #000 22%), linear-gradient(to top, transparent 0%, #000 28%);
  -webkit-mask-image: var(--n3-floor-area), var(--n3-floor-edges);
  mask-image: var(--n3-floor-area), var(--n3-floor-edges);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
}
.n3-floor { opacity: 0.35; }
.n3-floor-spot {
  position: absolute; top: 0; left: 0; opacity: 0; transition: opacity 400ms ease; will-change: transform, opacity;
  -webkit-mask-image: radial-gradient(closest-side, #000 0%, transparent 100%);
  mask-image: radial-gradient(closest-side, #000 0%, transparent 100%);
}
.n3-floor-lit { position: absolute; top: 0; left: 0; will-change: transform; }
[data-spot='on'] > .n3-floor-spot { opacity: 0.7; }
@media (max-width: 1023px) {
  .n3-floor, .n3-floor-lit { --n3-floor-area: radial-gradient(ellipse 90% 60% at 50% 75%, #000 20%, transparent 100%); }
}
.n3-fade-edge { -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 14%); mask-image: linear-gradient(to right, transparent 0%, #000 14%); }
@media (max-width: 1023px) { .n3-fade-edge { -webkit-mask-image: none; mask-image: none; } }
.n3-flip { perspective: 600px; }
.n3-flip-box { --d: 0.75em; display: inline-grid; transform-style: preserve-3d; transform: translateZ(calc(var(--d) * -1)) rotateX(0deg); transition: transform 550ms cubic-bezier(0.22, 1, 0.36, 1); }
.n3-flip-face { grid-area: 1 / 1; display: inline-flex; height: 1.5em; align-items: center; justify-content: center; line-height: 1.5em; backface-visibility: hidden; transform: translateZ(var(--d)); }
.n3-flip-back { transform: rotateX(-90deg) translateZ(var(--d)); }
.n3-flip:hover .n3-flip-box, .n3-flip:focus-visible .n3-flip-box { transform: translateZ(calc(var(--d) * -1)) rotateX(90deg); }
.n3-dot { box-shadow: 0 0 0 4px rgb(59 206 120 / 0.16); }
.n3-rise { animation: n3-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) backwards; }
.n3-enter { animation: n3-enter 1100ms cubic-bezier(0.22, 1, 0.36, 1) 250ms backwards; }
@keyframes n3-rise { from { opacity: 0; translate: 0 18px; } }
@keyframes n3-enter { from { opacity: 0; scale: 0.97; } }
@keyframes n3-float { from { transform: translateY(0); } to { transform: translateY(calc(var(--n3-float, 6) * -1px)); } }
.n3-float { animation: n3-float var(--n3-float-seconds, 6.5s) ease-in-out infinite alternate; }
@keyframes n3-seam { from { opacity: 0.78; } to { opacity: 1; } }
.n3-seam-pulse { animation: n3-seam 4.8s ease-in-out infinite alternate; }
.n3-stage-card {
  border: 1px solid rgb(17 24 39 / 0.06); border-radius: 1.3em; background: rgb(255 255 255 / 0.84);
  box-shadow: 0 1px 2px rgb(40 60 50 / 0.04), 0 14px 34px -18px rgb(50 80 65 / 0.3), inset 0 1px 0 rgb(255 255 255 / 0.9);
  -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
  transition: border-color 300ms ease, box-shadow 300ms ease;
}
.n3-stage-card-lit {
  border-color: rgb(59 206 120 / 0.45);
  box-shadow: 0 1px 2px rgb(40 60 50 / 0.04), 0 18px 38px -18px rgb(59 206 120 / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.9);
}
.n3-visual { container-type: inline-size; }
@container (max-width: 640px) { .n3-stage-apps { display: none; } }
@media (prefers-reduced-motion: reduce) {
  .n3-flip-box { transition: none; }
  .n3-flip:hover .n3-flip-box, .n3-flip:focus-visible .n3-flip-box { transform: translateZ(calc(var(--d) * -1)); }
  .n3-rise, .n3-enter, .n3-float, .n3-seam-pulse { animation: none; }
}
`;

/* ───────────────────────────── geometria isometrica ───────────────────────────── */

const ISO_X = 0.866;
const ISO_Y = 0.5;
const CX = 500;
const CY = 500;
const RING_FLATTEN = 0.57;
const RING_RX = [400, 530] as const;

type SlabType = { half: number; radius: number; top: number; depth: number };

const BASE: SlabType = { half: 168, radius: 40, top: 475, depth: 34 };
const SEAM_GAP = 9;
const MID: SlabType = { half: 151, radius: 36, top: BASE.top - SEAM_GAP - 28, depth: 28 };
const CAP: SlabType = { half: 101, radius: 28, top: MID.top - 14, depth: 14 };

type Point = [number, number];

// Server e browser possono differire all'ultima cifra: arrotondiamo per evitare mismatch di idratazione.
const round = (n: number) => Math.round(n * 100) / 100;

const project = (x: number, y: number, cx = CX, cy = CY): Point => [cx + (x - y) * ISO_X, cy + (x + y) * ISO_Y];

const footprint = (half: number, radius: number, steps = 14): Point[] => {
  const r = Math.min(radius, half);
  const c = half - r;
  const corners: [number, number, number][] = [
    [c, c, 0],
    [-c, c, 90],
    [-c, -c, 180],
    [c, -c, 270],
  ];
  const pts: Point[] = [];
  for (const [ox, oy, start] of corners) {
    for (let i = 0; i <= steps; i++) {
      const a = ((start + (90 * i) / steps) * Math.PI) / 180;
      pts.push([ox + r * Math.cos(a), oy + r * Math.sin(a)]);
    }
  }
  return pts;
};

const toPath = (pts: Point[]) => `M${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L")}Z`;

const topPath = (slab: SlabType, inset = 0, cx = CX, dy = 0) => {
  const half = slab.half - inset;
  const radius = Math.max(slab.radius - inset, 1);
  return toPath(footprint(half, radius).map(([x, y]) => project(x, y, cx, slab.top + dy)));
};

const hull = (points: Point[]): Point[] => {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Point, a: Point, b: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const build = (list: Point[]) => {
    const out: Point[] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...build(pts), ...build([...pts].reverse())];
};

const bodyPath = (slab: SlabType, inset = 0) => {
  const half = slab.half - inset;
  const radius = Math.max(slab.radius - inset, 1);
  const outline = footprint(half, radius);
  const upper = outline.map(([x, y]) => project(x, y, CX, slab.top));
  const lower = outline.map(([x, y]) => project(x, y, CX, slab.top + slab.depth));
  return toPath(hull([...upper, ...lower]));
};

const facePoint = (slab: SlabType, side: "left" | "right", u: number, v: number): Point => {
  const { half, top, depth } = slab;
  if (side === "left") {
    const [x, y] = project(-half + 2 * half * u, half, CX, top);
    return [x, y + depth * v];
  }
  const [x, y] = project(half, half - 2 * half * u, CX, top);
  return [x, y + depth * v];
};

const FACE_MATRIX = {
  left: `${ISO_X} ${ISO_Y} 0 1`,
  right: `${ISO_X} ${-ISO_Y} 0 1`,
  top: `${ISO_X} ${ISO_Y} ${-ISO_X} ${ISO_Y}`,
};

const ringPoint = (rx: number, angleDeg: number): Point => {
  const a = (angleDeg * Math.PI) / 180;
  return [round(CX + rx * Math.cos(a)), round(CY + rx * RING_FLATTEN * Math.sin(a))];
};

const ringPath = (rx: number) => {
  const ry = rx * RING_FLATTEN;
  return `M${CX + rx} ${CY}A${rx} ${ry} 0 1 1 ${CX - rx} ${CY}A${rx} ${ry} 0 1 1 ${CX + rx} ${CY}Z`;
};

/* ───────────────────────────── marchio sul nucleo ───────────────────────────── */

const LEAF = "M11 0H19A3 3 0 0 1 22 3V11A11 11 0 0 1 11 22H3A3 3 0 0 1 0 19V11A11 11 0 0 1 11 0Z";
const TURNS = [0, 90, 180, 270];
const OPACITY = [1, 0.9, 0.8, 0.9];

const Leaves = ({ fill, fades = false, stroke }: { fill: string; fades?: boolean; stroke?: string }) => (
  <>
    {TURNS.map((turn, i) => (
      <path
        key={turn}
        d={LEAF}
        transform={`rotate(${turn}) translate(-25 -25)`}
        fill={fill}
        stroke={stroke}
        strokeWidth={stroke ? 0.6 : undefined}
        opacity={fades ? OPACITY[i] : 1}
      />
    ))}
  </>
);

/* ───────────────────────────── parti del nucleo ───────────────────────────── */

type FaceProps = { slab: SlabType; side: "left" | "right"; u: number; v: number };

const FaceMark = ({ slab, side, u, v, w, h, fill, glow }: FaceProps & { w: number; h: number; fill: string; glow?: boolean }) => {
  const [x, y] = facePoint(slab, side, u, v);
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) matrix(${FACE_MATRIX[side]} 0 0)`}>
      {glow && (
        <rect x={-w / 2 - 2} y={-h / 2 - 3} width={w + 4} height={h + 6} rx={h} fill={fill} filter="url(#n3-blur-sm)" opacity="0.75" />
      )}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} />
    </g>
  );
};

const PanelLine = ({ slab, side, v, from = 0.14, to = 0.86 }: { slab: SlabType; side: "left" | "right"; v: number; from?: number; to?: number }) => {
  const [x1, y1] = facePoint(slab, side, from, v);
  const [x2, y2] = facePoint(slab, side, to, v);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#A2A8A3" strokeWidth="0.9" opacity="0.55" />;
};

const Fastener = ({ slab, x, y }: { slab: SlabType; x: number; y: number }) => {
  const [px, py] = project(x, y, CX, slab.top);
  return (
    <g transform={`translate(${px.toFixed(2)} ${py.toFixed(2)}) matrix(${FACE_MATRIX.top} 0 0)`}>
      <circle r="6.5" fill="url(#n3-hole)" stroke="#C4CAC5" strokeWidth="1" />
    </g>
  );
};

const SlabBody = ({ slab }: { slab: SlabType }) => (
  <g>
    <path d={bodyPath(slab)} fill="url(#n3-side)" />
    <path d={bodyPath(slab)} fill="url(#n3-side-shade)" />
    <path d={bodyPath(slab)} fill="none" stroke="#CAD0CB" strokeWidth="1" opacity="0.85" />
  </g>
);

const SlabTop = ({ slab, groove }: { slab: SlabType; groove?: number }) => (
  <g>
    <path d={topPath(slab)} fill="url(#n3-bevel)" stroke="#D6DCD7" strokeWidth="1" />
    <path d={topPath(slab, 4.5)} fill="url(#n3-top)" stroke="#fff" strokeWidth="1" />
    {groove !== undefined && <path d={topPath(slab, groove)} fill="none" stroke="#D5DBD6" strokeWidth="1.2" />}
  </g>
);

const LOGO_SIDE = ["#0F6A42", "#137649", "#178352", "#1B905A", "#209C63", "#26A86B"];
const LOGO_SCALE = 1.42;

const CoreLogo = ({ x, y }: { x: number; y: number }) => {
  const plane = (lift: number) => `translate(${x} ${y - lift}) matrix(${FACE_MATRIX.top} 0 0) scale(${LOGO_SCALE})`;
  const top = LOGO_SIDE.length;
  return (
    <g>
      <g transform={`${plane(0)} translate(2.4 2.4)`} opacity="0.22" filter="url(#n3-blur-sm)">
        <Leaves fill="#4F5F55" />
      </g>
      {LOGO_SIDE.map((fill, k) => (
        <g key={fill} transform={plane(k)}>
          <Leaves fill={fill} />
        </g>
      ))}
      <g transform={plane(top)}>
        <rect x="-27" y="-27" width="54" height="54" fill="url(#n3-logo-top)" clipPath="url(#n3-mark-clip)" />
        <Leaves fill="none" stroke="#D2F5E0" />
      </g>
    </g>
  );
};

const CoreDefs = () => (
  <defs>
    <linearGradient id="n3-side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#F1F4F1" />
      <stop offset="0.46" stopColor="#E6EAE6" />
      <stop offset="0.5" stopColor="#D6DCD7" />
      <stop offset="1" stopColor="#E0E5E1" />
    </linearGradient>
    <linearGradient id="n3-side-shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stopColor="#66736B" stopOpacity="0" />
      <stop offset="1" stopColor="#66736B" stopOpacity="0.16" />
    </linearGradient>
    <linearGradient id="n3-bevel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="1" stopColor="#E2E7E3" />
    </linearGradient>
    <linearGradient id="n3-top" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="1" stopColor="#EFF3F0" />
    </linearGradient>
    <linearGradient id="n3-inlay" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#EBF0EC" />
      <stop offset="1" stopColor="#FFFFFF" />
    </linearGradient>
    <linearGradient id="n3-seam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#A7EBC3" />
      <stop offset="0.5" stopColor={ACCENT} />
      <stop offset="1" stopColor="#6EDC9C" />
    </linearGradient>
    <linearGradient id="n3-slot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#56605A" />
      <stop offset="1" stopColor="#87918B" />
    </linearGradient>
    <linearGradient id="n3-logo-top" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#8BE5B1" />
      <stop offset="0.55" stopColor="#4FD487" />
      <stop offset="1" stopColor="#2FBF6E" />
    </linearGradient>
    <clipPath id="n3-mark-clip">
      <Leaves fill="#000" />
    </clipPath>
    <radialGradient id="n3-hole" cx="0.5" cy="0.4" r="0.7">
      <stop offset="0" stopColor="#D3D9D4" />
      <stop offset="1" stopColor="#F1F4F1" />
    </radialGradient>
    <filter id="n3-blur-sm" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="3.5" />
    </filter>
    <filter id="n3-blur-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="9" />
    </filter>
    <filter id="n3-blur-spill" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
  </defs>
);

const SEAM: SlabType = { half: MID.half - 2, radius: MID.radius - 2, top: MID.top + MID.depth - 1, depth: SEAM_GAP + 1 };

const BaseMarks = () => (
  <>
    <FaceMark slab={BASE} side="right" u={0.5} v={0.62} w={4.5} h={4.5} fill="url(#n3-slot)" />
    <FaceMark slab={BASE} side="right" u={0.58} v={0.62} w={4.5} h={4.5} fill="url(#n3-slot)" />
    <FaceMark slab={BASE} side="right" u={0.66} v={0.62} w={4.5} h={4.5} fill="url(#n3-slot)" />
    <FaceMark slab={BASE} side="left" u={0.32} v={0.62} w={4.5} h={4.5} fill="url(#n3-slot)" />
    <FaceMark slab={BASE} side="left" u={0.4} v={0.62} w={4.5} h={4.5} fill="url(#n3-slot)" />
  </>
);

const MidDetails = () => (
  <>
    <PanelLine slab={MID} side="left" v={0.78} />
    <PanelLine slab={MID} side="right" v={0.78} />
    <FaceMark slab={MID} side="left" u={0.62} v={0.42} w={34} h={7.5} fill="url(#n3-slot)" />
    <FaceMark slab={MID} side="left" u={0.34} v={0.42} w={5} h={5} fill="url(#n3-slot)" />
    <FaceMark slab={MID} side="left" u={0.42} v={0.42} w={5} h={5} fill="url(#n3-slot)" />
    <FaceMark slab={MID} side="right" u={0.44} v={0.42} w={5} h={5} fill="url(#n3-slot)" />
    <FaceMark slab={MID} side="right" u={0.52} v={0.42} w={5} h={5} fill="url(#n3-slot)" />
    <FaceMark slab={MID} side="right" u={0.68} v={0.42} w={22} h={4.5} fill="url(#n3-slot)" />
    <g className="n3-seam-pulse">
      <FaceMark slab={MID} side="left" u={0.2} v={0.42} w={7} h={2.6} fill={ACCENT} glow />
    </g>
    <Fastener slab={MID} x={0} y={-MID.half + 28} />
    <Fastener slab={MID} x={-MID.half + 28} y={0} />
    <Fastener slab={MID} x={MID.half - 28} y={0} />
    <Fastener slab={MID} x={0} y={MID.half - 28} />
  </>
);

const SeamGlow = () => (
  <>
    <g className="n3-seam-pulse">
      <path d={topPath(MID, 4, CX, BASE.top - MID.top)} fill={ACCENT} opacity="0.24" filter="url(#n3-blur-spill)" />
      <path d={bodyPath(SEAM)} fill={ACCENT} opacity="0.6" filter="url(#n3-blur-glow)" />
    </g>
  </>
);

const Inlay = ({ slab }: { slab: SlabType }) => (
  <>
    <path d={topPath(slab, 19)} fill="url(#n3-inlay)" stroke="#D9DFDA" strokeWidth="1.2" />
    <path d={topPath(slab, 20.5)} fill="none" stroke="#fff" strokeWidth="1" opacity="0.9" />
  </>
);

/** Il nucleo a riposo: tre lastre (base, centrale, coperchio) con la fessura luminosa. */
const CoreObject = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 1000 1000" role="img" aria-label="Il sistema AI di Edilizia.io" {...props}>
    <CoreDefs />
    <SlabBody slab={BASE} />
    <SlabTop slab={BASE} groove={10} />
    <PanelLine slab={BASE} side="left" v={0.3} />
    <PanelLine slab={BASE} side="right" v={0.3} />
    <BaseMarks />
    <SeamGlow />
    <path d={bodyPath(SEAM)} fill="url(#n3-seam)" />
    <SlabBody slab={MID} />
    <SlabTop slab={MID} groove={11} />
    <MidDetails />
    <SlabBody slab={CAP} />
    <SlabTop slab={CAP} />
    <Inlay slab={CAP} />
    <CoreLogo x={CX} y={CAP.top} />
  </svg>
);

const CoreShadow = (props: SVGProps<SVGSVGElement>) => {
  const floor = { ...BASE, top: BASE.top + BASE.depth + 30 };
  return (
    <svg viewBox="0 0 1000 1000" aria-hidden {...props}>
      <defs>
        <filter id="n3-blur-lg" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
        <filter id="n3-blur-md" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <path d={topPath(floor, -14)} fill="#7A867E" opacity="0.2" filter="url(#n3-blur-lg)" />
      <path d={topPath(floor, 6)} fill="#4F5A53" opacity="0.22" filter="url(#n3-blur-md)" />
    </svg>
  );
};

const NODES: [number, number][] = [
  [118, 132],
  [318, 82],
  [690, 96],
  [884, 188],
  [936, 470],
  [70, 512],
  [150, 858],
  [850, 846],
];

const DepthBackdrop = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 1000 1000" aria-hidden {...props}>
    <defs>
      <linearGradient id="n3-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
        <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
      </linearGradient>
    </defs>
    <g fill="url(#n3-glass)" stroke="#DFE4E0" strokeWidth="1" opacity="0.35">
      <rect width="290" height="250" rx="22" transform="matrix(0.866 -0.5 0 1 232 300)" />
      <rect width="290" height="250" rx="22" transform="matrix(0.866 0.5 0 1 520 150)" />
    </g>
    <g fill="#fff" stroke="#CAD0CB" strokeWidth="1">
      {NODES.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 4 : 3} opacity="0.85" />
      ))}
    </g>
  </svg>
);

const DOTS = Array.from({ length: 26 }, (_, i) => {
  const a = (i * 137.5 * Math.PI) / 180;
  const r = 160 + ((i * 53) % 340);
  return [round(CX + r * Math.cos(a) * 1.02), round(CY + r * Math.sin(a) * RING_FLATTEN * 1.6), 0.8 + (i % 3) * 0.5] as const;
});

const TechnicalBackdrop = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 1000 1000" aria-hidden {...props}>
    <defs>
      <linearGradient id="n3-axis-v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#C2C9C4" stopOpacity="0" />
        <stop offset="0.5" stopColor="#C2C9C4" stopOpacity="0.45" />
        <stop offset="1" stopColor="#C2C9C4" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="n3-axis-h" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#C2C9C4" stopOpacity="0" />
        <stop offset="0.5" stopColor="#C2C9C4" stopOpacity="0.7" />
        <stop offset="1" stopColor="#C2C9C4" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect x={CX - 0.5} y="110" width="1" height="780" fill="url(#n3-axis-v)" />
    <rect x="70" y={CY - 0.5} width="860" height="1" fill="url(#n3-axis-h)" />
    <g fill="#C2C9C4">
      {DOTS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} opacity={0.35 + (i % 4) * 0.12} />
      ))}
    </g>
    <g stroke="#C2C9C4" strokeWidth="1" opacity="0.5">
      {(
        [
          [212, 292],
          [790, 690],
          [860, 430],
          [150, 560],
        ] as const
      ).map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x - 5} ${y}h10M${x} ${y - 5}v10`} />
      ))}
    </g>
  </svg>
);

const OrbitalSystem = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 1000 1000" aria-hidden {...props}>
    <g fill="none" stroke="#D6DCD7" strokeWidth="1">
      <ellipse cx={CX} cy={CY} rx={RING_RX[0]} ry={RING_RX[0] * RING_FLATTEN} opacity="0.8" />
      <ellipse cx={CX} cy={CY} rx={RING_RX[1]} ry={RING_RX[1] * RING_FLATTEN} opacity="0.65" />
    </g>
  </svg>
);

/* ───────────────────────────── configurazione ───────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;

const MOTION = {
  floatDistance: 10,
  floatSeconds: 6.5,
  tiltDegrees: 3.5,
  ringParallax: 12,
  backdropParallax: 5,
  orbitSeconds: [70, 95],
  orbitOpenOpacity: 0.15,
};

const ARTBOARD = 1000;

type StageIcon = ComponentType<{ className?: string; strokeWidth?: number | string }>;

type Stage = {
  title: string;
  items: string[];
  tools: { label: string; Icon: StageIcon }[];
  Icon?: StageIcon;
  side: "left" | "right";
  main?: boolean;
};

/* I loghi dei modelli AI sono marchi dei rispettivi proprietari: li usiamo solo
   come indicazione dei motori che integriamo. */
const OpenAiLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 260" aria-hidden className={className}>
    <path d="M239.184 106.203a64.72 64.72 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.72 64.72 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.67 64.67 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.77 64.77 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483m-97.56 136.338a48.4 48.4 0 0 1-31.105-11.255l1.535-.87l51.67-29.825a8.6 8.6 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601M37.158 197.93a48.35 48.35 0 0 1-5.781-32.589l1.534.921l51.722 29.826a8.34 8.34 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803M23.549 85.38a48.5 48.5 0 0 1 25.58-21.333v61.39a8.29 8.29 0 0 0 4.195 7.316l62.874 36.272l-21.845 12.636a.82.82 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405zm179.466 41.695l-63.08-36.63L161.73 77.86a.82.82 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.54 8.54 0 0 0-4.4-7.213m21.742-32.69l-1.535-.922l-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.72.72 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391zM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87l-51.67 29.825a8.6 8.6 0 0 0-4.246 7.367zm11.868-25.58L128.067 97.3l28.188 16.218v32.434l-28.086 16.218l-28.188-16.218z" />
  </svg>
);

const GeminiLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" aria-hidden className={className}>
    <path fill="#448aff" d="M15 8.014A7.457 7.457 0 0 0 8.014 15h-.028A7.456 7.456 0 0 0 1 8.014v-.028A7.456 7.456 0 0 0 7.986 1h.028A7.457 7.457 0 0 0 15 7.986z" />
  </svg>
);

const ClaudeLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 257" aria-hidden className={className}>
    <path
      fill="#d97757"
      d="m50.228 170.321l50.357-28.257l.843-2.463l-.843-1.361h-2.462l-8.426-.518l-28.775-.778l-24.952-1.037l-24.175-1.296l-6.092-1.297L0 125.796l.583-3.759l5.12-3.434l7.324.648l16.202 1.101l24.304 1.685l17.629 1.037l26.118 2.722h4.148l.583-1.685l-1.426-1.037l-1.101-1.037l-25.147-17.045l-27.22-18.017l-14.258-10.37l-7.713-5.25l-3.888-4.925l-1.685-10.758l7-7.713l9.397.649l2.398.648l9.527 7.323l20.35 15.75L94.817 91.9l3.889 3.24l1.555-1.102l.195-.777l-1.75-2.917l-14.453-26.118l-15.425-26.572l-6.87-11.018l-1.814-6.61c-.648-2.723-1.102-4.991-1.102-7.778l7.972-10.823L71.42 0l10.63 1.426l4.472 3.888l6.61 15.101l10.694 23.786l16.591 32.34l4.861 9.592l2.592 8.879l.973 2.722h1.685v-1.556l1.36-18.211l2.528-22.36l2.463-28.776l.843-8.1l4.018-9.722l7.971-5.25l6.222 2.981l5.12 7.324l-.713 4.73l-3.046 19.768l-5.962 30.98l-3.889 20.739h2.268l2.593-2.593l10.499-13.934l17.628-22.036l7.778-8.749l9.073-9.657l5.833-4.601h11.018l8.1 12.055l-3.628 12.443l-11.342 14.388l-9.398 12.184l-13.48 18.147l-8.426 14.518l.778 1.166l2.01-.194l30.46-6.481l16.462-2.982l19.637-3.37l8.88 4.148l.971 4.213l-3.5 8.62l-20.998 5.184l-24.628 4.926l-36.682 8.685l-.454.324l.519.648l16.526 1.555l7.065.389h17.304l32.21 2.398l8.426 5.574l5.055 6.805l-.843 5.184l-12.962 6.611l-17.498-4.148l-40.83-9.721l-14-3.5h-1.944v1.167l11.666 11.406l21.387 19.314l26.767 24.887l1.36 6.157l-3.434 4.86l-3.63-.518l-23.526-17.693l-9.073-7.972l-20.545-17.304h-1.36v1.814l4.73 6.935l25.017 37.59l1.296 11.536l-1.814 3.76l-6.481 2.268l-7.13-1.297l-14.647-20.544l-15.1-23.138l-12.185-20.739l-1.49.843l-7.194 77.448l-3.37 3.953l-7.778 2.981l-6.48-4.925l-3.436-7.972l3.435-15.749l4.148-20.544l3.37-16.333l3.046-20.285l1.815-6.74l-.13-.454l-1.49.194l-15.295 20.999l-23.267 31.433l-18.406 19.702l-4.407 1.75l-7.648-3.954l.713-7.064l4.277-6.286l25.47-32.405l15.36-20.092l9.917-11.6l-.065-1.686h-.583L44.07 198.125l-12.055 1.555l-5.185-4.86l.648-7.972l2.463-2.593l20.35-13.999z"
    />
  </svg>
);

/** Dal basso verso l'alto: i dati entrano dalla lastra di base ed escono in cima come risultati. */
const STAGES: Stage[] = [
  {
    title: "Dati dell'impresa",
    items: ["Documenti", "Computi", "Email"],
    tools: [
      { label: "Documenti", Icon: FileText },
      { label: "Fogli di calcolo", Icon: FileSpreadsheet },
      { label: "Email", Icon: Mail },
    ],
    Icon: Database,
    side: "right",
  },
  {
    title: "Contesto aziendale",
    items: ["Listini", "Commesse", "Procedure"],
    tools: [
      { label: "Listini", Icon: BookOpen },
      { label: "Archivio commesse", Icon: FolderOpen },
      { label: "Procedure", Icon: ClipboardList },
    ],
    Icon: FolderOpen,
    side: "left",
  },
  {
    title: "Intelligenza AI",
    items: ["Ragionamento", "Analisi", "Decisioni"],
    tools: [
      { label: "OpenAI", Icon: OpenAiLogo },
      { label: "Gemini", Icon: GeminiLogo },
      { label: "Claude", Icon: ClaudeLogo },
    ],
    side: "right",
    main: true,
  },
  {
    title: "Automazioni",
    items: ["Chiamate", "Preventivi", "Pratiche"],
    tools: [
      { label: "Telefono", Icon: Phone },
      { label: "Preventivi", Icon: Calculator },
      { label: "Flussi", Icon: Workflow },
    ],
    Icon: Workflow,
    side: "left",
  },
  {
    title: "Risultati",
    items: ["Margini", "Tempi", "Report"],
    tools: [
      { label: "Margini", Icon: LineChart },
      { label: "Tempi", Icon: Timer },
      { label: "Report", Icon: Gauge },
    ],
    Icon: LineChart,
    side: "right",
  },
];

const EXPLODE = {
  spring: { stiffness: 105, damping: 25, mass: 1 },
  gap: 94,
  aiLift: 12,
  topPlateY: 230,
  stagger: 0.05,
  scales: [0.63, 0.62, 0.7, 1.07, 1.06],
};

const STAGE_CARDS = {
  left: { edge: -2, width: 31 },
  right: { edge: 0, width: 29 },
  restInset: 10,
  outward: 2,
  beadSeconds: 1.6,
};

/* ───────────────────────────── vista esplosa ───────────────────────────── */

const PLATE_SLABS: SlabType[] = [
  { ...BASE, top: BASE.top + 17, depth: 17 },
  { ...BASE, top: BASE.top, depth: 17 },
  MID,
  { ...CAP, top: CAP.top + 7, depth: 7 },
  { ...CAP, top: CAP.top, depth: 7 },
];

const AI_PLATE = 2;

const TARGET_TOPS = PLATE_SLABS.map(
  (_, i) => EXPLODE.topPlateY + (PLATE_SLABS.length - 1 - i) * EXPLODE.gap - (i === AI_PLATE ? EXPLODE.aiLift : 0),
);
const TRAVEL = PLATE_SLABS.map((slab, i) => TARGET_TOPS[i] - slab.top);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const plateProgress = (i: number, p: number) => {
  const delay = Math.abs(i - AI_PLATE) * EXPLODE.stagger;
  return clamp01((p - delay) / (1 - delay));
};
const plateY = (i: number, p: number) => TRAVEL[i] * plateProgress(i, p);
const plateScale = (i: number, p: number) => 1 + (EXPLODE.scales[i] - 1) * plateProgress(i, p);

const tipOffset = (i: number) => {
  const { half, radius } = PLATE_SLABS[i];
  return 0.866 * (2 * half - 0.586 * radius) * EXPLODE.scales[i];
};
const tipX = (i: number, side: "left" | "right") => CX + (side === "right" ? 1 : -1) * tipOffset(i);
const cornerY = (i: number) => TARGET_TOPS[i] + PLATE_SLABS[i].depth / 2;

const SKIRT = [0, 4, 0, 10, 10];

const Plate = ({ index, progress, children }: { index: number; progress: MotionValue<number>; children: ReactNode }) => {
  const y = useTransform(progress, (v) => plateY(index, v));
  const scale = useTransform(progress, (v) => plateScale(index, v));
  const apart = useTransform(progress, (v) => plateProgress(index, v));
  const shadow = useTransform(apart, (v) => v * 0.16);
  const slab = PLATE_SLABS[index];
  const skirt = SKIRT[index];
  return (
    <m.g style={{ y, scale }}>
      {index > 0 && <m.path d={topPath(slab, -6, CX, slab.depth + 34)} fill="#5E6B62" filter="url(#n3-blur-spill)" style={{ opacity: shadow }} />}
      {skirt > 0 && (
        <m.g style={{ opacity: apart }}>
          <SlabBody slab={{ ...slab, top: slab.top + slab.depth - 1, depth: skirt + 1 }} />
        </m.g>
      )}
      {children}
    </m.g>
  );
};

const PlateNumber = ({ slab, n, main = false }: { slab: SlabType; n: number; main?: boolean }) => {
  const k = slab.half * 0.56;
  const [x, y] = project(k, k, CX, slab.top);
  const plane = `matrix(${FACE_MATRIX.top} 0 0) rotate(-45)`;
  const label = String(n).padStart(2, "0");
  const text = { textAnchor: "middle" as const, dominantBaseline: "central" as const, fontSize: 25, fontWeight: 500, letterSpacing: 2.5 };
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`} aria-hidden>
      <text {...text} transform={`translate(0 0.9) ${plane}`} fill="#FFFFFF" opacity="0.95">
        {label}
      </text>
      <text {...text} transform={plane} fill={main ? "#2FBF6E" : "#C3CAC5"}>
        {label}
      </text>
    </g>
  );
};

const AiEmphasis = ({ progress }: { progress: MotionValue<number> }) => {
  const on = useTransform(progress, (v) => clamp01((v - 0.5) / 0.4));
  const rim = useTransform(on, (v) => v * 0.9);
  const halo = useTransform(on, (v) => v * 0.55);
  const spill = useTransform(halo, (v) => v * 0.35);
  return (
    <g transform={`translate(${CX} ${MID.top}) matrix(${FACE_MATRIX.top} 0 0)`}>
      <m.circle r="86" fill={ACCENT} filter="url(#n3-blur-spill)" style={{ opacity: spill }} />
      <m.circle r="56" fill="none" stroke={ACCENT} strokeWidth="1.4" style={{ opacity: rim }} />
      <m.circle r="38" fill="none" stroke={ACCENT} strokeWidth="1" strokeDasharray="3 6" style={{ opacity: halo }} />
      <m.circle r="9" fill={ACCENT} style={{ opacity: rim }} />
    </g>
  );
};

const ExplodedCore = ({ progress, ...props }: SVGProps<SVGSVGElement> & { progress: MotionValue<number> }) => {
  const strongGlow = useTransform(progress, (v) => clamp01((v - 0.4) / 0.5) * 0.6);
  return (
    <svg viewBox="0 0 1000 1000" aria-hidden {...props}>
      <CoreDefs />
      <Plate index={0} progress={progress}>
        <SlabBody slab={PLATE_SLABS[0]} />
        <SlabTop slab={PLATE_SLABS[0]} groove={10} />
        <PlateNumber slab={PLATE_SLABS[0]} n={1} />
        <BaseMarks />
      </Plate>
      <Plate index={1} progress={progress}>
        <SlabBody slab={PLATE_SLABS[1]} />
        <SlabTop slab={PLATE_SLABS[1]} groove={10} />
        <PlateNumber slab={PLATE_SLABS[1]} n={2} />
        <PanelLine slab={BASE} side="left" v={0.3} />
        <PanelLine slab={BASE} side="right" v={0.3} />
      </Plate>
      <Plate index={AI_PLATE} progress={progress}>
        <SeamGlow />
        <m.path d={bodyPath(SEAM)} fill={ACCENT} filter="url(#n3-blur-glow)" style={{ opacity: strongGlow }} />
        <path d={bodyPath(SEAM)} fill="url(#n3-seam)" />
        <SlabBody slab={MID} />
        <SlabTop slab={MID} groove={11} />
        <PlateNumber slab={MID} n={3} main />
        <MidDetails />
        <AiEmphasis progress={progress} />
      </Plate>
      <Plate index={3} progress={progress}>
        <SlabBody slab={PLATE_SLABS[3]} />
        <SlabTop slab={PLATE_SLABS[3]} />
        <Inlay slab={PLATE_SLABS[3]} />
        <PlateNumber slab={PLATE_SLABS[3]} n={4} />
      </Plate>
      <Plate index={4} progress={progress}>
        <SlabBody slab={PLATE_SLABS[4]} />
        <SlabTop slab={PLATE_SLABS[4]} />
        <Inlay slab={CAP} />
        <CoreLogo x={CX} y={CAP.top} />
      </Plate>
    </svg>
  );
};

/* ───────────────────────────── particelle in orbita ───────────────────────────── */

type NodeType = { ring: 0 | 1; angle: number; size: number };

const ORBIT_NODES: NodeType[] = [
  { ring: 0, angle: 20, size: 7 },
  { ring: 0, angle: 110, size: 5.5 },
  { ring: 0, angle: 200, size: 8 },
  { ring: 0, angle: 290, size: 6 },
  { ring: 1, angle: 60, size: 6 },
  { ring: 1, angle: 132, size: 8 },
  { ring: 1, angle: 204, size: 5.5 },
  { ring: 1, angle: 276, size: 7 },
  { ring: 1, angle: 348, size: 6.5 },
];

const Crystal = ({ size }: { size: number }) => (
  <g filter="url(#n3-crystal-shadow)">
    <circle r={size * 1.55} fill="url(#n3-crystal-halo)" />
    <circle r={size} fill="url(#n3-crystal-body)" />
    <circle r={size} fill="url(#n3-crystal-refract)" />
    <circle r={size - 0.5} fill="none" stroke="url(#n3-crystal-rim)" strokeWidth="1" />
    <ellipse
      cx={-size * 0.32}
      cy={-size * 0.4}
      rx={size * 0.36}
      ry={size * 0.2}
      transform={`rotate(-30 ${-size * 0.32} ${-size * 0.4})`}
      fill="#FFFFFF"
      opacity="0.95"
    />
    <circle cx={size * 0.34} cy={-size * 0.5} r={Math.max(0.7, size * 0.07)} fill="#FFFFFF" opacity="0.85" />
  </g>
);

type ParticlesProps = SVGProps<SVGSVGElement> & { half: "back" | "front"; animate: boolean; paused?: boolean };

const Particles = ({ half, animate: run, paused = false, ...props }: ParticlesProps) => {
  const ref = useRef<SVGSVGElement>(null);
  const clipId = `n3-clip-${half}`;
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    if (paused) svg.pauseAnimations();
    else svg.unpauseAnimations();
  }, [paused]);
  return (
    <svg ref={ref} viewBox="0 0 1000 1000" aria-hidden {...props}>
      <defs>
        <clipPath id={clipId}>
          {half === "back" ? <rect x="-200" y="-200" width="1400" height={CY + 200} /> : <rect x="-200" y={CY} width="1400" height="700" />}
        </clipPath>
        <linearGradient id={`n3-crystal-body`} x1="0.15" y1="0.1" x2="0.85" y2="0.95">
          <stop offset="0" stopColor="#E2F9EC" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#6EDC9C" stopOpacity="0.88" />
          <stop offset="1" stopColor="#1FAA62" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="n3-crystal-refract" cx="0.6" cy="0.78" r="0.45">
          <stop offset="0" stopColor="#F0FCF5" stopOpacity="0.85" />
          <stop offset="1" stopColor="#F0FCF5" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="n3-crystal-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#12804A" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="n3-crystal-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.5" stopColor={ACCENT} stopOpacity="0.12" />
          <stop offset="1" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
        <filter id="n3-crystal-shadow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#1E6B45" floodOpacity="0.25" />
        </filter>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {ORBIT_NODES.map((node, i) => {
          const rx = RING_RX[node.ring];
          const [x, y] = ringPoint(rx, node.angle);
          const dur = MOTION.orbitSeconds[node.ring];
          const reverse = node.ring === 1;
          const start = node.angle / 360;
          const begin = -dur * (reverse ? 1 - start : start);
          return (
            <g key={i} transform={run ? undefined : `translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
              <Crystal size={node.size} />
              {run && (
                <animateMotion
                  dur={`${dur}s`}
                  begin={`${begin}s`}
                  repeatCount="indefinite"
                  path={ringPath(rx)}
                  {...(reverse && { keyPoints: "1;0", keyTimes: "0;1", calcMode: "linear" })}
                />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/* ───────────────────────────── schede dei livelli ───────────────────────────── */

const StageTools = ({ stage, tiles, className }: { stage: Stage; tiles: boolean; className?: string }) => (
  <div className={cn("n3-stage-apps flex shrink-0 items-center", tiles ? "gap-[0.45em]" : "gap-[0.3em]", className)}>
    {stage.tools.map(({ label, Icon }) =>
      tiles ? (
        <span
          key={label}
          title={label}
          className="grid size-[2.15em] place-items-center rounded-[0.6em] border border-[color:var(--color-n3-line)] bg-white shadow-[0_1px_2px_rgb(40_60_50/0.06)]"
        >
          <Icon className="size-[1.2em]" />
        </span>
      ) : (
        <span key={label} title={label} className="grid size-[1.6em] place-items-center rounded-[0.45em] bg-[rgb(59_206_120/0.1)]">
          <Icon className="size-[1em] text-[color:var(--color-n3-accent-deep)]" strokeWidth={1.8} />
        </span>
      ),
    )}
    <span className="sr-only">Strumenti: {stage.tools.map((t) => t.label).join(", ")}</span>
  </div>
);

const StageCardBody = ({ index }: { index: number }) => {
  const stage = STAGES[index];
  const main = !!stage.main;
  const Icon = stage.Icon;
  return (
    <div className="grid grid-cols-[1.35em_minmax(0,1fr)_auto] items-start gap-x-[0.5em]">
      <span className="col-start-1 row-start-1 flex h-[1.64em] items-center text-[0.8em] font-medium tabular-nums text-[color:var(--color-n3-grey)]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className={cn("col-start-2 row-start-1 flex flex-wrap items-baseline justify-between gap-x-[0.6em]", main && "col-span-2")}>
        <p className="text-[1.05em] font-semibold leading-[1.25] tracking-[-0.015em] text-[color:var(--color-n3-ink)] md:whitespace-nowrap">
          {stage.title}
        </p>
        {main && (
          <span className="shrink-0 text-[0.72em] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-n3-accent-deep)]">
            Il cuore
          </span>
        )}
      </div>
      {Icon && (
        <span className="col-start-1 row-start-2 mt-[0.4em] flex h-[1.276em] items-center">
          <Icon className="size-[1.25em] text-[color:var(--color-n3-accent)]" strokeWidth={1.7} />
        </span>
      )}
      <div className={cn("col-start-2 row-start-2 mt-[0.4em]", main && "col-span-2")}>
        <p className="text-[0.88em] leading-[1.45] text-[color:var(--color-n3-grey)]">{stage.items.join(" · ")}</p>
        {main && <StageTools stage={stage} tiles className="mt-[0.75em] justify-end" />}
      </div>
      {!main && <StageTools stage={stage} tiles={false} className="col-start-3 row-span-2 row-start-1 self-center" />}
    </div>
  );
};

const pct = (n: number) => `${(n / ARTBOARD) * 100}%`;
const cardDirection = (index: number) => (STAGES[index].side === "left" ? -1 : 1);

type StageCardProps = { index: number; progress: MotionValue<number>; open: boolean; lit: boolean; onHover: (index: number | null) => void };

const StageCard = ({ index, progress, open, lit, onHover }: StageCardProps) => {
  const opacity = useTransform(progress, [0.35, 0.9], [0, 1]);
  const x = useTransform(progress, [0, 1], [-cardDirection(index) * STAGE_CARDS.restInset, cardDirection(index) * STAGE_CARDS.outward]);
  const stage = STAGES[index];
  const { edge, width } = STAGE_CARDS[stage.side];
  const left = stage.side === "left" ? edge : 100 - edge - width;
  return (
    <li style={{ top: pct(cornerY(index)), left: `${left}%`, width: `${width}%` }} className="absolute -translate-y-1/2">
      <m.div
        style={{ opacity, x }}
        onPointerEnter={(e: ReactPointerEvent) => {
          if (e.pointerType === "mouse") onHover(index);
        }}
        onPointerLeave={() => onHover(null)}
        className={cn("n3-stage-card px-[0.9em] py-[0.85em]", open && "pointer-events-auto", lit && "n3-stage-card-lit")}
      >
        <StageCardBody index={index} />
      </m.div>
    </li>
  );
};

const StageCards = ({ progress, open, hovered, onHover }: { progress: MotionValue<number>; open: boolean; hovered: number | null; onHover: (i: number | null) => void }) => (
  <ul
    aria-label="Come funziona un sistema AI di Edilizia.io"
    aria-hidden={!open}
    className="pointer-events-none absolute inset-0 m-0 hidden list-none p-0 text-[clamp(10px,1.7cqw,15px)] md:block"
  >
    {STAGES.map((stage, i) => (
      <StageCard key={stage.title} index={i} progress={progress} open={open} lit={hovered === i} onHover={onHover} />
    ))}
  </ul>
);

const lineEnds = (plate: number, card: number, side: "left" | "right") => {
  const dir = side === "right" ? 1 : -1;
  return { plateX: plate + dir * 7, nodeX: card - dir * 10 };
};

type ConnectorProps = {
  className?: string;
  plate: number;
  card: number;
  y: number;
  side: "left" | "right";
  index: number;
  main: boolean;
  lit: boolean;
  active: boolean;
  progress: MotionValue<number>;
};

const StageConnector = ({ plate, card, y, side, index, main, lit, active, progress, className }: ConnectorProps) => {
  const show = useTransform(progress, [0.55, 0.9], [0, 1]);
  const t = useMotionValue(0);
  const beadX = useTransform(t, (k) => {
    const ends = lineEnds(plate, card, side);
    return ends.nodeX + (ends.plateX - ends.nodeX) * k;
  });
  const beadOpacity = useTransform([t, show], ([k, s]: number[]) => s * Math.sin(Math.PI * k));
  const { plateX, nodeX } = lineEnds(plate, card, side);

  useEffect(() => {
    if (!active) return;
    const controls = animate(t, [0, 1], {
      duration: STAGE_CARDS.beadSeconds,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 1.4,
      delay: 0.5 + index * 0.25,
    });
    return () => {
      controls.stop();
      t.set(0);
    };
  }, [active, index, t]);

  return (
    <m.svg aria-hidden viewBox={`0 0 ${ARTBOARD} ${ARTBOARD}`} style={{ opacity: show }} className={className}>
      <line x1={plateX} x2={nodeX} y1={y} y2={y} stroke="#CAD0CB" strokeWidth="1" />
      <m.line x1={plateX} x2={nodeX} y1={y} y2={y} stroke={ACCENT} strokeWidth="1.2" initial={false} animate={{ opacity: lit ? 0.9 : 0 }} transition={{ duration: 0.25 }} />
      <circle cx={plateX} cy={y} r="2.6" fill="#9FA7A1" />
      <m.circle cx={nodeX} cy={y} r={main ? 10 : 8} fill={ACCENT} initial={false} animate={{ opacity: lit || main ? 0.22 : 0.12 }} transition={{ duration: 0.25 }} />
      <circle cx={nodeX} cy={y} r="3.6" fill={ACCENT} />
      <m.circle cx={beadX} cy={y} r="2.6" fill={ACCENT} style={{ opacity: beadOpacity }} />
    </m.svg>
  );
};

const StageConnectors = ({ progress, active, hovered }: { progress: MotionValue<number>; active: boolean; hovered: number | null }) => (
  <div className="pointer-events-none absolute inset-0 hidden md:block">
    {STAGES.map((stage, i) => {
      const { edge, width } = STAGE_CARDS[stage.side];
      const cardEdge = stage.side === "left" ? (edge + width) * 10 : (100 - edge - width) * 10;
      return (
        <StageConnector
          key={stage.title}
          plate={tipX(i, stage.side)}
          card={cardEdge}
          y={cornerY(i)}
          side={stage.side}
          index={i}
          main={!!stage.main}
          lit={hovered === i}
          active={active}
          progress={progress}
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        />
      );
    })}
  </div>
);

const StageList = ({ reduce }: { reduce: boolean }) => (
  <m.ul
    initial={reduce ? false : { opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
    aria-label="Come funziona un sistema AI di Edilizia.io"
    className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 text-[13px] sm:grid-cols-2 md:hidden"
  >
    {STAGES.map((stage, i) => (
      <li key={stage.title} className="n3-stage-card px-[1.05em] py-[0.95em]">
        <StageCardBody index={i} />
      </li>
    ))}
  </m.ul>
);

/* ───────────────────────────── visual del nucleo ───────────────────────────── */

const subscribeToVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};
const isPageVisible = () => !document.hidden;
const isPageVisibleOnServer = () => true;

const ParallaxLayer = ({ x, y, reach, children }: { x: MotionValue<number>; y: MotionValue<number>; reach: number; children: ReactNode }) => {
  const tx = useTransform(x, (v) => v * reach);
  const ty = useTransform(y, (v) => v * reach);
  return (
    <m.div style={{ x: tx, y: ty }} className="pointer-events-none absolute inset-0">
      {children}
    </m.div>
  );
};

const Tilted = ({ rotateX, rotateY, children }: { rotateX: MotionValue<number>; rotateY: MotionValue<number>; children: ReactNode }) => (
  <div className="pointer-events-none absolute inset-0 [perspective:1400px]">
    <m.div style={{ rotateX, rotateY }} className="absolute inset-0">
      <div className="n3-float absolute inset-0">{children}</div>
    </m.div>
  </div>
);

const CoreVisual = () => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const pointerType = useRef("mouse");
  const visualRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const onScreen = useInView(visualRef, { margin: "40px" });
  const pageVisible = useSyncExternalStore(subscribeToVisibility, isPageVisible, isPageVisibleOnServer);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(px, { stiffness: 55, damping: 18, mass: 0.9 });
  const y = useSpring(py, { stiffness: 55, damping: 18, mass: 0.9 });
  const rotateY = useTransform(x, (v) => v * MOTION.tiltDegrees);

  const target = useMotionValue(0);
  const progress = useSpring(target, reduce ? { duration: 0.01 } : EXPLODE.spring);
  const rotateX = useTransform([y, progress], ([v, p]: number[]) => v * -MOTION.tiltDegrees + p * 4);
  const restOpacity = useTransform(progress, [0, 0.04], [1, 0]);
  const explodedOpacity = useTransform(progress, [0, 0.03], [0, 1]);
  const shadowOpacity = useTransform(progress, [0, 1], [1, 0.55]);
  const orbitOpacity = useTransform(progress, [0, 0.6], [1, MOTION.orbitOpenOpacity]);
  const hintOpacity = useTransform(progress, [0, 0.25], [1, 0]);

  const beadsPaused = open || !onScreen || !pageVisible;

  useEffect(() => {
    target.set(open ? 1 : 0);
  }, [open, target]);

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - box.left) / box.width - 0.5) * 2);
    py.set(((e.clientY - box.top) / box.height - 0.5) * 2);
  };

  const handlePointerLeave = () => {
    px.set(0);
    py.set(0);
    setOpen(false);
  };

  const handleCardHover = (index: number | null) => {
    setHovered(index);
    if (index !== null && !reduce) setOpen(true);
  };

  // Il mouse apre il nucleo al passaggio; tocco e tastiera non hanno hover e lo aprono/chiudono al click.
  const handleCoreClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0 || pointerType.current !== "mouse") setOpen((v) => !v);
  };

  return (
    <LazyMotion features={domAnimation}>
      <>
        <div
          ref={visualRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="n3-enter n3-visual relative -my-[6%] -ml-[12.5%] aspect-square w-[125%] max-w-none md:mx-auto md:my-0 md:w-full md:max-w-[840px] lg:mx-0 lg:w-[104%] lg:max-w-none"
        >
          <div className="absolute inset-0">
            <div aria-hidden className="n3-halo pointer-events-none absolute inset-[6%]" />
            <div className="n3-fade-edge absolute inset-0">
              <ParallaxLayer x={x} y={y} reach={-MOTION.backdropParallax}>
                <DepthBackdrop className="absolute inset-0 size-full overflow-visible" />
                <TechnicalBackdrop className="absolute inset-0 size-full overflow-visible" />
              </ParallaxLayer>
            </div>
            <ParallaxLayer x={x} y={y} reach={MOTION.ringParallax}>
              <m.div style={{ opacity: orbitOpacity }} className="absolute inset-0">
                <OrbitalSystem className="absolute inset-0 size-full overflow-visible" />
                <Particles half="back" animate={!reduce} paused={beadsPaused} className="absolute inset-0 size-full overflow-visible" />
              </m.div>
            </ParallaxLayer>
            <m.div style={{ opacity: shadowOpacity }} className="absolute inset-0">
              <CoreShadow className="pointer-events-none absolute inset-0 size-full overflow-visible" />
            </m.div>
            <Tilted rotateX={rotateX} rotateY={rotateY}>
              <m.div style={{ opacity: restOpacity }} className="absolute inset-0">
                <CoreObject className="absolute inset-0 size-full overflow-visible" />
              </m.div>
              <m.div style={{ opacity: explodedOpacity }} className="absolute inset-0">
                <ExplodedCore progress={progress} className="absolute inset-0 size-full overflow-visible" />
              </m.div>
              <StageConnectors progress={progress} active={open && !reduce} hovered={hovered} />
            </Tilted>
            <ParallaxLayer x={x} y={y} reach={MOTION.ringParallax}>
              <m.div style={{ opacity: orbitOpacity }} className="absolute inset-0">
                <Particles half="front" animate={!reduce} paused={beadsPaused} className="absolute inset-0 size-full overflow-visible" />
              </m.div>
            </ParallaxLayer>
            <Tilted rotateX={rotateX} rotateY={rotateY}>
              <StageCards progress={progress} open={open} hovered={hovered} onHover={handleCardHover} />
            </Tilted>
          </div>

          <m.p
            aria-hidden
            style={{ opacity: hintOpacity }}
            className="pointer-events-none absolute left-1/2 top-[84%] m-0 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap text-[12.5px] text-[color:var(--color-n3-grey)]"
          >
            <MousePointer2 className="size-3.5 text-[color:var(--color-n3-accent)]" strokeWidth={1.8} />
            <span className="[@media(hover:none)]:hidden">Passa sopra per vedere come funziona</span>
            <span className="hidden [@media(hover:none)]:inline">Tocca per vedere come funziona</span>
          </m.p>

          <button
            type="button"
            aria-expanded={open}
            aria-label="Mostra come funziona un sistema AI di Edilizia.io"
            onPointerDown={(e) => {
              pointerType.current = e.pointerType;
            }}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse" && !reduce) setOpen(true);
            }}
            onClick={handleCoreClick}
            onBlur={() => setOpen(false)}
            className="absolute left-[22%] top-[30%] h-[44%] w-[56%] cursor-default rounded-[3rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--color-n3-accent)]"
          />
        </div>
        <StageList reduce={reduce} />
      </>
    </LazyMotion>
  );
};

/* ───────────────────────────── testo della hero ───────────────────────────── */

const FlipLabel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className="n3-flip-box">
    <span className={cn("n3-flip-face", className)}>{children}</span>
    <span aria-hidden className={cn("n3-flip-face n3-flip-back", className)}>
      {children}
    </span>
  </span>
);

const METRICS = [
  { value: "7 giorni", label: "per il primo sistema attivo", Icon: Rocket },
  { value: "24/7", label: "agenti sempre operativi", Icon: Clock },
  { value: "30 giorni", label: "di garanzia sui risultati", Icon: ShieldCheck },
];

const rise = (delay: number) => ({ style: { animationDelay: `${delay}s` } });

const HeroCopy = () => (
  <div className="flex flex-col justify-center">
    <p {...rise(0.1)} className="n3-rise flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-n3-grey)]">
      <span aria-hidden className="n3-dot size-2 rounded-full bg-[color:var(--color-n3-accent)]" />
      Intelligenza artificiale per l'edilizia
    </p>

    <h1 id="n3-title" {...rise(0.18)} className="n3-rise n3-h1 mt-6 font-bold text-[color:var(--color-n3-ink)]">
      <span className="block">Sistemi AI su misura</span>
      <span className="block">per imprese edili,</span>
      <span className="block">
        progettisti e <span className="text-[color:var(--color-n3-accent-deep)]">studi tecnici.</span>
      </span>
    </h1>

    <p {...rise(0.3)} className="n3-rise mt-6 max-w-[34rem] text-[17px] leading-[1.6] text-[color:var(--color-n3-grey)] lg:text-[18px]">
      Progettiamo, sviluppiamo e integriamo l'intelligenza artificiale nei processi di ufficio e di cantiere: agenti vocali,
      preventivi automatici, analisi di documenti e capitolati. E ti affianchiamo con la consulenza per scegliere dove l'AI rende davvero.
    </p>

    <div {...rise(0.4)} className="n3-rise mt-8 flex flex-wrap items-center gap-3">
      <a
        href="#cta-finale"
        className="n3-flip inline-flex h-[3.25rem] items-center rounded-full bg-[color:var(--color-n3-accent-deep)] px-7 text-[16px] font-semibold text-white shadow-button-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-n3-ink)] sm:h-14"
      >
        <FlipLabel className="gap-2.5">
          Prenota una consulenza
          <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
        </FlipLabel>
      </a>
      <Link
        to="/servizi"
        className="n3-flip inline-flex h-[3.25rem] items-center rounded-full border border-[color:var(--color-n3-line)] bg-white/60 px-6 text-[16px] font-medium text-[color:var(--color-n3-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-n3-accent)] sm:h-14"
      >
        <FlipLabel className="gap-2.5">
          <Sparkles className="size-4 text-[color:var(--color-n3-accent-deep)]" strokeWidth={1.8} aria-hidden />
          Scopri i servizi
        </FlipLabel>
      </Link>
    </div>

    <dl {...rise(0.58)} className="n3-rise mt-10 grid grid-cols-3 sm:flex sm:items-stretch lg:mt-14">
      {METRICS.map(({ value, label, Icon }, i) => (
        <div
          key={label}
          className={cn(
            "flex flex-col items-start gap-2 pr-3 sm:flex-row sm:items-center sm:gap-3 sm:pr-7",
            i > 0 && "border-l border-[color:var(--color-n3-line)] pl-4 sm:pl-7",
          )}
        >
          <Icon className="size-7 shrink-0 text-[color:var(--color-n3-accent-deep)]" strokeWidth={1.4} aria-hidden />
          <div>
            <dd className="text-[14px] font-semibold leading-5 text-[color:var(--color-n3-ink)]">{value}</dd>
            <dt className="text-[12.5px] leading-5 text-[color:var(--color-n3-grey)]">{label}</dt>
          </div>
        </div>
      ))}
    </dl>
  </div>
);

/* ───────────────────────────── pavimento a griglia ───────────────────────────── */

const CELL = { w: 84, h: 48 };

const FloorGrid = ({ id, stroke = "#CFD5D0", strokeWidth = 0.8, ...props }: SVGProps<SVGSVGElement> & { id: string; stroke?: string; strokeWidth?: number }) => (
  <svg aria-hidden width="100%" height="100%" {...props}>
    <defs>
      <pattern id={id} width={CELL.w} height={CELL.h} patternUnits="userSpaceOnUse">
        <path
          d={`M0 ${CELL.h / 2}L${CELL.w / 2} 0L${CELL.w} ${CELL.h / 2}M0 ${CELL.h / 2}L${CELL.w / 2} ${CELL.h}L${CELL.w} ${CELL.h / 2}`}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`} />
  </svg>
);

const SPOT = 340;

/** La griglia del pavimento, più una copia verde vista da una "torcia" che segue il cursore. */
const HeroFloor = () => {
  const ref = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const litRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/[^\w-]/g, "");

  useEffect(() => {
    const el = ref.current;
    const spot = spotRef.current;
    const lit = litRef.current;
    const section = el?.parentElement;
    if (!el || !spot || !lit || !section) return;

    const resize = new ResizeObserver(([entry]) => {
      lit.style.width = `${entry.contentRect.width}px`;
      lit.style.height = `${entry.contentRect.height}px`;
    });
    resize.observe(section);

    let frame = 0;
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = section.getBoundingClientRect();
        const x = e.clientX - box.left - SPOT / 2;
        const y = e.clientY - box.top - SPOT / 2;
        spot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        lit.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
        el.dataset.spot = "on";
      });
    };
    const handlePointerLeave = () => {
      cancelAnimationFrame(frame);
      el.dataset.spot = "off";
    };
    section.addEventListener("pointermove", handlePointerMove);
    section.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      section.removeEventListener("pointermove", handlePointerMove);
      section.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden data-spot="off" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <FloorGrid id={`n3-floor-${uid}`} className="n3-floor absolute inset-0" />
      <div ref={spotRef} style={{ width: SPOT, height: SPOT }} className="n3-floor-spot">
        <div ref={litRef} className="n3-floor-lit">
          <FloorGrid id={`n3-floor-lit-${uid}`} stroke={ACCENT} strokeWidth={1} className="block size-full" />
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────────── export ───────────────────────────── */

const motionVars = {
  "--n3-float": MOTION.floatDistance,
  "--n3-float-seconds": `${MOTION.floatSeconds}s`,
} as CSSProperties;

const SyntraHero = () => (
  <>
    <style dangerouslySetInnerHTML={{ __html: BLOCK_CSS }} />
    <div style={motionVars} className="n3-root n3-bg w-full font-[family-name:var(--font-n3-sans)] text-[color:var(--color-n3-ink)] antialiased">
      <section id="top" aria-labelledby="n3-title" className="n3-hero relative isolate overflow-x-clip">
        <HeroFloor />
        <div className="n3-frame mx-auto grid max-w-[90rem] items-center gap-6 pb-12 pt-6 lg:min-h-[inherit] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12 lg:py-10 xl:gap-16">
          <HeroCopy />
          <CoreVisual />
        </div>
      </section>
    </div>
  </>
);

export default SyntraHero;
