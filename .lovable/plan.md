

# Share Modal + Enhanced Public Viewer

## Current State
- `useShareLinks.ts` already uses `galleryItems: GalleryItem[]` (not `progettoId`/`sessionIds`)
- `PublicShareViewer.tsx` exists but is minimal — no download, no branded header pattern, basic error screens
- Edge functions (`create-share-link`, `get-share-data`, `revoke-share-link`) are deployed and working with the `gallery_items` JSONB structure
- No `ShareModal` component exists yet
- No `ProgettoDetail` page exists — the integration point will be **RenderGallery** and **RenderGalleryDetail** pages

## Adaptations from Prompt
The prompt references `progettoId`, `sessionIds`, and `ProgettoDetail` — none of which exist. The real architecture uses `companyId` + `galleryItems [{table, id}]`. The ShareModal will accept gallery items directly.

## Plan

### 1. Create `src/components/share/ShareModal.tsx`
- Two tabs: "Crea" (create new link) and "Gestisci" (manage existing links)
- **Crea tab**: render selection checkboxes with thumbnails, toggle before/after, recipient name/email, message, expiry select
- **Gestisci tab**: list existing links with views count, expiry status, copy/revoke actions, ShareLinkCard subcomponent
- Accepts `galleryItems` prop (pre-selected items from gallery page) and `companyId`
- Uses existing `useShareLinks` hook

### 2. Enhance `src/pages/public/PublicShareViewer.tsx`
- Branded header with gradient overlay pattern and company logo/initial
- Personal message card for recipient
- RenderCard subcomponent with before/after pill toggle and download button
- Footer with company contacts + "Richiedi preventivo" mailto CTA
- Better loading spinner and distinct error/expired screens with icons
- Remove the redundant `supabase.functions.invoke` call (keep only direct fetch)

### 3. Integrate share button in `src/pages/app/RenderGallery.tsx`
- Add a "Condividi" button that opens ShareModal with selected gallery items
- Add checkbox selection mode for multi-select

### Files
- **Create**: `src/components/share/ShareModal.tsx`
- **Edit**: `src/pages/public/PublicShareViewer.tsx` (full redesign)
- **Edit**: `src/pages/app/RenderGallery.tsx` (add share button + selection)

