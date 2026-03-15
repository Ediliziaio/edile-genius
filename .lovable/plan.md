

# Aggiungere effetti verdi alla headline

## Modifica in `src/components/sections/Hero.tsx` (riga 28-30)

Attualmente solo "integrato l'AI" è in verde. L'utente chiede più effetti verdi sulla headline.

Aggiungere evidenziazione verde ad altre frasi chiave, con un effetto di gradient/glow sottile sulla parte verde principale:

```tsx
<motion.h1 variants={item} className="font-display text-[22px] sm:text-[28px] md:text-[40px] font-extrabold leading-[1.15] text-neutral-900">
  Le imprese edili più avanzate hanno già{" "}
  <span className="text-primary">integrato l'AI</span>{" "}
  nella loro struttura. Hanno{" "}
  <span className="text-primary">eliminato i costi fissi</span>.{" "}
  Sostituito le figure improduttive.{" "}
  I <span className="text-primary">margini e guadagni sono cresciuti</span>.
</motion.h1>
```

Tre frasi chiave in verde (`text-primary`): "integrato l'AI", "eliminato i costi fissi", "margini e guadagni sono cresciuti" — creando un ritmo visivo che guida l'occhio sui benefici principali.

### File da modificare
- `src/components/sections/Hero.tsx`

