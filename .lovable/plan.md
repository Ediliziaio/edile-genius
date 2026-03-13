

# Render Stanza Doc 4/5 — Componenti Avanzati

## Summary
Create 6 standalone components in `src/modules/render-stanza/components/` and optionally integrate them into the wizard.

## Compatibility Fixes Needed
The provided component code has several mismatches with the actual `AnalisiStanza` and `STANZA_STILI_PRONTI_FALLBACK` types:

1. **AnalisiStanzaCard**: References `analisi.pareti?.hex` — actual field is `analisi.pareti?.colore_hex`. Same for `analisi.pavimento?.hex` → `colore_hex`. Also `caratteristiche_speciali.camino` → `presenza_camino`, `.travi` → `presenza_travi`, `.arco` → `presenza_arco`. `illuminazione.luminosita` → `luminosita_ambiente`, `illuminazione.temperatura` → `temperatura_stimata`.

2. **StiliProntiStanza**: References `s.id`, `s.descrizione`, `s.tags` on fallback items — actual fallback has `nome` (no `id`), `desc` (not `descrizione`), and no `tags` field. Also queries `render_stanza_stili_pronti` table which doesn't exist yet (Doc 5 creates it). The DB query should gracefully fail.

3. **ConfigRiepilogo**: References `c.tipo_pavimento`, `c.pattern_posa`, `c.tipo_fixture` — these don't exist in `ConfigurazioneStanza`. Actual fields are `c.tipo`, `c.pattern`, `c.tipo` (for illuminazione). Also references `c.frontali?.cambia` and `c.rivestimento?.cambia` — actual types use flat fields like `colore_frontali_hex`, `cambia_sanitari`.

## Changes

### 1. Create 6 components (with fixes applied)

| File | Fixes |
|------|-------|
| `InterventiSummaryBar.tsx` | Minor: add proper `Record<string, boolean>` type |
| `AnalisiStanzaCard.tsx` | Fix all field paths to match `AnalisiStanza` type |
| `StiliProntiStanza.tsx` | Map fallback `desc`→`descrizione`, use `nome` as id, handle missing DB table gracefully |
| `InterventiQuickSelect.tsx` | Clean, no major fixes needed |
| `RenderStanzaResultCard.tsx` | Clean, no major fixes needed |
| `ConfigRiepilogo.tsx` | Fix field paths to match actual `ConfigurazioneStanza` types |

### 2. Integrate into RenderStanzaNew.tsx
- Add `InterventiSummaryBar` as sticky bar in Step 3
- Add `ConfigRiepilogo` before generate CTA in Step 3

## Files
- **New**: `src/modules/render-stanza/components/InterventiSummaryBar.tsx`
- **New**: `src/modules/render-stanza/components/AnalisiStanzaCard.tsx`
- **New**: `src/modules/render-stanza/components/StiliProntiStanza.tsx`
- **New**: `src/modules/render-stanza/components/InterventiQuickSelect.tsx`
- **New**: `src/modules/render-stanza/components/RenderStanzaResultCard.tsx`
- **New**: `src/modules/render-stanza/components/ConfigRiepilogo.tsx`
- **Edit**: `src/pages/app/RenderStanzaNew.tsx` — import and use InterventiSummaryBar + ConfigRiepilogo in Step 3

