

# Doc 3/7: Template Builder — Gap Analysis & Plan

## Already Implemented

The project has a functional template builder at `src/pages/app/PreventivoTemplateBuilder.tsx` with:
- Full section list with toggle, add, remove, expand/collapse config panels
- Per-section config panels (copertina, render, AI-generated, KB, offerta economica, etc.)
- Branding sidebar (color picker, footer)
- Structure preview sidebar
- Save/save-as-default to Supabase
- Routes already wired in App.tsx
- Template list page at `src/pages/app/PreventivoTemplateList.tsx` with duplicate/edit

## Gaps to Fill

### 1. Replace arrow reordering with `@hello-pangea/dnd` drag-and-drop
Current reordering uses ArrowUp/ArrowDown buttons. Doc 3 requires proper DnD with drag handles, visual feedback during drag (shadow, ring), and smooth reordering. Install `@hello-pangea/dnd` and wrap the section list with `DragDropContext > Droppable > Draggable`.

### 2. Add missing section config panels
The existing builder lacks config for:
- **`garanzie`** section — needs KB query hint input (same as condizioni_contrattuali)
- **`firma_cliente`** section — needs acceptance text textarea, show date/stamp toggles
- **`superfici_computo`** section — needs AI estimation toggle, confidence display toggle

### 3. Add "unsaved changes" indicator
Doc specifies a `isDirty` badge showing "Non salvato" in the header. Currently missing.

### 4. Template list: add set-default and delete with confirmation
Current list page has duplicate but lacks set-as-default toggle and delete confirmation dialog.

## Files to Modify

| File | Action |
|------|--------|
| `src/pages/app/PreventivoTemplateBuilder.tsx` | Replace arrow buttons with `@hello-pangea/dnd`, add missing config panels (garanzie, firma_cliente, superfici_computo), add isDirty badge |
| `src/pages/app/PreventivoTemplateList.tsx` | Add set-default button and delete confirmation |
| `package.json` | Add `@hello-pangea/dnd` |

No new files, hooks, or DB changes needed — the existing code covers the architecture well. This is a UX upgrade.

