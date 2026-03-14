

# Accesso Rapido Render nella pagina Agenti AI

## Cosa cambia

Aggiungere una sezione "Strumenti Render AI" in fondo alla pagina Agenti (`Agents.tsx`) che mostra i 7 render disponibili come card compatte cliccabili. Ogni card porta direttamente alla pagina di creazione del render corrispondente, senza passare dall'hub template.

## Implementazione

### File: `src/pages/app/Agents.tsx`

1. Aggiungere un array statico `RENDER_SHORTCUTS` con i 7 render (slug, nome, icona, route, descrizione breve)
2. In fondo alla pagina (dopo la grid agenti), renderizzare una sezione con:
   - Titolo "Strumenti Render AI" con icona 🎨 e sottotitolo
   - Griglia responsive (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`) di card compatte
   - Ogni card: icona, nome, descrizione 1 riga, freccia → al click naviga alla route dedicata
3. Le route usano la stessa mappatura `RENDER_ROUTES` già presente in `CreateAgent.tsx`:
   - render-infissi → `/app/render/new`
   - render-bagno → `/app/render-bagno/new`
   - render-facciata → `/app/render-facciata/new`
   - render-persiane → `/app/render-persiane/new`
   - render-pavimento → `/app/render-pavimento/new`
   - render-stanza → `/app/render-stanza/new`
   - render-tetto → `/app/render-tetto/new`

La sezione è sempre visibile, indipendentemente dai filtri agenti.

