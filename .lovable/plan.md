

# Fix: Testi poco leggibili nelle card della pagina Chi Siamo

## Problema
Le card nelle sezioni "Perché Siamo Diversi" e "I Nostri Valori" usano `text-[hsl(var(--neutral-400))]` (grigio al 47% di luminosità) per i testi descrittivi. Su sfondo `neutral-800` (15% luminosità), il contrasto è insufficiente e i testi risultano quasi illeggibili.

## Soluzione

**Modificare `src/pages/ChiSiamo.tsx`**:
- Cambiare il colore dei testi descrittivi nelle card da `text-[hsl(var(--neutral-400))]` a `text-[hsl(var(--neutral-300))]` (79% luminosità — molto più leggibile)
- Applicare a entrambe le sezioni: differentiators (riga 130) e values (riga ~290)
- Anche i sottotitoli delle sezioni che usano `neutral-400` vanno portati a `neutral-300`

