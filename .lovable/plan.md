

# Piano: Miglioramento Chi Siamo + Garanzia su ogni pagina

## 1. Riscrittura `src/pages/ChiSiamo.tsx`

La pagina attuale è troppo piatta e narrativa. Manca impatto, social proof e persuasione. Riscrittura completa con:

- **Hero potenziato**: Badge "LA NOSTRA STORIA", H1 più aggressivo con sottotitolo che stabilisce autorità e credibilità immediata
- **Sezione "Perché Siamo Diversi"**: 3 card con differenziatori chiave (Nati in cantiere, Testato su noi stessi, Solo edilizia) — icone lucide, non emoji
- **Narrativa migliorata**: Stessa storia ma con copy più incisivo, blockquote più forte, struttura visiva migliore con separatori e font weight strategici
- **Timeline migliorata**: Stessa struttura verticale ma con card background per ogni milestone, icone al posto dei dot semplici, highlight più marcato sull'ultimo step
- **Stats bar potenziata**: Aggiungere animazioni stagger e visual più impattante
- **Sezione Team/Valori**: Aggiungere 3 valori aziendali (Trasparenza radicale, Risultati misurabili, Solo edilizia) con icone
- **Garanzia**: Aggiungere `<Guarantee />` prima del Footer

## 2. Aggiungere `<Guarantee />` su tutte le pagine pubbliche

Importare e inserire il componente `Guarantee` (da `@/components/sections/Guarantee`) prima del `<Footer />` su:

- `src/pages/ComeFunziona.tsx` — prima di `</main>` e `<Footer />`
- `src/pages/Tariffe.tsx` — prima di `<Footer />`
- `src/pages/Solutions.tsx` — prima di `<Footer />`
- `src/pages/ChiSiamo.tsx` — prima di `<Footer />`

La homepage (`Index.tsx`) lo ha già.

## File da modificare
- **`src/pages/ChiSiamo.tsx`** — riscrittura completa
- **`src/pages/ComeFunziona.tsx`** — aggiunta import + componente Guarantee
- **`src/pages/Tariffe.tsx`** — aggiunta import + componente Guarantee
- **`src/pages/Solutions.tsx`** — aggiunta import + componente Guarantee

