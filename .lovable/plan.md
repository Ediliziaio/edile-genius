

# Virtual Scrolling per Gallery Render

## Approccio

Invece di aggiungere una dipendenza pesante (`@tanstack/react-virtual`), implemento un **hook custom `useVirtualGrid`** basato su `IntersectionObserver` + windowing leggero. Questo approccio:
- Non aggiunge dipendenze
- Funziona con CSS Grid (a differenza di react-virtual che richiede posizionamento assoluto)
- Renderizza solo le righe visibili ± buffer, rimuovendo dal DOM le card fuori viewport

## Gallerie interessate

1. **`RenderGallery.tsx`** — galleria principale infissi (illimitata, priorità massima)
2. **`RenderBagnoHub.tsx`** — gallery bagno (limit 20, ma scalerà)
3. **`RenderPersianeHub.tsx`** — gallery persiane (limit 24)
4. **`RenderStanzaHub.tsx`** — gallery stanza (limit 40)
5. **`RenderFacciataHub.tsx`** — gallery facciata
6. **`RenderPavimentoHub.tsx`** — gallery pavimento
7. **`RenderTettoHub.tsx`** — gallery tetto

Le Hub con limit ≤20 beneficiano meno, ma per uniformità e future-proofing applico il pattern a tutte.

## Piano

### 1. Creare `src/hooks/useVirtualGrid.ts`
Hook che calcola quali item rendere in base allo scroll:
- Input: `totalItems`, `columns`, `rowHeight`, `overscan`
- Usa un singolo `ref` sentinella + `IntersectionObserver` per rilevare range visibile
- Restituisce: `visibleItems`, `totalHeight`, `offsetTop`, `containerRef`
- Approccio: calcola `startRow`/`endRow` dallo `scrollTop` del container, renderizza solo quelle righe con spacer div sopra/sotto

### 2. Creare `src/components/ui/VirtualGalleryGrid.tsx`
Componente riutilizzabile che wrappa la logica virtual:
- Props: `items[]`, `renderItem(item, index)`, `columns` (responsive: `{sm: 2, md: 3, lg: 4}`), `rowHeight`
- Gestisce il resize observer per ricalcolare colonne
- Mostra spacer div per mantenere scrollbar corretta

### 3. Applicare `VirtualGalleryGrid` a `RenderGallery.tsx`
Sostituire il `grid` statico con il componente virtual. Mantenere la selezione e share modal invariati.

### 4. Applicare alle altre 6 Hub galleries
Stesso pattern, adattando `columns` e `rowHeight` per ogni gallery.

### 5. Rimuovere limiti query dove possibile
Nelle Hub che hanno `.limit(20)` o `.limit(24)`, alzare a `.limit(200)` dato che il virtual scrolling gestisce il DOM.

### File da creare
- `src/hooks/useVirtualGrid.ts`
- `src/components/ui/VirtualGalleryGrid.tsx`

### File da modificare
- `src/pages/app/RenderGallery.tsx`
- `src/pages/app/RenderBagnoHub.tsx`
- `src/pages/app/RenderPersianeHub.tsx`
- `src/pages/app/RenderStanzaHub.tsx`
- `src/pages/app/RenderFacciataHub.tsx`
- `src/pages/app/RenderPavimentoHub.tsx`
- `src/pages/app/RenderTettoHub.tsx`

