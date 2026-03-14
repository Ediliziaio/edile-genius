

# Performance Optimization: Lazy Loading Images + Aggressive Code Splitting

## Current Issues

1. **No lazy loading on render images** — Gallery grids (`RenderGallery`, `RenderHub`, all `*Hub` pages) load all images eagerly. On mobile with 20+ renders, this causes significant bandwidth waste and slow initial paint.

2. **Index.tsx eagerly imports 16 section components** — The landing page bundles everything into one chunk (~200KB+). On mobile 3G, this delays first meaningful paint.

3. **Vite has no `manualChunks` config** — All vendor deps ship in a single chunk. Heavy libraries like `recharts`, `@tanstack/react-query`, `date-fns`, `lucide-react` could be split.

4. **No `<img loading="lazy">` on any Supabase-hosted render image** — Only blog images have `loading="lazy"`.

5. **No native image optimization** — Render result images are full-resolution JPEGs/PNGs served directly from Supabase Storage without size hints (`width`/`height`) causing layout shift.

---

## Implementation Plan

### 1. Create `LazyImage` component
New file: `src/components/ui/lazy-image.tsx`
- Wraps `<img>` with `loading="lazy"`, `decoding="async"`
- Accepts optional `blurhash` or shows a skeleton placeholder via IntersectionObserver
- Adds `width`/`height` attributes for CLS prevention
- Supports `aspect-ratio` prop for consistent sizing

### 2. Apply `loading="lazy"` across all render galleries
Files to update (add `loading="lazy" decoding="async"` to all `<img>` tags showing Supabase render URLs):
- `src/pages/app/RenderGallery.tsx` (line 148)
- `src/pages/app/RenderHub.tsx` (line 106)
- `src/pages/app/RenderBagnoHub.tsx` (gallery images)
- `src/pages/app/RenderFacciataHub.tsx` (line 196)
- `src/pages/app/RenderPersianeHub.tsx` (line 133)
- `src/pages/app/RenderPavimentoHub.tsx` (gallery images)
- `src/pages/app/RenderStanzaHub.tsx` (gallery images)
- `src/pages/app/RenderTettoHub.tsx` (gallery images)
- `src/modules/render-stanza/components/RenderStanzaResultCard.tsx` (line 72)
- `src/modules/render-tetto/components/RenderTettoResultCard.tsx` (result image)

### 3. Lazy-load Index.tsx sections (landing page)
Convert `Index.tsx` from eagerly importing 16 components to lazy-loading below-the-fold sections:
- Keep eager: `Navbar`, `Hero`, `AnnouncementBar`, `StickyMobileCTA` (above fold)
- Lazy-load: `LogoBar`, `PainSection`, `SolutionSection`, `UseCasesGrid`, `ROISection`, `CostCalculator`, `HowItWorks`, `Results`, `WhyUs`, `WhyDifferent`, `Pricing`, `Guarantee`, `FinalCTA`, `Footer`

### 4. Vite `manualChunks` for vendor splitting
Update `vite.config.ts` to split:
- `vendor-react`: react, react-dom, react-router-dom
- `vendor-ui`: radix-ui packages, tailwind-merge, class-variance-authority
- `vendor-charts`: recharts
- `vendor-supabase`: @supabase/*
- `vendor-date`: date-fns

### 5. Preload critical app shell chunks
Add `<link rel="modulepreload">` for the vendor-react chunk in `index.html` to speed up hydration on mobile.

---

### Files to create
- `src/components/ui/lazy-image.tsx`

### Files to modify
- `vite.config.ts` — manualChunks
- `src/pages/Index.tsx` — lazy sections
- `src/pages/app/RenderGallery.tsx`
- `src/pages/app/RenderHub.tsx`
- `src/pages/app/RenderBagnoHub.tsx`
- `src/pages/app/RenderFacciataHub.tsx`
- `src/pages/app/RenderPersianeHub.tsx`
- `src/pages/app/RenderPavimentoHub.tsx`
- `src/pages/app/RenderStanzaHub.tsx`
- `src/pages/app/RenderTettoHub.tsx`
- `src/modules/render-stanza/components/RenderStanzaResultCard.tsx`
- `src/modules/render-tetto/components/RenderTettoResultCard.tsx`

