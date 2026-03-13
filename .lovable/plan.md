

# Render Stanza Doc 5/5 — Hub + DB Stili + Final

## Current State
- Routes and nav already configured (Doc 1)
- `render_stanza_stili_pronti` table does NOT exist yet
- `render_stanza_gallery` has `result_image_url` but no `original_url` — need to handle this in the Hub by joining with `render_stanza_sessions` or adding an `original_image_url` column
- Sidebar already has "Render Stanza" entry with Wand2 icon (line 56)

## Changes

### 1. Database Migration
- Create `render_stanza_stili_pronti` table with columns: id, nome, descrizione, emoji, tags, tipo_stanza, config (JSONB), preview_hex, stile, attivo, ordine, created_at
- Add `preview_hex` and `stile` columns (used by `StiliProntiStanza.tsx` component from Doc 4)
- RLS: public read for active records
- Add `original_image_url` column to `render_stanza_gallery` so the Hub can show before/after without joining sessions
- Insert 8 preset styles

### 2. Replace `src/pages/app/RenderStanzaHub.tsx`
Full Hub page with:
- Hero section with violet gradient and CTA
- Tabs: "Come funziona" (info) and "La mia galleria"
- Info tab: 4-step how-it-works, 10 interventions grid, supported room types, bottom CTA
- Gallery tab: queries `render_stanza_gallery`, renders `RenderStanzaResultCard` grid, toggle favorite, empty state
- Fix: use `useAuth` from `@/context/AuthContext`, handle missing `original_image_url` gracefully
- Query gallery with join approach or fallback for original URL

### 3. No nav changes needed
Already present at line 56 of SidebarNav.tsx.

## Technical Notes
- Gallery column `interventi` maps to `interventiEseguiti` prop on `RenderStanzaResultCard`
- The gallery query casts `(row as any)` for the `render_stanza_gallery` table since it may not be in the generated types yet
- Hub uses `bg-card`, `text-foreground`, `border-border` for dark mode compatibility (not hardcoded white/gray)

