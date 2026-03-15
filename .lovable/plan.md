

# Sostituire "Edil Genius" con "Edilizia.io" nella pagina Tariffe

## Modifiche in `src/pages/Tariffe.tsx`

Sostituire tutte le occorrenze di "Edil Genius" con "Edilizia.io" (circa 6 punti):

| Riga | Attuale | Nuovo |
|------|---------|-------|
| 204 | `Prezzi e Tariffe — Edil Genius \| AI per Imprese Edili` | `Prezzi e Tariffe — Edilizia.io \| AI per Imprese Edili` |
| 205 | `Scopri i prezzi di Edil Genius:` | `Scopri i prezzi di Edilizia.io:` |
| 236 | `Ogni servizio AI di Edil Genius` | `Ogni servizio AI di Edilizia.io` |
| 363 | `Quanto risparmi con Edil Genius?` | `Quanto risparmi con Edilizia.io?` |
| 402 | `{/* Edil Genius */}` (commento) | `{/* Edilizia.io */}` |
| 406 | `Costo Edil Genius ({roi.piano})` | `Costo Edilizia.io ({roi.piano})` |

Anche la variabile `costoEdilGenius` nel `useMemo` verrà rinominata in `costoEdiliziaIo` per coerenza, insieme al riferimento `roi.costoEdilGenius` → `roi.costoEdiliziaIo`.

### File da modificare
- `src/pages/Tariffe.tsx`

