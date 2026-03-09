

# Blog SEO-Friendly per Edilizia + AI

## Struttura

### 1. Dati articoli — `src/data/blogPosts.ts`
Array statico di 6 articoli ottimizzati per keyword ad alto volume:

| # | Slug | Keyword target | Title |
|---|------|---------------|-------|
| 1 | `agenti-vocali-ai-edilizia` | agenti vocali AI edilizia | Come gli Agenti Vocali AI Stanno Rivoluzionando l'Edilizia |
| 2 | `intelligenza-artificiale-serramenti` | AI serramenti infissi | Intelligenza Artificiale per Serramentisti: Guida Completa |
| 3 | `automazione-preventivi-edilizia` | automazione preventivi edilizia | Automazione Preventivi nell'Edilizia: Risparmiare Tempo e Chiudere Più Contratti |
| 4 | `ai-fotovoltaico-vendite` | AI fotovoltaico vendite | Come l'AI Aumenta le Vendite nel Fotovoltaico del 40% |
| 5 | `ridurre-costi-operativi-impresa-edile` | ridurre costi impresa edile | 5 Modi per Ridurre i Costi Operativi nella Tua Impresa Edile con l'AI |
| 6 | `call-center-ai-ristrutturazioni` | call center AI ristrutturazioni | Call Center AI per Ristrutturazioni: Mai Più Chiamate Perse |

Ogni articolo avrà: `slug`, `title`, `description`, `date`, `readTime`, `category`, `tags[]`, `heroImage` (placeholder), `sections[]` con heading + paragrafi in markdown-like struttura.

### 2. Pagina lista blog — `src/pages/Blog.tsx`
- Hero con titolo "Blog — AI e Innovazione nell'Edilizia"
- Griglia card con immagine, titolo, excerpt, data, tempo lettura, tag
- Filtro per categoria (Tutti, Vocale, Operativo, Guide)
- `usePageSEO` con title/description dedicati
- Layout: Navbar + Footer (come le altre pagine pubbliche)

### 3. Pagina articolo — `src/pages/BlogPost.tsx`
- Route `/blog/:slug`, legge da `blogPosts` per slug
- Layout article con heading strutturati (h1, h2, h3) per SEO
- Sidebar "Articoli correlati"
- CTA finale verso `/tariffe`
- Schema.org `Article` JSON-LD iniettato via `useEffect`
- `usePageSEO` dinamico dal post data

### 4. Componenti blog
- `src/components/blog/BlogCard.tsx` — card singolo articolo nella lista
- `src/components/blog/BlogArticle.tsx` — render del contenuto articolo
- `src/components/blog/BlogCTA.tsx` — CTA in fondo all'articolo

### 5. Routing — `src/App.tsx`
Aggiungere:
```
<Route path="/blog" element={<Blog />} />
<Route path="/blog/:slug" element={<BlogPost />} />
```

### 6. Navigazione — `src/components/sections/Navbar.tsx`
Aggiungere `{ label: "Blog", href: "/blog" }` a `navLinks`.

### 7. Footer — `src/components/sections/Footer.tsx`
Il link "Blog" nella colonna "Azienda" già esiste, collegarlo a `/blog`.

### 8. Sitemap — `public/sitemap.xml`
Aggiungere `/blog` e i 6 URL `/blog/:slug`.

### File coinvolti
- **Creare**: `src/data/blogPosts.ts`, `src/pages/Blog.tsx`, `src/pages/BlogPost.tsx`, `src/components/blog/BlogCard.tsx`, `src/components/blog/BlogArticle.tsx`, `src/components/blog/BlogCTA.tsx`
- **Modificare**: `src/App.tsx`, `src/components/sections/Navbar.tsx`, `src/components/sections/Footer.tsx`, `public/sitemap.xml`

