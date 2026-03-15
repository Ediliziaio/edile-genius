

# Modifiche Hero: rimuovere frase + aggiungere colore verde al titolo

## Modifiche in `src/components/sections/Hero.tsx`

**1. Rimuovere il paragrafo "Licenzia i Costi..." (righe 33-35)**
Eliminare completamente il `<p>` con quella frase dal blocco descrittivo.

**2. Aggiungere evidenziazione verde nel titolo (riga 29)**
Wrappare una parte chiave del titolo in `<span className="text-primary">` — ad esempio "integrato l'AI" per mantenere coerenza con il tema green del brand.

Risultato H1:
```
Le imprese edili più avanzate hanno già <span className="text-primary">integrato l'AI</span> nella loro struttura. Hanno eliminato i costi fissi. Sostituito le figure improduttive. I margini e guadagni sono cresciuti.
```

