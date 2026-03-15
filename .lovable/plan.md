

# Aggiungere card Render AI e Preventivazione in UseCasesGrid

## Modifica in `src/components/sections/UseCasesGrid.tsx`

Aggiungere una nuova card all'array `useCases` che copra la suite Render AI e la preventivazione automatica, posizionandola come 7° elemento:

```typescript
{
  icon: "🖼️",
  title: "Render Fotorealistici & Preventivi Automatici",
  text: "Trasforma foto di serramenti, facciate, bagni, pavimenti in render fotorealistici prima/dopo. Genera preventivi professionali con analisi AI delle superfici, computi metrici e offerte complete in pochi minuti. Chiudi più lavori con il selling visivo.",
  tag: "Render AI + Preventivi"
}
```

Oppure, se si preferisce dividerli in due card distinte:

```typescript
// Card Render AI
{
  icon: "🖼️",
  title: "Render AI Fotorealistici",
  text: "7 moduli specializzati per infissi, facciate, bagni, pavimenti, persiane, stanze e tetti. Carica una foto, configura materiali e colori, ottieni render professionali prima/dopo per convincere il cliente prima ancora di iniziare i lavori.",
  tag: "Render AI"
},

// Card Preventivi
{
  icon: "📄",
  title: "Preventivazione Automatica AI",
  text: "Dall'analisi delle foto al computo metrico estimativo: l'AI stima superfici, genera descrizioni tecniche, crea offerte complete con prezzi e condizioni. Preventivi professionali in 10 minuti invece che ore di lavoro manuale.",
  tag: "Preventivi AI"
}
```

### Approccio consigliato
Aggiungere **entrambe le card** (una per Render, una per Preventivi) alla griglia esistente, portando il totale da 6 a 8 casi d'uso. La griglia responsive (`md:grid-cols-2 lg:grid-cols-3`) gestirà automaticamente il layout.

### File da modificare
- `src/components/sections/UseCasesGrid.tsx`

