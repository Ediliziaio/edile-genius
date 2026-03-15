

# Scambio testo Hero: H1 ↔ Paragrafo

## Cosa fare

Il testo lungo attualmente nel primo `<p>` (riga 39-41) deve diventare il titolo H1, e il testo attualmente nell'H1 (righe 29-35) deve diventare il paragrafo introduttivo.

### File: `src/components/sections/Hero.tsx`

**H1 (righe 28-36)** — Sostituire con il testo lungo, adattato come headline. Dato che è molto più lungo, ridurre il font size (es. `text-[22px] sm:text-[28px] md:text-[40px]`) e togliere le decorazioni span esistenti:

```tsx
<motion.h1 variants={item} className="font-display text-[22px] sm:text-[28px] md:text-[40px] font-extrabold leading-[1.15] text-neutral-900">
  Mentre la tua impresa edile paga stipendi fissi a figure improduttive, le aziende più avanzate del settore sono già tra le prime ad aver sostituito segreterie, commerciali e back-office con{" "}
  <span className="text-primary">Agenti AI che lavorano 24/7</span>{" "}
  senza mai fermarsi — chiudono più lavori, tagliano i costi fissi e portano a casa margini che prima non vedevano.
</motion.h1>
```

**Primo paragrafo (righe 39-41)** — Sostituire con il vecchio H1:

```tsx
<p>
  Licenzia i Costi. Assumi l'AI. Fai Esplodere la tua Azienda Edile.
</p>
```

### File da modificare
- `src/components/sections/Hero.tsx`

