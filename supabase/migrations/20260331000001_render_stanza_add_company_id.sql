-- Fix P0-STA-01 & P0-STA-02: Add company_id to render_stanza_sessions and render_stanza_gallery
-- These tables were missing company_id, making multi-user isolation impossible.

-- 1. Add company_id to render_stanza_sessions
ALTER TABLE render_stanza_sessions
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 2. Backfill existing sessions using the user's company from profiles
UPDATE render_stanza_sessions s
SET company_id = p.company_id
FROM profiles p
WHERE s.user_id = p.id
  AND s.company_id IS NULL
  AND p.company_id IS NOT NULL;

-- 3. Add company_id to render_stanza_gallery
ALTER TABLE render_stanza_gallery
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 4. Backfill existing gallery records using the user's company from profiles
UPDATE render_stanza_gallery g
SET company_id = p.company_id
FROM profiles p
WHERE g.user_id = p.id
  AND g.company_id IS NULL
  AND p.company_id IS NOT NULL;

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_render_stanza_sessions_company_id ON render_stanza_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_render_stanza_gallery_company_id ON render_stanza_gallery(company_id);
