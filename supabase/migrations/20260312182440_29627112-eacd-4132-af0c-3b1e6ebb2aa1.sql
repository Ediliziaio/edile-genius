
-- Add preset_group column to render_infissi_presets
ALTER TABLE render_infissi_presets ADD COLUMN IF NOT EXISTS preset_group TEXT DEFAULT 'infisso';

-- Add colore_ral and colore_ncs columns if not exist
ALTER TABLE render_infissi_presets ADD COLUMN IF NOT EXISTS colore_ral TEXT;
ALTER TABLE render_infissi_presets ADD COLUMN IF NOT EXISTS colore_ncs TEXT;
ALTER TABLE render_infissi_presets ADD COLUMN IF NOT EXISTS finitura TEXT DEFAULT 'liscio_opaco';

-- Insert cassonetto material presets
INSERT INTO render_infissi_presets (category, name, value, prompt_fragment, icon, sort_order, is_active, preset_group) VALUES
('cassonetto_materiale', 'PVC Tradizionale', 'pvc_tradizionale', 'traditional PVC roller shutter box (cassonetto), smooth surface, standard rectangular profile, height approximately 160-200mm, integrated flush with the facade above the window frame', '🟦', 10, true, 'cassonetto'),
('cassonetto_materiale', 'PVC Slim', 'pvc_slim', 'slim PVC roller shutter box (cassonetto slim), reduced depth only 110-130mm visible height, minimalist profile nearly flush with the wall surface, modern architectural appearance', '▬', 20, true, 'cassonetto'),
('cassonetto_materiale', 'PVC Integrato a Muro', 'pvc_integrato', 'wall-integrated PVC cassonetto, completely recessed into the masonry with only the bottom access panel visible, invisible from outside appearance, maximum 30-40mm protrusion from wall plane', '🔲', 30, true, 'cassonetto'),
('cassonetto_materiale', 'Alluminio Coibentato', 'alluminio_coibentato', 'insulated aluminum cassonetto with polyurethane foam fill, anodized or powder-coated aluminum exterior panels, visible side inspection covers, professional finish matching the frame color', '⬜', 40, true, 'cassonetto');

-- Insert tapparella material presets
INSERT INTO render_infissi_presets (category, name, value, prompt_fragment, icon, sort_order, is_active, preset_group) VALUES
('tapparella_materiale', 'PVC Avvolgibile', 'pvc_avvolgibile', 'PVC roll-up shutter (tapparella avvolgibile), horizontal slats approximately 37-55mm wide, smooth rounded profile on each slat, uniform colored surface, slightly visible slat joints when closed, bottom rail with rubber seal', '🟩', 10, true, 'tapparella'),
('tapparella_materiale', 'Alluminio Avvolgibile', 'alluminio_avvolgibile', 'aluminum roll-up shutter (tapparella alluminio), extruded aluminum slats 37-55mm wide with foam fill for insulation, metallic appearance with slight sheen, precise slat-to-slat alignment, heavier appearance than PVC, bottom profile with rubber weatherstrip', '🔩', 20, true, 'tapparella'),
('tapparella_materiale', 'Tapparella Microforata', 'microforata', 'microperforated roll-up shutter (tapparella microforata), PVC or aluminum slats with small round perforations 3-5mm diameter in regular grid pattern, allows filtered light and partial vision', '🔳', 30, true, 'tapparella'),
('tapparella_materiale', 'Persiana in Alluminio', 'persiana_alluminio', 'aluminum louvered shutter (persiana alluminio), horizontal adjustable slats 60-80mm wide, visible pivot pins on side frames, slats can be seen at slight angle when partially open, traditional Mediterranean appearance, side guides with integral channels', '🪟', 40, true, 'tapparella'),
('tapparella_materiale', 'Veneziana Integrata', 'veneziana_integrata', 'integrated venetian blind system, horizontal aluminum slats 25mm wide enclosed between the two glass panes, visible as thin lines inside the double-glazing unit, operated by external handle on the frame, completely weather-protected, ultra-modern minimal appearance', '☰', 50, true, 'tapparella');

-- Insert cassonetto color presets
INSERT INTO render_infissi_presets (category, name, value, prompt_fragment, icon, sort_order, is_active, preset_group, colore_ral) VALUES
('cassonetto_colore', 'Uguale Infisso', 'uguale_infisso', 'exact same color as the new window frame — perfectly matching', '🔁', 5, true, 'colore_cassonetto', NULL),
('cassonetto_colore', 'Bianco', 'bianco_9016', 'RAL 9016 traffic white, smooth matte finish', '⬜', 10, true, 'colore_cassonetto', '9016'),
('cassonetto_colore', 'Bianco Puro', 'bianco_9010', 'RAL 9010 pure white, slightly warm tone, smooth matte', '🤍', 15, true, 'colore_cassonetto', '9010'),
('cassonetto_colore', 'Grigio Antracite', 'grigio_7016', 'RAL 7016 anthracite grey, dark grey smooth matte surface', '🩶', 20, true, 'colore_cassonetto', '7016'),
('cassonetto_colore', 'Grigio Chiaro', 'grigio_7035', 'RAL 7035 light grey, neutral medium-light grey smooth matte', '⬜', 25, true, 'colore_cassonetto', '7035'),
('cassonetto_colore', 'Nero', 'nero_9005', 'RAL 9005 jet black, deep black smooth matte finish', '⬛', 30, true, 'colore_cassonetto', '9005'),
('cassonetto_colore', 'Marrone', 'marrone_8014', 'RAL 8014 sepia brown, medium warm brown smooth matte', '🟫', 35, true, 'colore_cassonetto', '8014'),
('cassonetto_colore', 'Sabbia', 'sabbia_1015', 'RAL 1015 light ivory, warm sandy beige smooth matte', '🟨', 40, true, 'colore_cassonetto', '1015'),
('cassonetto_colore', 'Noce', 'noce_8003', 'RAL 8003 clay brown, rusty brown wood-like tone smooth matte', '🟤', 45, true, 'colore_cassonetto', '8003'),
('cassonetto_colore', 'Verde Muschio', 'verde_6005', 'RAL 6005 moss green, deep forest green smooth matte', '🟢', 50, true, 'colore_cassonetto', '6005'),
('cassonetto_colore', 'Bronzo', 'bronzo_8019', 'RAL 8019 grey brown, dark bronze-grey smooth matte', '🟤', 55, true, 'colore_cassonetto', '8019');

-- Insert tapparella color presets
INSERT INTO render_infissi_presets (category, name, value, prompt_fragment, icon, sort_order, is_active, preset_group, colore_ral) VALUES
('tapparella_colore', 'Uguale Infisso', 'uguale_infisso', 'exact same color as the new window frame', '🔁', 5, true, 'colore_tapparella', NULL),
('tapparella_colore', 'Bianco', 'bianco_9016', 'RAL 9016 traffic white slats', '⬜', 10, true, 'colore_tapparella', '9016'),
('tapparella_colore', 'Grigio Antracite', 'grigio_7016', 'RAL 7016 anthracite grey slats', '🩶', 20, true, 'colore_tapparella', '7016'),
('tapparella_colore', 'Grigio Perla', 'grigio_9022', 'RAL 9022 pearl light grey slats', '⬜', 25, true, 'colore_tapparella', '9022'),
('tapparella_colore', 'Nero', 'nero_9005', 'RAL 9005 jet black slats', '⬛', 30, true, 'colore_tapparella', '9005'),
('tapparella_colore', 'Marrone', 'marrone_8014', 'RAL 8014 sepia brown slats', '🟫', 35, true, 'colore_tapparella', '8014'),
('tapparella_colore', 'Beige', 'beige_1001', 'RAL 1001 beige slats, warm sandy tone', '🟨', 40, true, 'colore_tapparella', '1001'),
('tapparella_colore', 'Terracotta', 'terracotta_3009', 'RAL 3009 oxide red, warm terracotta slats', '🧱', 45, true, 'colore_tapparella', '3009'),
('tapparella_colore', 'Verde', 'verde_6005', 'RAL 6005 moss green slats', '🟢', 50, true, 'colore_tapparella', '6005');
