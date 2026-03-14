

# Aggiungere i 7 moduli Render AI alla pagina Soluzioni

## Cosa cambia

Aggiungere 7 nuove soluzioni (ID 21-27) nell'array `solutions` in `src/data/solutions.ts`, una per ogni modulo Render AI: Infissi, Bagno, Facciata, Persiane, Pavimento, Stanza e Tetto. Aggiungere anche un nuovo filtro settore "Render AI" per raggrupparli.

## Implementazione

### 1. `src/data/solutions.ts`

- Aggiungere `'render'` al tipo `Settore`: `export type Settore = 'infissi' | 'fotovoltaico' | 'ristrutturazioni' | 'edilizia' | 'render';`
- Aggiungere la config per il nuovo settore in `settoreConfig`:
  ```ts
  render: { label: 'Render AI', emoji: '🎨', color: '#EC4899', colorBg: '#FDF2F8', colorDark: '#BE185D' }
  ```
- Aggiungere 7 nuove soluzioni (ID 21-27) con `settore: 'render'` e `tipoAI: 'operativo'`:
  - **#21 Render AI Infissi** — Visualizzazione fotorealistica sostituzione serramenti
  - **#22 Render AI Bagno** — Ristrutturazione bagno con AI (demolizione, restyling, singoli elementi)
  - **#23 Render AI Facciata** — Cappotto termico, intonaco, rivestimenti facciate
  - **#24 Render AI Persiane** — Sostituzione/aggiunta persiane e oscuranti
  - **#25 Render AI Pavimento** — Cambio pavimentazione con pattern, fughe, finiture
  - **#26 Render AI Stanza** — Ristrutturazione completa stanza (10 interventi)
  - **#27 Render AI Tetto** — Rifacimento manto, gronde, lucernari

  Ogni soluzione avrà: `description`, 3 `bullets`, `roiChip`, `fullDescription`, 3 step `howItWorks`, 3 `roiMetrics`, 3 `idealFor`, 4 `integrations`.

### 2. `src/components/solutions/FilterBar.tsx`

Aggiungere il filtro `render` nell'array `filters`:
```ts
{ key: 'render', label: 'Render AI', emoji: '🎨' },
```

### File da modificare
- `src/data/solutions.ts` — nuovo settore + 7 soluzioni
- `src/components/solutions/FilterBar.tsx` — nuovo filtro

