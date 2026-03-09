

# SEO e Ottimizzazione Meta Tag

## Stato attuale
- **index.html**: ha title, description, OG tags e schema.org base — ma servono solo per la homepage
- **Pagine interne**: solo `/soluzioni` imposta `document.title`; le altre 6 pagine pubbliche (Chi Siamo, Come Funziona, Garanzia, Tariffe, Per Chi È, Per Chi È Detail) non hanno né title né meta description dinamici
- **Nessun sitemap.xml**
- **robots.txt**: presente ma manca riferimento al sitemap
- **Schema.org**: solo Organization base, manca LocalBusiness, FAQPage, Service
- **Canonical**: hardcoded solo in index.html
- **Nessun react-helmet** o equivalente installato

## Piano

### 1. Creare un hook `usePageSEO` (`src/hooks/usePageSEO.ts`)
Hook riutilizzabile che imposta dinamicamente:
- `document.title`
- `<meta name="description">`
- `<meta property="og:title">`, `og:description`, `og:url`
- `<link rel="canonical">`

Usa `useEffect` con manipolazione DOM diretta (no librerie esterne necessarie).

### 2. Applicare `usePageSEO` a tutte le pagine pubbliche

| Pagina | Title | Description (sintetica) |
|--------|-------|------------------------|
| `/` (Index) | Edilizia.io — Agenti Vocali AI per l'Edilizia | La prima agenzia AI specializzata... |
| `/soluzioni` | 20 Soluzioni AI per l'Edilizia \| Edilizia.io | Scopri 20 agenti AI per infissi... |
| `/per-chi-e` | Per Chi È \| Edilizia.io | Soluzioni AI per ogni tipo di azienda edile |
| `/per-chi-e/:slug` | {cat.name} — AI per l'Edilizia \| Edilizia.io | {cat.heroSubtitle} |
| `/chi-siamo` | Chi Siamo \| Edilizia.io | La prima agenzia AI specializzata... |
| `/come-funziona` | Come Funziona \| Edilizia.io | Scopri il processo in 3 step... |
| `/garanzia` | Garanzia 30 Giorni \| Edilizia.io | Zero rischi. Garanzia rimborso... |
| `/tariffe` | Tariffe \| Edilizia.io | Calcola quanto risparmi con gli agenti AI |

### 3. Arricchire schema.org in `index.html`
Espandere il JSON-LD con:
- `@type: LocalBusiness` (settore, contatto, area servita)
- `sameAs` per i profili social (LinkedIn, Instagram)

### 4. Creare `public/sitemap.xml`
Sitemap statico con tutte le pagine pubbliche (8 URL + le 16 pagine per-chi-e dinamiche).

### 5. Aggiornare `public/robots.txt`
Aggiungere `Sitemap: https://edilizia.io/sitemap.xml`.

### 6. Aggiungere meta tag mancanti in `index.html`
- `<meta name="robots" content="index, follow">`
- `<meta name="theme-color" content="#22c55e">`
- `<meta name="language" content="it">`

### File coinvolti
- **Creare**: `src/hooks/usePageSEO.ts`, `public/sitemap.xml`
- **Modificare**: `index.html`, `public/robots.txt`, `src/pages/Index.tsx`, `src/pages/Solutions.tsx`, `src/pages/ChiSiamo.tsx`, `src/pages/ComeFunziona.tsx`, `src/pages/Garanzia.tsx`, `src/pages/Tariffe.tsx`, `src/pages/PerChiE.tsx`, `src/pages/PerChiEDetail.tsx`

