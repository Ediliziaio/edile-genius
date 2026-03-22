-- Aggiorna le categorie dei template cantiere al valore corretto
UPDATE public.agent_templates
SET category = 'cantiere'
WHERE slug IN ('report-serale-cantiere', 'assistente-qualifica-lead-edile');
