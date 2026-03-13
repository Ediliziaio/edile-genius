

# Condivisione Link Cliente — Piano di Implementazione

## Analisi dello Schema Esistente

Le tabelle referenziate nel prompt (`progetti`, `aziende`, `progetto_render_sessions`) **non esistono**. L'architettura va adattata allo schema reale:

- **Branding azienda** → tabella `companies` (ha `name`, `logo_url`, `website`, `phone`)
- **Render results** → gallery tables individuali (`render_gallery`, `render_stanza_gallery`, `render_facciata_gallery`, ecc.) con colonne `result_image_url` / `render_url` + `original_url` / `original_image_url`
- **Tenant** → `company_id` via `profiles.company_id`

## Modifiche rispetto al prompt originale

| Spec originale | Adattamento reale |
|---|---|
| `progetto_id` FK → `progetti` | `company_id` FK → `companies` (no progetti table) |
| `session_ids` → `progetto_render_sessions` | `gallery_items` JSONB array `[{table, id}]` per supportare gallery multi-modulo |
| `azienda_id` per branding | `company_id` → `companies` |
| `creato_da` → proprietà | `created_by` → `auth.users(id)` |

## Piano

### 1. Migration SQL — Crea `render_share_links`

```sql
CREATE TABLE render_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  gallery_items JSONB NOT NULL DEFAULT '[]',
  -- gallery_items format: [{"table":"render_stanza_gallery","id":"uuid"}, ...]
  nome_destinatario TEXT,
  email_destinatario TEXT,
  messaggio TEXT,
  titolo_pagina TEXT,
  colore_header TEXT,
  mostra_before BOOLEAN DEFAULT true,
  scade_il TIMESTAMPTZ,
  attivo BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  ultima_visita_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE render_share_links ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_share_links_token ON render_share_links(token) WHERE attivo = true;
CREATE INDEX idx_share_links_company ON render_share_links(company_id);

-- RLS: company members can CRUD their own links
CREATE POLICY "Company members manage share links"
  ON render_share_links FOR ALL TO authenticated
  USING (company_id = public.my_company())
  WITH CHECK (company_id = public.my_company());
```

### 2. Edge Function: `create-share-link`
- Auth required (getUser)
- Generates 32-byte crypto token
- Inserts into `render_share_links` with `company_id` from profile
- Returns `{ token, url, id }`
- CORS headers included

### 3. Edge Function: `get-share-data` (public, no auth)
- Accepts `?token=` query param
- Fetches share link, checks expiry/active
- Fetches `companies` row for branding (name, logo_url, website, phone)
- For each item in `gallery_items`, queries the appropriate gallery table to get `result_image_url` + `original_url`
- Increments `views_count` (fire-and-forget)
- Returns structured response with branding + renders array

### 4. Edge Function: `revoke-share-link`
- Auth required, owner-only (`created_by = user.id`)
- Sets `attivo = false`

### 5. Hook: `src/hooks/useShareLinks.ts`
- `createLink(opts)` → invokes `create-share-link`
- `revokeLink(linkId)` → invokes `revoke-share-link`
- `copyLink(token)` → clipboard
- `useQuery` for listing company's share links
- Stats: total, active, total views

### 6. Route: `/s/:token` (public)
- Add to `App.tsx` **outside** AuthGuard
- Lazy-load `PublicShareViewer` page (created in Doc 2/2)
- For now, create a minimal placeholder page that calls `get-share-data` and renders the data

### 7. Config updates
- Add all 3 functions to `supabase/config.toml` with `verify_jwt = false`

### Files to create/edit
- **Migration**: new table `render_share_links`
- **Create**: `supabase/functions/create-share-link/index.ts`
- **Create**: `supabase/functions/get-share-data/index.ts`
- **Create**: `supabase/functions/revoke-share-link/index.ts`
- **Create**: `src/hooks/useShareLinks.ts`
- **Create**: `src/pages/public/PublicShareViewer.tsx` (placeholder)
- **Edit**: `src/App.tsx` — add `/s/:token` public route
- **Edit**: `supabase/config.toml` — add 3 function entries

