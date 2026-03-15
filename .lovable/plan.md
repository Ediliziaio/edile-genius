

# Section Nav + Setup Gratis Offer

## Changes needed

### 1. Add `OfferSectionNav` to `shared.tsx`
A horizontal sticky nav bar (below the header) with anchor links to page sections. On mobile: horizontally scrollable. Uses smooth scroll. Highlights active section via IntersectionObserver.

### 2. Add "Setup GRATIS entro 7 giorni" to each page

**Fixed setup costs per system:**
- Agente Vocale: **€997**
- Render AI: **€197**
- Preventivatore AI: **€297**
- Pacchetto Completo: Essenziale €497, Crescita €997, Dominio €1.497

Each pricing card shows the setup cost with a strikethrough and "GRATIS" badge if within 7 days. Add a prominent banner in the hero/pricing sections highlighting the free setup offer.

### 3. Files to modify

**`src/components/offerta/shared.tsx`:**
- Add `OfferSectionNav` component (sticky bar with section links)
- Update `PricingCard` to support `setupFree` prop showing strikethrough + "GRATIS" badge
- Add `SetupFreeBanner` component (green banner highlighting free setup offer)

**`src/pages/offerta/AgentiVocale.tsx`:**
- Add section IDs to each AnimatedSection
- Add `OfferSectionNav` with links: Soluzione, Come Funziona, Caso Studio, Prezzi, FAQ, Garanzia
- Set fixed setup to "€997" on all plans, with strikethrough + GRATIS

**`src/pages/offerta/RenderAI.tsx`:**
- Same pattern, nav links: Before/After, Il Problema, Come Funziona, Caso Studio, Prezzi, FAQ
- Fixed setup: €197

**`src/pages/offerta/PreventivatoreAI.tsx`:**
- Nav links: Il Problema, Soluzione, Come Funziona, Confronto, Caso Studio, Prezzi, FAQ
- Fixed setup: €297

**`src/pages/offerta/PacchettoCompleto.tsx`:**
- Nav links: Confronto, Integrazione, Pacchetti, Testimonianze, FAQ, Garanzia
- Setup per plan: €497 / €997 / €1.497 (already correct, add GRATIS)

