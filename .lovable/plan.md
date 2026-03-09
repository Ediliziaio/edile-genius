

# Highlight del testo cercato nelle BlogCard

## Approccio

Creare una funzione utility `highlightText` che dato un testo e una query, restituisce un array di `ReactNode` con le parti matchate wrappate in `<mark>`. Passare `searchQuery` a `BlogCard` e usare la funzione su titolo e descrizione.

## Modifiche

### `src/components/blog/BlogCard.tsx`
1. Aggiungere prop opzionale `searchQuery?: string`
2. Creare funzione `highlightText(text: string, query: string): ReactNode` che:
   - Se query vuota, ritorna il testo invariato
   - Splitta il testo per regex case-insensitive sulla query
   - Wrappa i match in `<mark className="bg-primary/20 text-foreground rounded-sm px-0.5">`
3. Applicare `highlightText` al titolo (`h3`) e alla descrizione (`p`)

### `src/pages/Blog.tsx`
1. Passare `searchQuery={searchQuery}` a ogni `<BlogCard>`

Due file, modifica minimale.

