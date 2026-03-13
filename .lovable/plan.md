

# Render Tetto Doc 3/5 — Wizard UI

## Adaptations

The prompt references `useProgettoContext`, `ProgettoSelector`, and `ProgettoQuickBadge` — **none exist** in the codebase. These will be removed. The page will follow the pattern of `RenderStanzaNew` and `RenderPersianeNew` which have no project context integration.

The prompt also references `navigate('/app/render-tetto')` — no `RenderTettoHub` page exists yet (that's presumably Doc 4/5). The back button will navigate to `/app/render` (the main render hub) for now.

The `note_libere` update in Step 3 uses `updateConfig('note_libere', ...)` which doesn't match the hook's generic section updater pattern. Will use `setConfig` directly or add a `setNoteLibere` helper.

## Plan

### 1. Create `src/pages/app/RenderTettoNew.tsx`

5-step wizard with amber/orange theme:

- **Step 1 (Upload)**: Drag-and-drop photo upload, auto-analysis trigger, analysis results card with detected colors palette
- **Step 2 (Tipo tetto)**: 5 roof type options (a_falde, piano, mansardato, padiglione, altro) with emoji cards
- **Step 3 (Configura)**: Three `SectionCard` components with Switch toggles:
  - Manto: grouped material picker (6 groups, 12 types), suggested colors per type, custom color picker, finish selector
  - Gronde: material radio buttons, quick color palette, custom picker
  - Lucernari: type/quantity/position selects, frame color picker
  - Free-text notes textarea
- **Step 4 (Genera)**: Summary of active modifications with icons, CTA button with loading animation
- **Step 5 (Risultato)**: Before/after toggle, download button, new render button

`SectionCard` is a local reusable component with icon, title, Switch toggle, and collapsible body with themed colors.

### 2. Register route in `src/App.tsx`

Add lazy import for `RenderTettoNew` and route `/app/render-tetto/new`.

### 3. Add sidebar nav entry in `src/components/layout/SidebarNav.tsx`

Add "Render Tetto" to the "STRUMENTI AI" section.

### Files
- **Create**: `src/pages/app/RenderTettoNew.tsx`
- **Edit**: `src/App.tsx` (add lazy import + route)
- **Edit**: `src/components/layout/SidebarNav.tsx` (add nav item)

