

# Doc 3/7: Template Builder + Sequencer UI

## Adaptations

- The prompt uses `@hello-pangea/dnd` for drag-and-drop — this package is **not installed**. Will implement reordering without it, using simple move-up/move-down buttons instead. This avoids adding a new dependency and keeps the UI functional.
- The prompt uses `uuid` (`v4`) — project already uses `crypto.randomUUID()` in `defaultTemplate.ts`. Will keep that pattern.
- Existing `TemplatePreventivo` page at `/app/impostazioni/template-preventivo` handles **branding-only** config (logo, colors, company info). The new Template Builder is a **different page** for section sequencing. Both can coexist.
- `preventivo_templates` table already has a `sezioni` JSONB column (added in Doc 1). The existing `TemplatePreventivo` page doesn't use it. The new builder will read/write `sezioni` + `branding_json`.
- No DB migration needed — schema already supports this.
- The save must include `company_id` from `useCompanyId()`.

## Plan

### 1. Create `src/pages/app/PreventivoTemplateBuilder.tsx`
Section sequencer with:
- Editable template name + description
- Ordered list of sections with move-up/move-down buttons (no DnD dependency)
- Toggle active/inactive per section
- Inline title rename
- Source badge (AI/KB/Render/Tabella/Manuale)
- Expand/collapse config panel per section type (`SezioneConfigPanel`)
- Add section menu (checks for duplicates)
- Branding panel: color picker + footer text
- Structure preview sidebar
- Save / Save as default buttons
- Loads existing template by ID or creates new one

### 2. Create `src/pages/app/PreventivoTemplateList.tsx`
Template list hub:
- Fetches templates for current company
- Shows section count, default badge
- Duplicate template action
- Link to builder for edit
- CTA for new template

### 3. Update `src/App.tsx`
Add lazy imports + routes:
- `/app/preventivi/templates` → `PreventivoTemplateList`
- `/app/preventivi/templates/nuovo` → `PreventivoTemplateBuilder` (new)
- `/app/preventivi/templates/:id` → `PreventivoTemplateBuilder` (edit)

### Files
- **Create**: `src/pages/app/PreventivoTemplateBuilder.tsx`
- **Create**: `src/pages/app/PreventivoTemplateList.tsx`
- **Edit**: `src/App.tsx` (3 routes + 2 lazy imports)

