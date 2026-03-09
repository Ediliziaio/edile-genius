

# Piano: Sezione "Perché Diverso" + Pagina "Chi Siamo"

## 1. Nuova sezione homepage: `WhyDifferent.tsx`

Creare `src/components/sections/WhyDifferent.tsx` con:
- Layout a due colonne (desktop) / una colonna (mobile)
- **Colonna sinistra** "Edilizia.io": 5 item con emoji, titolo bold, testo — stile positivo con accent primary
- **Colonna destra** "Le alternative": 5 item con testo barrato, icone grigie, tono dimesso
- Linea divisoria verticale sottile al centro (desktop)
- Badge "IL NOSTRO DIFFERENZIALE", H2 "Perché Edilizia.io è radicalmente diverso?"
- Animazioni fade-up con `useInView` + `staggerChildren` (stesso pattern delle altre sezioni)

**Inserimento in `Index.tsx`**: dopo `WhyUs` e prima di `Pricing`

## 2. Nuova pagina: `src/pages/ChiSiamo.tsx`

Creare la pagina con:
- Navbar + Footer (stessi della homepage)
- **Sezione narrativa** a due colonne: testo storia a sinistra (più largo), timeline verticale a destra
- Quote block con bordo sinistro primary e sfondo tintato
- **Timeline**: 5 milestone con dot connessi da linea verticale, ultimo dot più grande/prominente con glow
- **Barra statistiche** in fondo: 4 numeri (10+, 500+, 24/7, 48h) separati da linee verticali

Lo sfondo sarà `bg-neutral-900` (dark) per coerenza col tema edile. I testi saranno `text-neutral-300/400`, accent `text-primary`.

## 3. Routing

Aggiungere in `App.tsx`:
- `import ChiSiamo from "./pages/ChiSiamo"`
- `<Route path="/chi-siamo" element={<ChiSiamo />} />`

## 4. Navbar

Aggiungere link "Chi Siamo" nella navigazione desktop e mobile in `Navbar.tsx`

## File da creare/modificare
- **Creare**: `src/components/sections/WhyDifferent.tsx`
- **Creare**: `src/pages/ChiSiamo.tsx`
- **Modificare**: `src/pages/Index.tsx` (aggiungere WhyDifferent)
- **Modificare**: `src/App.tsx` (nuova route)
- **Modificare**: `src/components/sections/Navbar.tsx` (link Chi Siamo)

