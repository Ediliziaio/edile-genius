

# Fix Header, Logo, Guarantee & Setup Banner

## 4 Changes

### 1. Header: Replace `OfferHeader` with section nav links IN the header
Currently: simple header with logo text + CTA button, then a SEPARATE `OfferSectionNav` bar below.
Fix: Merge them — the header itself contains the logo (matching homepage style) + section anchor links + CTA. Remove the separate `OfferSectionNav` component below.

The homepage logo uses:
```
edilizia<span class="text-primary">.io</span>
+ sub-badge "AI per l'Edilizia"
```

The offer pages currently just show plain text "Edilizia.io". Will match the homepage logo exactly.

### 2. Logo: Match homepage Navbar logo
Replace the plain `<Link>` text in `OfferHeader` with the exact same markup from `Navbar.tsx` (lines 82-89): `font-display text-[22px] font-extrabold` + the `font-mono` sub-badge.

### 3. Guarantee Section: Make it stronger
Current `OfferGuarantee` is a small subtle box. Upgrade to match the homepage `Guarantee` component style:
- Larger shield icon (120px circle with 🛡️ emoji, rotateY animation on view)
- Bigger headline "GARANZIA RIMBORSO 30 GIORNI" with green accent
- Bolder text, more dramatic box-shadow with green glow
- Scale-in animation on scroll

### 4. Setup Free Banner: Make it more impactful
Current `SetupFreeBanner` is a small quiet box. Upgrade to:
- Larger, with pulsing green border animation
- Bigger "GRATIS" text
- Add countdown digits inline
- More dramatic gradient background
- Gift emoji animated

## Files to modify

**`src/components/offerta/shared.tsx`:**
- Rewrite `OfferHeader` to include nav links prop + homepage-matching logo + integrated section nav
- Remove `OfferSectionNav` as separate component (merge into header)
- Rewrite `OfferGuarantee` with homepage-style large shield, rotateY animation, dramatic shadow
- Rewrite `SetupFreeBanner` with pulsing border, larger text, animated gradient

**`src/pages/offerta/AgentiVocale.tsx`:**
- Pass `navLinks` to `OfferHeader` instead of rendering `OfferSectionNav` separately
- Remove `<OfferSectionNav>` line

**`src/pages/offerta/RenderAI.tsx`:** Same changes

**`src/pages/offerta/PreventivatoreAI.tsx`:** Same changes

**`src/pages/offerta/PacchettoCompleto.tsx`:** Same changes

