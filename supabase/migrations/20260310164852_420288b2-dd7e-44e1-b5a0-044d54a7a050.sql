
-- Create knowledge-docs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-docs', 'knowledge-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: authenticated users can upload to their company folder
CREATE POLICY "company_upload_knowledge_docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-docs'
  AND (storage.foldername(name))[1] = (public.my_company())::text
);

-- RLS policy: authenticated users can read their company files
CREATE POLICY "company_read_knowledge_docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'knowledge-docs'
  AND (
    (storage.foldername(name))[1] = (public.my_company())::text
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin_user'::public.app_role)
  )
);

-- RLS policy: authenticated users can delete their company files
CREATE POLICY "company_delete_knowledge_docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'knowledge-docs'
  AND (
    (storage.foldername(name))[1] = (public.my_company())::text
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin_user'::public.app_role)
  )
);

-- Service role needs full access for edge functions
CREATE POLICY "service_role_knowledge_docs"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'knowledge-docs')
WITH CHECK (bucket_id = 'knowledge-docs');
