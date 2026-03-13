

# Ottimizzazione Mobile Area Azienda + Render Modules

L'obiettivo e preparare l'intera area `/app` per un'esperienza mobile-first, con focus speciale sui moduli Render (usati in cantiere su telefono) e predisposizione per una futura app nativa iOS/Android via Capacitor.

---

## Problemi identificati

### Shell & Navigation
1. **Topbar troppo sparsa su mobile** — il lato sinistro ha solo il hamburger menu, spreca spazio. Manca il titolo pagina su mobile.
2. **Breadcrumb occupa spazio prezioso su mobile** — andrebbe nascosto su schermi piccoli.
3. **Padding main area** — `p-4` su mobile è ok ma la main area non ha `safe-area-inset` per notch/home bar iOS.
4. **Manca viewport-fit=cover** su `index.html` per safe areas iOS.

### Dashboard
5. **KPI grid `grid-cols-2`** — ok su mobile ma il credit card con burn rate ha testo che trabocca.
6. **AI Briefing chiude button** — area tap troppo piccola (16px), serve min 44px per touch.
7. **Smart Actions list** — le card sono ben strutturate ma il long text si tronca male.

### Render Modules (Priorità Alta)
8. **RenderHub hero** — credits widget `absolute top-6 right-6` si sovrappone al testo su mobile.
9. **Upload zones troppo alte** — `p-12` (96px padding) spreca spazio su mobile, meglio `p-6` su mobile.
10. **Step indicators** — nascosti su mobile (`hidden sm:inline`) in Facciata/Persiane/Stanza, ma senza feedback alternativo. Step numbers senza label confondono.
11. **Stanza step header sticky** — `sticky top-0` si sovrappone alla Topbar Shell (h-14). Serve `top-14`.
12. **Config grids** — `grid-cols-4` in tipo stanza, `grid-cols-10` per color swatches sono troppo piccoli su mobile.
13. **Image preview `max-h-[400px]`** — troppo alto su mobile, copre tutto lo schermo. Meglio `max-h-[50vh]`.
14. **BeforeAfterSlider** — touch drag handle `w-10 h-10` è ok, ma manca `touch-action: pan-y` hint per scroll verticale.
15. **Buttons "Avanti/Genera"** — non sticky su mobile, l'utente deve scrollare per trovarli.
16. **Camera capture** — `accept="image/*"` manca `capture="environment"` per aprire direttamente la fotocamera su mobile.
17. **RenderBagnoNew** — `max-w-4xl` è troppo largo, crea inconsistenza con altri moduli che usano `max-w-2xl`.

### Capacitor-Ready
18. **Manca `viewport-fit=cover`** nel meta viewport per safe-area support.
19. **Mancano CSS `env(safe-area-inset-*)`** nella Shell per gestire notch e home indicator.

---

## Piano di implementazione

### 1. index.html — Safe Area Support
- Aggiungere `viewport-fit=cover` al meta viewport
- Aggiungere `<meta name="apple-mobile-web-app-capable" content="yes">`

### 2. Shell.tsx — Safe Area + Padding
- Aggiungere `env(safe-area-inset-bottom)` al padding bottom della main area
- Aggiungere `pb-safe` utility class

### 3. Topbar.tsx — Mobile-friendly
- Mostrare il nome della pagina corrente accanto al hamburger su mobile
- Aumentare tap targets a min 44px

### 4. AppBreadcrumb.tsx — Nascondere su mobile
- Aggiungere `hidden md:block` al wrapper breadcrumb

### 5. index.css — Utility classes per safe areas
- Aggiungere classi `pb-safe`, `pt-safe` con `env(safe-area-inset-*)`

### 6. RenderHub.tsx — Layout responsive
- Credits widget: da absolute a inline/flow su mobile
- Hero padding ridotto su mobile
- "Come funziona" grid: `grid-cols-2` su mobile invece di `grid-cols-1`

### 7. Tutti i Render *New.tsx (7 file) — Mobile-first
- **Upload zones**: padding `p-6 md:p-12`
- **Image preview**: `max-h-[50vh]` invece di `max-h-[400px]`
- **Camera button**: aggiungere `capture="environment"` per scatto diretto
- **Sticky bottom CTA**: wrappare i bottoni "Avanti"/"Genera" in un `sticky bottom-0` bar con blur backdrop
- **Step labels**: mostrare label abbreviata anche su mobile
- **Color grids**: `grid-cols-5 md:grid-cols-10` per swatches
- **Tipo stanza**: `grid-cols-3` su mobile invece di `grid-cols-4`
- **Container width**: normalizzare tutti a `max-w-2xl` su mobile

### 8. RenderStanzaNew.tsx — Fix specifici
- Fix sticky header `top-14` (sotto la topbar)
- Ridurre background gradient che impatta performance mobile

### 9. RenderBagnoNew.tsx — Normalizzazione
- Da `max-w-4xl` a `max-w-2xl mx-auto`
- Elementi grid bagno: `grid-cols-2` su mobile ok, ma servono label più corte

### 10. BeforeAfterSlider.tsx — Touch optimization
- Aggiungere `touch-action: pan-y` al container per permettere scroll verticale
- Handle più grande su mobile: `w-12 h-12` su touch

### 11. Dashboard.tsx — Touch targets
- Aumentare tap area dei bottoni azione (min 44×44px)
- Briefing close button più grande

### File da modificare
- `index.html`
- `src/index.css`
- `src/components/layout/Shell.tsx`
- `src/components/layout/Topbar.tsx`
- `src/components/layout/AppBreadcrumb.tsx`
- `src/pages/app/RenderHub.tsx`
- `src/pages/app/RenderNew.tsx`
- `src/pages/app/RenderBagnoNew.tsx`
- `src/pages/app/RenderStanzaNew.tsx`
- `src/pages/app/RenderTettoNew.tsx`
- `src/pages/app/RenderFacciataNew.tsx`
- `src/pages/app/RenderPersianeNew.tsx`
- `src/pages/app/RenderPavimentoNew.tsx`
- `src/components/render/BeforeAfterSlider.tsx`
- `src/pages/app/Dashboard.tsx`

