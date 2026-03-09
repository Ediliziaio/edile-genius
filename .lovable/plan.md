

# Ricerca Full-Text nel Blog

## Approccio

Ricerca client-side sugli articoli statici già in memoria. Nessun backend necessario — i 12 articoli sono tutti nel bundle JS.

## Modifiche

### `src/pages/Blog.tsx`

1. Aggiungere stato `searchQuery` e un campo di ricerca con icona (Search di lucide) sopra i filtri categoria
2. La ricerca filtra su: `title`, `description`, `tags`, `sections[].heading`, `sections[].content` — tutto in lowercase per match case-insensitive
3. La ricerca si combina con il filtro categoria attivo (AND logico)
4. Quando c'è una query attiva, mostrare il conteggio risultati e un bottone "Cancella ricerca"
5. Input con debounce implicito (useMemo sui risultati filtrati)
6. Messaggio "Nessun risultato per ..." quando la ricerca non trova nulla

### UI

- Input con icona Search a sinistra e X per cancellare a destra
- Posizionato tra l'hero e i filtri categoria, centrato, max-w-lg
- Stile coerente col design system esistente (border-border, rounded-xl, bg-background)

### File coinvolti
- **Modificare**: `src/pages/Blog.tsx` — aggiungere search state, input UI, logica di filtro

Nessun nuovo componente o dipendenza necessaria.

