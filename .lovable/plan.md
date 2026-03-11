

## Add Inline Editing for Agent Name & Description

### What Changes

Replace the form-style "Il tuo agente" card in the Panoramica tab with inline-editable text. The name and description will display as regular text (heading + paragraph) that becomes editable on click, with auto-save on blur or Enter.

### Implementation

**File: `src/pages/app/AgentDetail.tsx`** — Panoramica tab section (lines 234-309)

1. **Name**: Replace `<Input>` with an `<h2>` that, on click, swaps to an input. On blur/Enter, it calls `update("name", value)` and exits edit mode. Show a subtle pencil icon on hover.

2. **Description**: Replace `<Textarea>` with a `<p>` that, on click, swaps to a textarea. On blur, it saves. If empty, show a clickable placeholder "Aggiungi una descrizione...".

3. **Move Sector/Language selects** into the identity card but make them compact inline badges that open selects on click, or keep them as small selects below the inline name/description — less prominent.

4. **Remove the "Il tuo agente" section heading** and the card wrapper for identity. Instead, make the name/description part of the page header area within the Panoramica tab, giving it a more natural, less form-like appearance.

5. **Header integration**: The inline-editable name replaces the static `<h1>` in the page header when on the Panoramica tab, or lives directly at the top of the tab content as a large editable heading.

### UX Details

- Hover state: subtle border/background change + pencil icon appears
- Edit state: field gets a bottom border or light outline, auto-focused
- Save: on blur or Enter (for name). Marks form as dirty so the global Save button appears.
- Empty description placeholder: "Clicca per aggiungere una descrizione..." in muted italic

### Scope

Only `src/pages/app/AgentDetail.tsx` is modified. No backend changes.

