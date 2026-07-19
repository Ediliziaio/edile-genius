import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Prerenderizziamo SOLO le pagine pubbliche indicizzabili.
// Le rotte auth/app/superadmin/offerte restano client-only (SPA fallback).
const PUBLIC_PREFIXES = [
  "/soluzioni",
  "/per-chi-e",
  "/chi-siamo",
  "/come-funziona",
  "/garanzia",
  "/tariffe",
  "/blog",
  "/privacy-policy",
  "/cookie-policy",
  "/termini-di-servizio",
];

// manualChunks applicato SOLO al build client: nel bundle SSR react/react-dom
// sono external e non possono finire in un manualChunk (rollup error).
const clientManualChunks = {
  "vendor-react": ["react", "react-dom", "react-router-dom"],
  "vendor-ui": [
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-tabs",
    "@radix-ui/react-tooltip",
    "@radix-ui/react-popover",
    "@radix-ui/react-select",
    "class-variance-authority",
    "tailwind-merge",
    "clsx",
  ],
  "vendor-supabase": ["@supabase/supabase-js"],
  "vendor-charts": ["recharts"],
  "vendor-date": ["date-fns"],
};

// https://vitejs.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  ssgOptions: {
    script: "async",
    includedRoutes(paths: string[]) {
      // Pagine flat pubbliche (sempre incluse esplicitamente) + rotte dinamiche
      // (/per-chi-e/<slug>, /blog/<slug>) scoperte via getStaticPaths.
      const flat = [
        "/",
        "/soluzioni",
        "/per-chi-e",
        "/chi-siamo",
        "/come-funziona",
        "/garanzia",
        "/tariffe",
        "/blog",
        "/privacy-policy",
        "/cookie-policy",
        "/termini-di-servizio",
      ];
      const dynamic = paths.filter(
        (p) => p.startsWith("/per-chi-e/") || p.startsWith("/blog/"),
      );
      return Array.from(new Set([...flat, ...dynamic]));
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: isSsrBuild ? {} : { manualChunks: clientManualChunks },
    },
  },
}));
