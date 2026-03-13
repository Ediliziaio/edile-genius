

# Confronto Varianti — UI Comparison Module

## Overview
Build a variant comparison system: configure 2-3 color/style variants, generate them sequentially via the existing `generate-room-render` edge function, then compare side-by-side with selection and save capabilities.

## Architecture

The user provided detailed specs for 4 components + 1 hook. The hook `useVariantiGenerator` is referenced but not provided — I'll create it. No new DB table needed initially; variants are ephemeral (stored in state), and only the selected preferred variant gets saved to the existing `render_stanza_gallery`.

```text
VariantiModal (portal)
├── step=config  → VariantiConfigurator
└── step=comparison → VariantiComparison
                        ├── GridView (2-3 cards)
                        └── FocusView (swipe/arrows)

useVariantiGenerator (hook)
└── Calls generate-room-render N times sequentially
└── Uploads results, tracks progress
```

## Implementation Plan

### 1. Create `src/hooks/useVariantiGenerator.ts`
- Types: `VarianteConfig { nome, colore_hex, modifica_principale, prompt_extra }`, `VarianteResult { nome, result_url, variante_index }`
- State: `generating`, `results`, `currentVariante`
- `generateVariants()`: loops through configs, appends `prompt_extra` to `basePrompt`, calls `generate-room-render` for each, collects URLs
- `setVariantePreferita()`: saves selected variant to `render_stanza_gallery`

### 2. Create `src/components/varianti/VariantiConfigurator.tsx`
- Form with 2 preset variants (green sage / warm grey)
- Quick color palette (10 colors) auto-generates prompt
- Add/remove third variant
- Progress bar during sequential generation
- Per the user's spec

### 3. Create `src/components/varianti/VariantiComparison.tsx`
- Grid view: 2-3 cards side-by-side with before/after toggle per card
- Focus view: single large image with arrow nav + touch swipe
- Thumbnail strip, select preferred, download individual variant
- Per the user's spec (fixing JSX — the provided code has stripped HTML tags)

### 4. Create `src/components/varianti/VariantiModal.tsx`
- Portal-based modal wrapping Configurator → Comparison flow
- Per the user's spec

### 5. Integrate in `RenderStanzaNew.tsx` Step 5
- Add `showVarianti` state + `imageBase64` state (captured during upload via FileReader)
- Add "Genera varianti di confronto" button after before/after toggle
- Render `VariantiModal` when active
- Pass existing prompt builder output as `basePrompt`

### Key decisions
- **No new DB table**: variants are transient; only the chosen one is saved to existing gallery
- **No new edge function**: reuses `generate-room-render` with modified prompts (base prompt + variant-specific color/instruction overlay)
- **Sequential generation**: one variant at a time to avoid rate limits, with progress indicator
- The provided JSX has stripped HTML (missing div/className attributes) — I'll reconstruct the complete JSX following the described behavior and Tailwind styling patterns

### Files to create/edit
- **Create**: `src/hooks/useVariantiGenerator.ts`
- **Create**: `src/components/varianti/VariantiConfigurator.tsx`
- **Create**: `src/components/varianti/VariantiComparison.tsx`
- **Create**: `src/components/varianti/VariantiModal.tsx`
- **Edit**: `src/pages/app/RenderStanzaNew.tsx` — add imageBase64 capture + varianti button/modal in Step 5

