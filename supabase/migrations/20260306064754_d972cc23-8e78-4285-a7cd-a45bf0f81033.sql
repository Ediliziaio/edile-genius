
-- Create knowledge_base_files table
CREATE TABLE public.knowledge_base_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer DEFAULT 0,
  file_type text,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.knowledge_base_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_kb_files" ON public.knowledge_base_files
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_kb_files" ON public.knowledge_base_files
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- Create storage bucket for knowledge base
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-base', 'knowledge-base', false);

-- Storage policies
CREATE POLICY "company_kb_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'knowledge-base');

CREATE POLICY "company_kb_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'knowledge-base');

CREATE POLICY "company_kb_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'knowledge-base');
