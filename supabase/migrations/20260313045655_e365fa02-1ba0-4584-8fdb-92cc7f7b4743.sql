
-- ─────────────────────────────────────────────────────────
-- TABELLA PRESETS (catalogo elementi bagno)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS render_bagno_presets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category    TEXT NOT NULL,
    name        TEXT NOT NULL,
    value       TEXT NOT NULL,
    prompt_fragment TEXT,
    hex         TEXT,
    icon        TEXT,
    sort_order  INT  DEFAULT 0,
    is_active   BOOL DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- SESSIONI RENDER BAGNO (multi-tenant con company_id)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS render_bagno_sessions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    stato                 TEXT DEFAULT 'bozza',
    tipo_intervento       TEXT DEFAULT 'restyling',
    foto_originale_path   TEXT,
    foto_originale_url    TEXT,
    analisi_bagno         JSONB DEFAULT '{}',
    configurazione        JSONB DEFAULT '{}',
    render_result_path    TEXT,
    render_result_url     TEXT,
    prompt_usato          TEXT,
    prompt_blocks         JSONB,
    prompt_version        TEXT,
    provider_key          TEXT,
    cost_real             NUMERIC,
    cost_billed           NUMERIC,
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    crediti_usati         INT  DEFAULT 1,
    error_message         TEXT,
    metadata              JSONB DEFAULT '{}',
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- GALLERY
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS render_bagno_gallery (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id      UUID REFERENCES render_bagno_sessions(id) ON DELETE SET NULL,
    titolo          TEXT,
    originale_url   TEXT,
    render_url      TEXT NOT NULL,
    thumbnail_url   TEXT,
    configurazione  JSONB DEFAULT '{}',
    share_token     TEXT,
    likes           INT  DEFAULT 0,
    is_public       BOOL DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────
ALTER TABLE render_bagno_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE render_bagno_gallery  ENABLE ROW LEVEL SECURITY;
ALTER TABLE render_bagno_presets  ENABLE ROW LEVEL SECURITY;

-- Sessions: company users see their own company's sessions
CREATE POLICY "Company users manage own sessions"
  ON render_bagno_sessions FOR ALL
  USING (company_id = public.my_company());

-- Sessions: superadmin can see all
CREATE POLICY "Superadmin full access sessions"
  ON render_bagno_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'superadmin'));

-- Gallery: company users see own + public
CREATE POLICY "Company users manage own gallery"
  ON render_bagno_gallery FOR ALL
  USING (company_id = public.my_company() OR is_public = TRUE);

-- Gallery: superadmin
CREATE POLICY "Superadmin full access gallery"
  ON render_bagno_gallery FOR ALL
  USING (public.has_role(auth.uid(), 'superadmin'));

-- Presets: public read
CREATE POLICY "Presets pubblici"
  ON render_bagno_presets FOR SELECT USING (TRUE);

-- Presets: superadmin write
CREATE POLICY "Superadmin manage presets"
  ON render_bagno_presets FOR ALL
  USING (public.has_role(auth.uid(), 'superadmin'));

-- ─────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('bagno-originals', 'bagno-originals', false,
   10485760,
   ARRAY['image/jpeg','image/png','image/webp','image/heic']),
  ('bagno-results',   'bagno-results',   true,
   20971520,
   ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Upload foto bagno originali"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bagno-originals' AND auth.role() = 'authenticated');

CREATE POLICY "Accesso privato bagno originali"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bagno-originals' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Accesso pubblico bagno risultati"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bagno-results');

CREATE POLICY "Upload bagno risultati"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bagno-results' AND auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────
-- SEED PRESETS
-- ─────────────────────────────────────────────────────────
INSERT INTO render_bagno_presets (category, name, value, prompt_fragment, hex, icon, sort_order) VALUES

-- EFFETTI PIASTRELLA
('piastrella_effetto','Effetto Marmo Carrara','marmo_carrara','Carrara white marble effect — white base with soft grey veining, natural stone appearance, polished or satin finish','#F5F5F0','🤍',1),
('piastrella_effetto','Effetto Marmo Calacatta','marmo_calacatta','Calacatta gold marble effect — bright white base with bold dramatic gold-grey veining, premium luxury appearance','#F8F4E8','✨',2),
('piastrella_effetto','Effetto Marmo Sahara Noir','marmo_sahara_noir','Sahara Noir black marble effect — deep black base with elegant gold/white veining, dramatic luxury finish','#1A1A1A','🖤',3),
('piastrella_effetto','Effetto Marmo Marquinia','marmo_marquinia','Marquinia black marble effect — very dark near-black base with fine white veining network, sophisticated appearance','#0D0D0D','⚫',4),
('piastrella_effetto','Effetto Marmo Verde Guatemala','marmo_verde_guatemala','Verde Guatemala marble effect — deep forest green base with white/grey veining, bold natural stone appearance','#2D4A2D','💚',5),
('piastrella_effetto','Effetto Marmo Statuario','marmo_statuario','Statuario marble effect — pure bright white base with thin grey-blue veining, classic refined luxury appearance','#FAFAFA','🏛️',6),
('piastrella_effetto','Effetto Marmo Emperador','marmo_emperador','Dark Emperador brown marble effect — deep warm brown base with lighter cream/beige veining network','#3A2218','🟤',7),
('piastrella_effetto','Effetto Cemento Grigio','cemento_grigio','Concrete grey effect — medium grey base with subtle aggregate texture, industrial minimalist finish, matte surface','#888888','🩶',10),
('piastrella_effetto','Effetto Cemento Bianco','cemento_bianco','White concrete effect — pale grey-white base with very fine aggregate texture, soft industrial appearance, matte finish','#E0DDD8','🤍',11),
('piastrella_effetto','Effetto Cemento Antracite','cemento_antracite','Anthracite concrete effect — very dark grey near-black base with fine aggregate texture, bold industrial aesthetic','#2A2A2A','⬛',12),
('piastrella_effetto','Effetto Cemento Beige','cemento_beige','Warm beige concrete effect — warm light-beige base with fine aggregate texture, softer warm industrial appearance','#C8BEA8','🫙',13),
('piastrella_effetto','Effetto Legno Rovere Chiaro','legno_rovere_chiaro','Light oak wood-look porcelain tile — warm honey-beige base with parallel oak grain texture, used on floors only typically','#C8A870','🌿',20),
('piastrella_effetto','Effetto Legno Rovere Scuro','legno_rovere_scuro','Dark oak wood-look porcelain — medium-dark brown with distinct oak grain, rich warm flooring appearance','#6B4A2A','🌳',21),
('piastrella_effetto','Effetto Legno Wengé','legno_wenge','Wengé wood-look porcelain — very dark espresso brown with contrasting lighter grain lines, premium modern appearance','#2C1A0E','🪵',22),
('piastrella_effetto','Effetto Pietra Ardesia','pietra_ardesia','Slate stone effect — dark grey-black base with characteristic cleavage texture and subtle colour variation, natural rough surface','#3A3A40','⛰️',30),
('piastrella_effetto','Effetto Travertino','travertino','Travertino effect — warm ivory-beige base with characteristic linear voids/pores, classic Mediterranean stone appearance','#D4C4A0','🏺',31),
('piastrella_effetto','Effetto Pietra Basalto','basalto','Basalt stone effect — dark charcoal grey with fine crystalline texture, contemporary industrial-natural appearance','#454545','🌑',32),
('piastrella_effetto','Monocromo Bianco Lucido','mono_bianco','Gloss white ceramic tile — bright uniform white surface with specular high-gloss reflective finish','#FFFFFF','⬜',40),
('piastrella_effetto','Monocromo Nero Lucido','mono_nero','Gloss black porcelain — deep uniform black with specular reflective finish, dramatic and elegant','#0A0A0A','⬛',41),
('piastrella_effetto','Monocromo Grigio Medio','mono_grigio','Medium grey porcelain — neutral mid-grey uniform surface, matte or satin finish','#888888','🔲',42),
('piastrella_effetto','Monocromo Verde Salvia','mono_verde_salvia','Sage green ceramic tile — soft muted sage green uniform surface, matte finish, natural botanical aesthetic','#8A9E80','🌿',43),
('piastrella_effetto','Monocromo Blu Navy','mono_blu_navy','Navy blue ceramic tile — deep rich navy blue uniform surface, matte finish, classic Mediterranean appeal','#1F2D5A','💙',44),
('piastrella_effetto','Monocromo Terracotta','mono_terracotta','Terracotta ceramic tile — warm red-orange-brown uniform surface, matte unglazed finish, rustic Mediterranean style','#C4622D','🟧',45),
('piastrella_effetto','Monocromo Greige','mono_greige','Greige (grey-beige) porcelain — warm neutral greige uniform surface, contemporary understated appearance','#C0B49A','🫱',46),
('piastrella_effetto','Mosaico Esagoni','mosaico_esagoni','Hexagonal mosaic tiles — small hexagon tiles (25-50mm) arranged in honeycomb pattern, classic bathroom vintage/modern aesthetic, grout lines create decorative network','#E8E8E0','⬡',50),
('piastrella_effetto','Mosaico Penny Round','mosaico_penny','Penny round mosaic — small circular tiles (25mm diameter) on mesh, tight uniform circles creating organic dotted pattern','#E0E0D8','⚪',51),
('piastrella_effetto','Mosaico Subway Classico','mosaico_subway','Classic subway tile — rectangular brickwork tiles (7.5x15cm or 10x20cm), staggered bond pattern, timeless bathroom aesthetic','#F2F0EB','🧱',52),
('piastrella_effetto','Mosaico Chevron','mosaico_chevron','Chevron/herringbone mosaic — small elongated tiles arranged in V-pattern, creates dynamic directional movement','#E5E3DC','〽️',53),

-- FORMATI PIASTRELLA
('piastrella_formato','10×10 cm','10x10','10×10cm small square tiles',NULL,'▫️',1),
('piastrella_formato','20×20 cm','20x20','20×20cm square tiles',NULL,'◾',2),
('piastrella_formato','30×60 cm','30x60','30×60cm rectangular tiles',NULL,'▬',3),
('piastrella_formato','60×60 cm','60x60','60×60cm large square tiles',NULL,'🔲',4),
('piastrella_formato','60×120 cm','60x120','60×120cm large format slabs',NULL,'▭',5),
('piastrella_formato','120×120 cm','120x120','120×120cm XL format slabs',NULL,'⬛',6),
('piastrella_formato','Lastra 120×240','lastra','large format slab 120×240cm, minimal grout lines',NULL,'📄',7),

-- POSA (PATTERN)
('piastrella_posa','Corsi orizzontali','orizzontale','tiles laid in straight horizontal courses, joints aligned vertically',NULL,'═',1),
('piastrella_posa','Corsi verticali','verticale','tiles laid in straight vertical courses, visually elongates the wall',NULL,'║',2),
('piastrella_posa','Sfalsata 50%','sfalsata_50','staggered brick-bond layout, each row offset by 50% of tile width',NULL,'≡',3),
('piastrella_posa','Sfalsata 33%','sfalsata_33','staggered bond with 1/3 offset, creates modern linear flow',NULL,'≣',4),
('piastrella_posa','Spina di Pesce','spina_pesce','herringbone pattern at 45°, classic elegant floor/wall layout',NULL,'〽️',5),
('piastrella_posa','Diagonale 45°','diagonale','tiles rotated 45° to wall plane, diagonal diamond orientation',NULL,'◇',6),
('piastrella_posa','Quadri dritti','quadri_dritti','standard grid pattern, joints perpendicular and parallel to walls',NULL,'#',7),

-- COLORI FUGA
('fuga_colore','Fuga Bianca','fuga_bianca',NULL,'#F5F5F5','⬜',1),
('fuga_colore','Fuga Grigio Chiaro','fuga_grigio_chiaro',NULL,'#CCCCCC','🔲',2),
('fuga_colore','Fuga Grigio Medio','fuga_grigio',NULL,'#888888','⬛',3),
('fuga_colore','Fuga Nera','fuga_nera',NULL,'#1A1A1A','⬛',4),
('fuga_colore','Fuga Avorio','fuga_avorio',NULL,'#E8D8B0','🫙',5),
('fuga_colore','Fuga Terracotta','fuga_terracotta',NULL,'#C4622D','🟧',6),

-- TIPI DOCCIA
('doccia_tipo','Walk-In (nessun box)','walk_in','open walk-in shower — no glass door or enclosure, partially open design, single fixed glass panel or completely open, modern minimalist style',NULL,'🚿',1),
('doccia_tipo','Nicchia con box','nicchia_box','shower alcove (nicchia) with glass enclosure on one side, two or three walls of tile, one glass door/panel',NULL,'📦',2),
('doccia_tipo','Angolare','angolare','corner shower with two glass panels meeting at 90°, fits into room corner',NULL,'📐',3),
('doccia_tipo','Semicircolare','semicircolare','quadrant/semi-circular shower enclosure with curved glass panel, rounded corner design',NULL,'◗',4),
('doccia_tipo','Vasca + Doccia','vasca_doccia_combo','shower over bath combination — shower area above existing bath, shower screen or curtain rail',NULL,'🛁',5),

-- BOX DOCCIA
('doccia_box','Trasparente 8mm','box_trasparente','clear 8mm tempered glass panels — transparent, maximizes light, frameless or semi-frameless appearance',NULL,'🔲',1),
('doccia_box','Satinato/Opaco','box_satinato','frosted/satin glass panels — translucent, provides privacy while allowing diffused light',NULL,'🔳',2),
('doccia_box','Fumé/Grigio','box_fume','smoked grey tinted glass — semi-transparent dark grey glass, adds depth and luxury feel',NULL,'⬛',3),
('doccia_box','Extra Chiaro','box_extrachiaro','ultra-clear low-iron glass — completely transparent without any green tint, crystal clear appearance',NULL,'💎',4),
('doccia_box','Senza box (Walk-In)','box_nessuno','no glass enclosure — open walk-in concept, no box or screen',NULL,'🚿',5),

-- PIATTO DOCCIA
('doccia_piatto','Ceramica Bianca','piatto_ceramica','white ceramic shower tray, standard rectangular form, anti-slip texture on surface','#FFFFFF','⬜',1),
('doccia_piatto','Pietra/Ardesia','piatto_ardesia','slate stone shower tray or large-format stone effect tile, dark grey-black anti-slip textured surface','#3A3A40','⬛',2),
('doccia_piatto','Resina Grigia','piatto_resina_grigio','grey resin shower tray, ultra-flat low-profile design, smooth matte surface with subtle texture','#888888','🔲',3),
('doccia_piatto','Resina Nera','piatto_resina_nero','black resin shower tray, ultra-flat, matte black smooth surface, dramatic modern look','#1A1A1A','⬛',4),
('doccia_piatto','Gres a raso pavimento','piatto_gres_filo','flush-to-floor drain with matching large-format porcelain, completely level with bathroom floor, linear drain visible',NULL,'▬',5),

-- PROFILI DOCCIA
('doccia_profilo','Cromo Lucido','profilo_cromo','polished chrome framing profiles and fittings, classic bright metallic appearance','#C0C0C0','⚪',1),
('doccia_profilo','Nero Opaco','profilo_nero','matte black framing profiles and hardware, modern industrial look, no specular reflection','#1A1A1A','⬛',2),
('doccia_profilo','Oro/Gold','profilo_oro','gold PVD coated profiles, warm metallic luxury finish','#C9A84C','🟡',3),
('doccia_profilo','Inox Spazzolato','profilo_inox','brushed stainless steel profiles, directional satin finish, contemporary understated look','#9BA0A0','🔘',4),
('doccia_profilo','Bronzo Anticato','profilo_bronzo','antique bronze patina profiles, warm irregular oxidized surface, classic-modern fusion','#7C5B3E','🟤',5),

-- VASCA
('vasca_tipo','Incassata Standard','vasca_incassata','built-in bathtub recessed into floor level or alcove, three or more sides tiled/paneled, one open long side, standard residential installation',NULL,'🛁',1),
('vasca_tipo','Freestanding Centro','vasca_freestanding','freestanding bathtub standing independently on bathroom floor, fully visible on all sides, no wall contact, architectural centerpiece',NULL,'🏺',2),
('vasca_tipo','Freestanding a Muro','vasca_freestanding_muro','freestanding bathtub positioned against one wall, three sides visible, back against wall',NULL,'🛁',3),
('vasca_tipo','Angolare','vasca_angolare','corner bathtub fitting into room corner, diagonal or square format, two sides against walls',NULL,'📐',4),
('vasca_tipo','Idromassaggio','vasca_idro','whirlpool/jacuzzi bathtub with visible jet nozzles on interior walls and floor, larger format',NULL,'💦',5),

('vasca_forma','Rettangolare','forma_rett','rectangular bathtub with straight sides and sharp or slightly rounded corners',NULL,'▭',1),
('vasca_forma','Ovale','forma_ovale','oval-shaped bathtub with smooth curved ends, elegant classic silhouette',NULL,'⬭',2),
('vasca_forma','Retrò Zampe Leone','forma_retro','clawfoot bathtub — pedestal legs at corners, vintage/retro aesthetic, curved sides, period-appropriate silhouette',NULL,'🦁',3),
('vasca_forma','Asimmetrica','forma_asimm','asymmetric bathtub with one ergonomic sloped end and one squared end, ergonomic reclining design',NULL,'〰️',4),

('vasca_materiale','Bianca Lucida','vasca_bianca_lucida','white high-gloss acrylic or ceramic bathtub, smooth specular surface, classic clean appearance','#FFFFFF','⬜',1),
('vasca_materiale','Bianca Opaca','vasca_bianca_opaca','white matte acrylic bathtub, smooth non-reflective surface, contemporary understated look','#F5F5F5','🤍',2),
('vasca_materiale','Nera Opaca','vasca_nera_opaca','matte black acrylic bathtub, smooth non-reflective dark surface, dramatic modern luxury appearance','#1A1A1A','🖤',3),
('vasca_materiale','Grigia','vasca_grigia','grey matte acrylic bathtub, smooth neutral grey surface','#888888','🩶',4),
('vasca_materiale','Pietra/Stone','vasca_pietra','natural stone or stone composite bathtub, natural stone texture and coloring visible, organic luxury aesthetic','#8C8070','🪨',5),
('vasca_materiale','Ottone/Rame','vasca_ottone','brass or copper freestanding bathtub, warm metallic exterior finish, artisan luxury appearance','#B07D40','🟤',6),

-- MOBILE BAGNO (VANITY)
('vanity_stile','Moderno Sospeso','vanity_sospeso_moderno','wall-hung floating bathroom vanity, no floor contact, gap between cabinet and floor creating floating effect, clean modern appearance',NULL,'🔲',1),
('vanity_stile','Classico a Terra','vanity_terra_classico','floor-standing bathroom vanity with legs or full base panel, traditional installation touching floor, classic Italian style',NULL,'🪑',2),
('vanity_stile','Industrial','vanity_industrial','industrial-style vanity with visible metal frame, open shelf below, factory/loft aesthetic',NULL,'🔩',3),
('vanity_stile','Scandinavo','vanity_scandinavo','Scandinavian-style vanity, natural wood (light oak) and white combination, minimal hardware, warm Nordic aesthetic',NULL,'🌲',4),

('vanity_colore','Bianco Lucido','vanity_bianco_lucido',NULL,'#FFFFFF','⬜',1),
('vanity_colore','Bianco Opaco','vanity_bianco_opaco',NULL,'#F5F5F5','🤍',2),
('vanity_colore','Grigio Chiaro','vanity_grigio_chiaro',NULL,'#C8C8C8','🔲',3),
('vanity_colore','Antracite','vanity_antracite',NULL,'#3A3A3A','⬛',4),
('vanity_colore','Nero Opaco','vanity_nero',NULL,'#1A1A1A','🖤',5),
('vanity_colore','Rovere Naturale','vanity_rovere',NULL,'#C8A870','🌿',6),
('vanity_colore','Rovere Fumé','vanity_rovere_fume',NULL,'#6B5040','🍂',7),
('vanity_colore','Verde Petrolio','vanity_verde_petrolio',NULL,'#2D5A4A','💚',8),
('vanity_colore','Tortora','vanity_tortora',NULL,'#C0A880','🫙',9),
('vanity_colore','Bordeaux','vanity_bordeaux',NULL,'#5A1A2A','🍷',10),

('vanity_piano','Integrato Ceramica','piano_ceramica','integrated ceramic top, seamless connection with cabinet body, practical hygienic surface',NULL,'⬜',1),
('vanity_piano','Marmo Bianco','piano_marmo','white marble countertop (natural or engineered stone), visible veining, luxury premium appearance',NULL,'🤍',2),
('vanity_piano','Effetto Cemento','piano_cemento','concrete effect countertop, matte grey-beige textured surface, industrial modern style',NULL,'🔲',3),
('vanity_piano','Legno/Teak','piano_legno','natural wood or teak countertop, warm grain visible, natural organic touch',NULL,'🪵',4),

-- RUBINETTERIA
('rubinetteria_finitura','Cromo Lucido','cromo','polished chrome — bright specular metallic reflection, classic bathroom hardware finish','#C0C0C0','⚪',1),
('rubinetteria_finitura','Nero Opaco','nero_opaco','matte black — no specular reflection, modern bold appearance','#1A1A1A','⬛',2),
('rubinetteria_finitura','Oro PVD','oro','polished gold PVD coating — warm yellow specular reflection, luxury appearance','#C9A84C','🟡',3),
('rubinetteria_finitura','Oro Spazzolato','oro_spazz','brushed gold — warm directional satin gold finish','#B09040','🌕',4),
('rubinetteria_finitura','Inox Spazzolato','inox','brushed stainless steel — cool satin directional micro-lines','#9BA0A0','🔘',5),
('rubinetteria_finitura','Bronzo Anticato','bronzo','antique bronze patina — warm irregular oxidized surface finish','#7C5B3E','🟤',6),
('rubinetteria_finitura','Ottone Spazzolato','ottone','brushed unlacquered brass — warm golden-amber directional satin finish','#B8902A','🌟',7),
('rubinetteria_finitura','Nero Lucido','nero_lucido','gloss black — specular reflection, dramatic premium appearance','#0D0D0D','🖤',8),

-- STILE RUBINETTERIA
('rubinetteria_stile','Minimal Quadro','stile_quadro','squared minimal tap/faucet with sharp 90° edges, flat faces, Bauhaus aesthetic',NULL,'▬',1),
('rubinetteria_stile','Tondo Classico','stile_tondo','round/oval tap body with cylindrical forms, classic timeless bathroom hardware',NULL,'⭕',2),
('rubinetteria_stile','Industrial','stile_industrial','industrial-style tap with exposed pipe sections, cross-head handles, loft aesthetic',NULL,'🔧',3),
('rubinetteria_stile','Retro/Vintage','stile_vintage','vintage-style tap with traditional curved body, porcelain handles or bridge mixer',NULL,'🏺',4),

-- PARETI
('parete_tipo','Tinta Intera','parete_tinta','painted wall with uniform single colour, smooth plaster finish',NULL,'🎨',1),
('parete_tipo','Tinta + Piastrelle','parete_mista','lower half tiled, upper half painted — classic combination with visible tile/paint boundary',NULL,'🔲',2),
('parete_tipo','Lastra Cemento','parete_lastra_cemento','large concrete panel cladding on wall, seamless matte grey-beige surface',NULL,'🔳',3),
('parete_tipo','Lastra Pietra','parete_lastra_pietra','stone panel cladding — natural or engineered stone slabs applied to wall surface',NULL,'🪨',4),
('parete_tipo','Solo Piastrelle','parete_piastrelle','fully tiled wall floor to ceiling, no painted section',NULL,'🧱',5),

-- ILLUMINAZIONE
('illuminazione','Faretti a Incasso','faretti','recessed ceiling spotlights, circular white/chrome trim, focused downlights',NULL,'💡',1),
('illuminazione','Plafoniera','plafoniera','ceiling flush-mounted or surface-mounted light fixture',NULL,'🔆',2),
('illuminazione','Specchio Illuminato','specchio_led','LED-illuminated mirror, built-in edge lighting or backlit halo effect around mirror perimeter',NULL,'🪞',3),
('illuminazione','LED Profilo Incasso','led_profilo','recessed LED profile lighting at ceiling perimeter or wall niche, indirect ambient glow',NULL,'✨',4);
