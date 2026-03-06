

# Pagina Soluzioni — `/soluzioni`

New page with 20 AI solutions for the construction sector, filterable by category, with detail modals.

## Files to Create

### 1. `src/data/solutions.ts`
Static data array of 20 solutions with fields: `id`, `settore`, `icon`, `title`, `description`, `bullets`, `roiChip`, `tipoAI`, plus extended modal content (`fullDescription`, `howItWorks` steps, `roiMetrics`, `idealFor`, `integrations`). Also export `settoreConfig` mapping each sector to its colors.

### 2. `src/components/solutions/SolutionCard.tsx`
Card component rendering header (colored bg, sector badge, number badge, icon, title), body (description with line-clamp-3, divider, 3 bullets, ROI chip), footer (AI type tag, "Scopri di più" link). Colors driven by `settoreConfig[settore]`.

### 3. `src/components/solutions/FilterBar.tsx`
Sticky filter bar (top: 68px under navbar). 5 pill buttons (Tutte + 4 sectors with emojis). Active state uses sector color. Counter "Mostrando X di 20". Horizontal scroll on mobile.

### 4. `src/components/solutions/SolutionModal.tsx`
Framer Motion modal with backdrop blur. Shows expanded solution: full description, "Come Funziona" 3 steps, ROI metrics, ideal customer profile, integrations list, CTA button. Close on backdrop/X/Escape. Body scroll lock.

### 5. `src/components/solutions/SolutionsHero.tsx`
Dark hero (bg neutral-900) with grid pattern, badge, staggered H1, subtitle, 4 stat pills with counter animation, scroll indicator chevron.

### 6. `src/components/solutions/AIComparison.tsx`
Dark section comparing Agente Vocale vs Agente AI Operativo — two cards side by side with a small green "combined" card between them on desktop.

### 7. `src/components/solutions/ImplementationSteps.tsx`
4 implementation steps in alternating left/right Z-layout on desktop, vertical on mobile. Numbered backgrounds, green left border.

### 8. `src/components/solutions/SolutionsFAQ.tsx`
8 FAQ items as Framer Motion accordion. White cards, chevron rotation, green left border when open.

### 9. `src/components/solutions/SolutionsCTA.tsx`
Dark CTA section with form (identical pattern to FinalCTA), curtain reveal animation, scarcity badge, form with 4 inputs + dropdown.

### 10. `src/pages/Solutions.tsx`
Main page component. Manages `filterActive` state (initialized from URL hash) and `modalOpen` state. Composes: Navbar (with active "Soluzioni" link) → SolutionsHero → FilterBar → AnimatePresence grid of SolutionCards → AIComparison → ImplementationSteps → SolutionsFAQ → SolutionsCTA → Footer.

## Files to Modify

### 11. `src/App.tsx`
Add route: `<Route path="/soluzioni" element={<Solutions />} />`.

### 12. `src/components/sections/Navbar.tsx`
- Update to use `react-router-dom` `Link` and `useLocation`
- Add "Soluzioni" to nav links pointing to `/soluzioni`
- Highlight active link when on `/soluzioni` (green text + fixed underline)
- Logo links to `/` via `Link`

### 13. `tailwind.config.ts`
Add sector colors under `colors.settore`: `infissi`, `infissi-bg`, `fotovoltaico`, `fotovoltaico-bg`, `ristr`, `ristr-bg`, `edilizia`, `edilizia-bg`.

## Key Technical Details

- **Filtering**: `useState` in Solutions page, filter array by `settore`. `AnimatePresence` + `layout` prop on motion.div wrappers for smooth grid reflow.
- **Modal**: `AnimatePresence`, body overflow lock via `useEffect`, focus trap, Escape key listener.
- **URL hash**: Read `window.location.hash` on mount to set initial filter (e.g., `#fotovoltaico` → filter fotovoltaico).
- **Navbar**: Must work on both `/` (anchor links) and `/soluzioni` (router links). Use conditional logic based on `useLocation().pathname`.
- **Reuse**: Same Navbar/Footer components, same AnimatedBadge, CounterStat, ScrollProgress, CustomCursor.

