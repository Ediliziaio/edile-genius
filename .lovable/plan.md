

# Miglioramento Blog: Immagini AI, Esempi Pratici e SEO Avanzato

## Problemi attuali
- Le card blog mostrano placeholder grigio "Immagine articolo" invece di immagini reali
- BlogArticle non supporta immagini inline, liste strutturate, callout o box dati
- Nessuna hero image negli articoli
- Contenuti testuali senza elementi visivi (grafici, box statistiche, esempi pratici evidenziati)
- JSON-LD Article manca di `image`, `wordCount`, `articleSection`
- Nessun breadcrumb strutturato
- Manca Table of Contents per articoli lunghi
- Blog listing page senza schema `CollectionPage`

## Piano

### 1. Generare immagini AI per ogni articolo
Usare il modello Gemini image generation (via edge function) per creare 6 hero images tematiche. Salvarle come URL statici nei dati degli articoli. Ogni articolo avrà una `heroImage` reale + immagini inline nelle sezioni.

Creare una **edge function** `generate-blog-images` che genera le immagini e le salva su Supabase Storage. In alternativa, dato che sono statiche, possiamo generarle una volta e hardcodare gli URL.

**Approccio pragmatico**: Usare immagini Unsplash/Pexels gratuite con URL diretti per le hero images (cantiere, serramenti, fotovoltaico, ufficio edile). Questo evita complessità e i costi di generazione AI, mantenendo velocità di caricamento.

### 2. Estendere il data model `BlogSection`
Aggiungere a `BlogSection`:
- `image?: string` — URL immagine per la sezione
- `imageAlt?: string` — alt text SEO
- `type?: "text" | "stats" | "comparison" | "example"` — tipo sezione per rendering diverso
- `stats?: { label: string; value: string }[]` — box statistiche
- `callout?: string` — box evidenziato con esempio pratico

### 3. Migliorare `BlogArticle.tsx`
- Renderizzare immagini con `<img>` + `alt` + `loading="lazy"` + `aspect-ratio`
- Box statistiche stilizzati (griglia 2x2 con numeri grandi e label)
- Callout/esempio pratico con bordo laterale verde e sfondo
- Supporto liste puntate strutturate (non solo `•` nel testo)
- Supporto tabelle markdown-like

### 4. Aggiungere Hero Image negli articoli (`BlogPost.tsx`)
- Hero image full-width sotto il titolo con `<img>` + alt SEO
- Breadcrumb strutturato: Home > Blog > Titolo articolo
- Table of Contents automatico generato dalle `sections[].heading`
- Tempo di lettura calcolato dal contenuto effettivo

### 5. Migliorare `BlogCard.tsx`
- Mostrare la hero image reale invece del placeholder grigio
- Aggiungere `alt` text per SEO immagini

### 6. SEO avanzato
- **JSON-LD Article** arricchito: aggiungere `image`, `wordCount`, `articleSection`, `dateModified`
- **Breadcrumb JSON-LD** separato per ogni articolo
- **CollectionPage JSON-LD** nella pagina `/blog`
- **FAQ JSON-LD** per articoli che contengono domande/risposte
- `og:image` dinamico per ogni articolo (usa hero image)
- `og:type: article` + `article:published_time` + `article:tag`

### 7. Arricchire contenuti con esempi pratici
Aggiornare `blogPosts.ts` con:
- Box statistiche inline (es. "+40% lead", "€25k risparmiati")
- Callout con esempi pratici reali evidenziati
- Immagini per sezioni chiave (screenshot dashboard, workflow diagrams)

### File coinvolti
- **Modificare**: `src/data/blogPosts.ts` (hero images reali, sezioni arricchite, stats, callout)
- **Modificare**: `src/components/blog/BlogArticle.tsx` (supporto immagini, stats box, callout, tabelle)
- **Modificare**: `src/components/blog/BlogCard.tsx` (hero image reale)
- **Modificare**: `src/pages/BlogPost.tsx` (hero image, breadcrumb, TOC, JSON-LD arricchito, og:image)
- **Modificare**: `src/pages/Blog.tsx` (CollectionPage JSON-LD)
- **Modificare**: `src/hooks/usePageSEO.ts` (supporto `og:type`, `article:*` meta)

