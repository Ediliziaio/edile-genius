

# UX Improvement Plan for the 4 Offerta Pages

## Current Issues
All 4 pages are functional but visually flat compared to the homepage. They lack:
- Background decorative elements (blobs, gradients, grid patterns)
- Staggered animations (currently only simple fade-in)
- Animated counters for stats
- Logo bar / social proof
- Visual hierarchy improvements (the homepage uses `AnimatedBadge`, `CounterStat`, `FloatingCard`)
- Hover effects on cards
- Better spacing and visual breathing room
- The hero sections feel text-heavy without visual elements

## Plan

### 1. Create shared helper module `src/components/offerta/shared.tsx`
Extract and enhance the duplicated code across all 4 pages into shared components:
- `OfferHeader` — simplified sticky header with logo + CTA + optional progress bar
- `OfferHero` — hero with decorative background blob/grid pattern (like homepage Hero), staggered framer-motion animations, and `AnimatedBadge` instead of plain `Badge`
- `OfferCountdown` — enhanced countdown with larger digit boxes, pulsing animation
- `OfferGuarantee` — green guarantee box with shield icon and subtle glow
- `OfferCTABanner` — dark CTA section with gradient overlay and animated background
- `AnimatedSection` — enhanced version with staggered children support
- `useCountdown` hook — extracted once, parameterized by key
- `StatCounter` — mini stat cards with animated number counting (reuse `CounterStat` pattern)

### 2. Visual enhancements applied to ALL 4 pages

**Background & Decoration:**
- Add subtle CSS grid/dot pattern behind hero sections (same as homepage)
- Add gradient blobs (green blur) behind key sections
- Remove plain `<Separator />` dividers, use gradient fades instead

**Animations:**
- Hero: staggered container animation (like homepage `container`/`item` variants) instead of single fade
- Cards: hover scale + shadow-card-green transition (like WhyUs cards)
- Pricing cards: hover lift effect with `hover:-translate-y-1`
- Stats: use `CounterStat` for numeric KPIs in case study sections
- FAQ accordion: smoother open/close

**Typography & Spacing:**
- Use `font-display` class consistently
- Use `AnimatedBadge` component (verde variant) instead of plain shadcn `Badge`
- Increase section padding for breathing room

**Social Proof:**
- Add LogoBar component (already exists) after hero on each page
- Add star ratings next to testimonial quotes

**Cards & Components:**
- Pricing cards: add gradient top border (`border-t-4 border-t-primary`) like SolutionSection
- Feature cards: add icon backgrounds with `bg-primary/10 rounded-full` circles
- Guarantee box: add subtle green glow shadow

### 3. Page-specific improvements

**AgentiVocale.tsx:**
- Hero: add WaveformVisualizer or FloatingCard elements on the right side (like homepage)
- Problem section: animate cards with stagger
- Case study: use CounterStat for "+72%" and "-88%"

**RenderAI.tsx:**
- Before/After placeholders: make them taller, add gradient backgrounds instead of dashed borders, add a "slide" visual metaphor with an arrow between PRIMA/DOPO
- Problem section (Senza/Con): add subtle icons to each bullet, increase card height balance

**PreventivatoreAI.tsx:**
- Comparison table: highlight the Edilizia.io column with green background
- Feature grid: add hover glow effect on cards
- Steps: add connecting line between steps (like homepage HowItWorks)

**PacchettoCompleto.tsx:**
- Confronto Killer: add animated savings counter, pulse effect on the savings box
- Workflow scenarios: add numbered circles and connecting vertical line (timeline style)
- Testimonials: add avatar placeholder circles

### 4. Files to modify
- **Create:** `src/components/offerta/shared.tsx` — shared components
- **Rewrite:** `src/pages/offerta/AgentiVocale.tsx`
- **Rewrite:** `src/pages/offerta/RenderAI.tsx`
- **Rewrite:** `src/pages/offerta/PreventivatoreAI.tsx`
- **Rewrite:** `src/pages/offerta/PacchettoCompleto.tsx`

All content/copy stays identical. Only the presentation layer changes.

