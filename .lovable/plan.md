

# Semplificare la sezione Pricing: solo risultati, niente piani

## Cosa cambia

Rimuovere completamente le 3 card con piani (Starter, Professional, Enterprise), features, badge, ecc. Sostituire con una singola sezione pulita che mostra solo i numeri di risparmio/guadagno e un unico CTA "Prenota Demo Gratuita 15 Min".

## Layout proposto

```text
┌─────────────────────────────────────────────────┐
│  Badge: QUANTO PUOI GUADAGNARE                  │
│  Titolo: Scopri Quanto Puoi                     │
│          Risparmiare e Guadagnare.              │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 📅 +40   │ │ 📉−€6.600│ │ 📈+€180K │        │
│  │ appunt.  │ │ costi/   │ │ fatturato│        │
│  │ /mese    │ │ mese     │ │ /anno    │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ +30%     │ │ −70%     │ │ €79.200  │        │
│  │ lead     │ │ tempi    │ │ risparmio│        │
│  │ qualif.  │ │ gestione │ │ /anno    │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
│  Sottotitolo: "Ti mostriamo i numeri reali..."  │
│                                                 │
│  [ Prenota Demo Gratuita 15 Min ]  (big CTA)   │
│                                                 │
│  footer: garanzia 30gg · setup incluso · GDPR  │
└─────────────────────────────────────────────────┘
```

## File da modificare

**`src/components/sections/Pricing.tsx`**: Riscrivere completamente. Rimuovere l'array `plans` e le 3 card. Creare una griglia 3x2 di stat card grandi con icone, numeri bold e label. Un unico bottone CTA verde centrato sotto. Mantenere badge, titolo e footer.

