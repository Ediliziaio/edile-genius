
-- Trigger: auto-generate numero_preventivo in YYYY-NNNN format
CREATE OR REPLACE FUNCTION public.genera_numero_preventivo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _year TEXT;
  _seq INT;
BEGIN
  IF NEW.numero_preventivo IS NULL OR NEW.numero_preventivo = '' THEN
    _year := EXTRACT(YEAR FROM now())::TEXT;
    SELECT COALESCE(MAX(
      CASE WHEN numero_preventivo ~ ('^' || _year || '-\d+$')
           THEN SPLIT_PART(numero_preventivo, '-', 2)::INT
           ELSE 0 END
    ), 0) + 1
    INTO _seq
    FROM preventivi
    WHERE company_id = NEW.company_id;
    NEW.numero_preventivo := _year || '-' || LPAD(_seq::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_genera_numero_preventivo ON preventivi;
CREATE TRIGGER trg_genera_numero_preventivo
  BEFORE INSERT ON preventivi
  FOR EACH ROW
  EXECUTE FUNCTION genera_numero_preventivo();

-- Trigger: auto-update updated_at on preventivi
DROP TRIGGER IF EXISTS trg_set_updated_at_preventivi ON preventivi;
CREATE TRIGGER trg_set_updated_at_preventivi
  BEFORE UPDATE ON preventivi
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Trigger: auto-update updated_at on preventivo_templates
DROP TRIGGER IF EXISTS trg_set_updated_at_preventivo_templates ON preventivo_templates;
CREATE TRIGGER trg_set_updated_at_preventivo_templates
  BEFORE UPDATE ON preventivo_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Trigger: auto-update updated_at on preventivo_kb_documenti
DROP TRIGGER IF EXISTS trg_set_updated_at_preventivo_kb_documenti ON preventivo_kb_documenti;
CREATE TRIGGER trg_set_updated_at_preventivo_kb_documenti
  BEFORE UPDATE ON preventivo_kb_documenti
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
