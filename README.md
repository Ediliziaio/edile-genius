# Edilizia.io

Piattaforma AI verticale per il settore edile italiano: Agenti Vocali AI 24/7, Render AI, Preventivatore AI e CRM per serramentisti, installatori fotovoltaico e imprese di ristrutturazione.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Edge Functions)
- **SEO/GEO:** prerender statico delle pagine pubbliche via `vite-react-ssg`

## Sviluppo locale

Requisiti: [Bun](https://bun.sh) (o Node.js 18+ con npm).

```sh
# 1. Installa le dipendenze
bun install

# 2. Avvia il dev server (con prerender in dev)
bun run dev

# 3. Build di produzione (pre-renderizza le pagine pubbliche)
bun run build

# Anteprima del build
bun run preview
```

Le variabili d'ambiente pubbliche stanno in `.env` (prefisso `VITE_`).

## Script

| Comando | Descrizione |
|---|---|
| `bun run dev` | Dev server (vite-react-ssg) |
| `bun run build` | Build + prerender delle rotte pubbliche |
| `bun run build:spa` | Build SPA classico (senza prerender) |
| `bun run lint` | ESLint |
| `bun run test` | Test (vitest) |

## Struttura

- `src/pages/` — pagine pubbliche (marketing), `app/` (gestionale), `superadmin/`
- `src/components/` — componenti UI e sezioni
- `src/hooks/usePageSEO.ts` — gestione meta/SEO per-pagina
- `supabase/functions/` — Edge Functions (AI, telefonia, render, ecc.)
