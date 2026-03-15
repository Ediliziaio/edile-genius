

# Duplicare la Homepage in /offerta-unica

## Cosa fare

1. **Creare `src/pages/OffertaUnica.tsx`**: Copia esatta di `Index.tsx` con SEO e canonical aggiornati per `/offerta-unica`.

2. **Aggiornare `src/App.tsx`**: Aggiungere la route `/offerta-unica` con lazy import e `SafeRoute`.

## File

- **Nuovo**: `src/pages/OffertaUnica.tsx` — stesso layout di Index (AnnouncementBar, Navbar, Hero, tutte le sezioni lazy, Footer, StickyMobileCTA) con `canonical: "/offerta-unica"` e titolo/description dedicati.
- **Modifica**: `src/App.tsx` — aggiungere `const OffertaUnica = lazy(...)` e `<Route path="/offerta-unica" ...>` tra le route pubbliche.

