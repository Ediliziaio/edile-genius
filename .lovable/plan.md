

# Fix: Testi invisibili sulla pagina Chi Siamo (sfondo nero)

## Problema
La Navbar è progettata per pagine chiare (testi scuri, bg bianco). Sulla pagina Chi Siamo che ha sfondo nero (`neutral-900`), il logo e i link diventano invisibili (nero su nero).

Elementi invisibili:
- Logo "edilizia" → `text-neutral-900` su sfondo nero
- Link nav → `text-neutral-500` / `text-neutral-900` su sfondo nero
- Navbar bg scroll → transita a bianco, che stona

## Soluzione

### Modificare `src/components/sections/Navbar.tsx`
- Accettare una prop `variant?: "light" | "dark"` (default `"light"`)
- Quando `variant="dark"`:
  - Logo text → `text-white` invece di `text-neutral-900`
  - Link colori → `text-neutral-300` / hover `text-white` invece di `text-neutral-500` / `text-neutral-900`
  - Bg scroll → transita a `rgba(13,17,23,0.97)` (neutral-900) invece di bianco
  - Hamburger icon → bianco

### Modificare `src/pages/ChiSiamo.tsx`
- Passare `<Navbar variant="dark" />` 

### Controllare anche `src/pages/PerChiEDetail.tsx`
- Se la pagina ha sfondo scuro, passare anche lì `variant="dark"`

