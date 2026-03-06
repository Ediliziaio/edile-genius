
-- Drop existing triggers if any
DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
DROP TRIGGER IF EXISTS trg_agents_updated_at ON public.agents;
DROP TRIGGER IF EXISTS trg_contacts_updated_at ON public.contacts;
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trg_sync_list_count ON public.contact_list_members;

-- 1. Create set_updated_at triggers
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Create sync_list_count trigger
CREATE TRIGGER trg_sync_list_count
  AFTER INSERT OR DELETE ON public.contact_list_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_list_count();

-- 3. Change contacts.status default to 'new'
ALTER TABLE public.contacts ALTER COLUMN status SET DEFAULT 'new';
