

# Ottimizzazione Mobile della Homepage (/)

## Problemi identificati

1. **Hero**: H1 a `text-[44px]` troppo grande su schermi <375px, testo overflow. CTA buttons non stackano bene. Badge testo lungo va a capo male.
2. **AnnouncementBar**: Il link "Scopri Chi Puoi Sostituire →" è schiacciato a destra, testo marquee troppo piccolo.
3. **LogoBar**: Stats pills non wrappano bene, testo lungo va a capo.
4. **ROISection**: Tabella a 3 colonne con `grid-cols-3` — testo troncato/sovrapposto su mobile. Illeggibile.
5. **CostCalculator**: Comparison cards e error table (min-w-[700px]) richiedono scroll orizzontale. Slider cards OK ma i breakdown text-size piccoli.
6. **SolutionSection**: Cards con `p-8 md:p-10` — padding eccessivo su mobile. Icona 64px troppo grande.
7. **Pricing**: 3 cards in colonna OK, ma il plan "featured" ha `scale-[1.03]` che causa overflow orizzontale.
8. **FinalCTA**: H2 a `text-[36px]` OK ma il form card padding `p-8 md:p-12` è troppo su small screens.
9. **Footer**: Grid `md:grid-cols-4` — su mobile tutto in colonna ma spacing eccessivo.
10. **Navbar mobile menu**: Manca CTA "Accedi" nel menu mobile.

## Piano di modifiche

### `src/components/sections/Hero.tsx`
- H1: `text-[32px] sm:text-[44px] md:text-[72px]` (ridurre base)
- Subtitle: `text-base sm:text-lg`
- CTA buttons: `flex-col sm:flex-row` per stackare su mobile
- Badge: wrapping migliore con text più piccolo su mobile

### `src/components/sections/AnnouncementBar.tsx`
- Nascondere il link CTA su mobile (`hidden sm:flex`), lasciare solo il marquee full-width

### `src/components/sections/ROISection.tsx`
- Cambiare la tabella da `grid-cols-3` a layout a card su mobile: ogni riga diventa una card con label/oggi/AI stacked verticalmente
- Header nascosto su mobile, mostrato su `md:`

### `src/components/sections/CostCalculator.tsx`
- Error table: rimuovere `min-w-[700px]`, renderizzare come card stacked su mobile invece di tabella
- Saving box stats: `grid-cols-1 sm:grid-cols-3`
- Comparison cards: già `grid-cols-1` su mobile, OK. Ridurre padding `p-5 md:p-8`

### `src/components/sections/SolutionSection.tsx`
- Ridurre icona: `size={40}` su mobile con classe responsive
- Padding: `p-6 md:p-8 lg:p-10`

### `src/components/sections/Pricing.tsx`
- Rimuovere `scale-[1.03]` su mobile: `md:scale-[1.03]`

### `src/components/sections/FinalCTA.tsx`
- H2: `text-[28px] sm:text-[36px] md:text-[72px]`
- Form card: `p-6 md:p-12`

### `src/components/sections/Navbar.tsx`
- Aggiungere link "Accedi" nel mobile menu prima del CTA "Prenota Demo"

### `src/components/sections/Footer.tsx`
- Ridurre gap mobile: `gap-8 md:gap-10`

## File da modificare (9 file)

| File | Tipo modifica |
|------|--------------|
| `Hero.tsx` | Font size responsive, CTA stack, badge |
| `AnnouncementBar.tsx` | Nascondere CTA link su mobile |
| `ROISection.tsx` | Tabella → card layout su mobile |
| `CostCalculator.tsx` | Error table responsive, saving box grid |
| `SolutionSection.tsx` | Padding e icon size ridotti |
| `Pricing.tsx` | Rimuovere scale su mobile |
| `FinalCTA.tsx` | Font e padding responsive |
| `Navbar.tsx` | Aggiungere "Accedi" nel menu mobile |
| `Footer.tsx` | Spacing ridotto |

