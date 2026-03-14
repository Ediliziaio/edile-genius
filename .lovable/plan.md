

# Rimozione sezione "STRUMENTI AI" dalla Sidebar

## Problema
La sezione "STRUMENTI AI" nella sidebar elenca 7 render come voci di navigazione separate, ma questi sono gestiti dal flusso di creazione agente e i risultati finiscono sotto "Agenti". Avere una sezione dedicata confonde: apre pagine standalone quando tutto il flusso è già integrato nell'hub agenti.

## Soluzione
Rimuovere completamente la sezione `STRUMENTI AI` (righe 52-60) da `companyNav` in `SidebarNav.tsx`. Rimuovere anche la logica di visibilità associata (`visibilityKey: "render"`, calcolo `hasRenderCredits`/`isSerramenti` in `sectionVisibility`).

Le pagine render restano raggiungibili tramite il wizard agenti e i link diretti, ma non occupano più spazio nella sidebar.

## File da modificare
- `src/components/layout/SidebarNav.tsx` — rimuovere la sezione STRUMENTI AI da `companyNav` e pulire la logica di visibilità render

