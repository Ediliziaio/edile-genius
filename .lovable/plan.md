

# Fix: Reset `configLayout.attivo` when switching away from demolizione completa

## Problem
When the user selects "Rifacimento Totale", `configLayout.attivo` is set to `true`. But switching to any other intervention type (restyling_piastrelle, restyling_completo, demolizione_parziale) does NOT reset it to `false`. This means the layout block would incorrectly be appended to the prompt even for non-demolition renders.

## Fix
In `src/pages/app/RenderBagnoNew.tsx`, in the `selectTipoIntervento` function (~line 359), add `setConfigLayout(prev => ({ ...prev, attivo: false }))` to the non-demolizione branches (or add it before the if/else chain as a default reset, then override to `true` only for demolizione_completa).

Single line change — set `attivo: false` at the start of `selectTipoIntervento`, keep the `attivo: true` override for demolizione_completa.

