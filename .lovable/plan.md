

# Add Static Navigation Items to GlobalSearch

## Problem
The GlobalSearch (Cmd+K) only searches DB entities (agents, contacts, campaigns, conversations). It doesn't include static app pages like Render modules (Infissi, Bagno, Facciata, Persiane, Pavimento, Stanza), Dashboard, Cantieri, Preventivi, etc. Users expect to find these when typing "render", "pavimento", "stanza", etc.

## Approach
Add a "Pagine" (Pages) group to GlobalSearch that filters from a static list of navigation items matching the sidebar nav structure. These always appear when the query matches, regardless of `companyId`.

## Changes

### Edit `src/components/layout/GlobalSearch.tsx`
- Add a `STATIC_PAGES` array with all major app routes (from `companyNav` + superadmin key pages), each with label, href, icon, and optional keywords for fuzzy matching
- Filter `STATIC_PAGES` by query match on label or keywords
- Render as a new `CommandGroup` heading "Pagine" before DB results
- Add icons: `Wand2`, `Palette`, `Bath`, `Home`, `Layers`, `HardHat`, `LayoutDashboard`, etc.
- Remove the `companyId` requirement for static pages (they always show)

Static pages to include (~20 entries):
- Dashboard, Agenti, Automazioni, Risultati
- Contatti, Campagne, Monitor Chiamate, Chiamate Programmate
- Preventivi, Cantieri, Documenti, Presenze
- Render Infissi, Render Bagno, Render Facciata, Render Persiane, Render Pavimento, Render Stanza
- Crediti, Integrazioni, Account

## Files
- **Edit**: `src/components/layout/GlobalSearch.tsx`

