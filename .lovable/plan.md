

# Aggiungere FAQPage Schema.org agli Articoli Blog

## Approccio

1. **Estendere il data model** (`BlogPost` interface) con un campo opzionale `faqs?: { question: string; answer: string }[]`
2. **Aggiungere 3-5 FAQ per ogni articolo** nei dati di `blogPosts.ts` — domande reali che gli utenti cercano su Google, con risposte concise e keyword-rich
3. **Iniettare FAQPage JSON-LD** in `BlogPost.tsx` accanto agli schema Article e Breadcrumb esistenti
4. **Renderizzare le FAQ visivamente** in fondo all'articolo (prima del CTA) con un accordion/lista espandibile — questo serve sia per UX che per dare a Google il contenuto corrispondente allo schema

## File da modificare

- **`src/data/blogPosts.ts`** — Aggiungere `faqs` all'interface `BlogPost` + 3-5 FAQ per ciascuno dei 12 articoli
- **`src/pages/BlogPost.tsx`** — Iniettare `FAQPage` JSON-LD + renderizzare sezione FAQ con Accordion
- Nessun nuovo componente necessario: usiamo l'Accordion di Radix già installato

## Struttura JSON-LD FAQPage

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Domanda?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Risposta."
      }
    }
  ]
}
```

