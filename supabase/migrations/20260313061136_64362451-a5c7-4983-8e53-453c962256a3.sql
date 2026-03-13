
-- Drop all existing policies for bagno-originals bucket
DROP POLICY IF EXISTS "Upload foto bagno originali" ON storage.objects;
DROP POLICY IF EXISTS "Accesso privato bagno originali" ON storage.objects;
DROP POLICY IF EXISTS "Update bagno originals" ON storage.objects;
DROP POLICY IF EXISTS "Delete bagno originals" ON storage.objects;

-- INSERT: company users upload to their folder, superadmins bypass
CREATE POLICY "bagno_originals_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'bagno-originals'
  AND (
    (storage.foldername(name))[1] = public.my_company()::text
    OR public.has_role(auth.uid(), 'superadmin')
    OR public.has_role(auth.uid(), 'superadmin_user')
  )
);

-- SELECT: same logic
CREATE POLICY "bagno_originals_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'bagno-originals'
  AND (
    (storage.foldername(name))[1] = public.my_company()::text
    OR public.has_role(auth.uid(), 'superadmin')
    OR public.has_role(auth.uid(), 'superadmin_user')
  )
);

-- UPDATE: same logic
CREATE POLICY "bagno_originals_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'bagno-originals'
  AND (
    (storage.foldername(name))[1] = public.my_company()::text
    OR public.has_role(auth.uid(), 'superadmin')
    OR public.has_role(auth.uid(), 'superadmin_user')
  )
)
WITH CHECK (
  bucket_id = 'bagno-originals'
  AND (
    (storage.foldername(name))[1] = public.my_company()::text
    OR public.has_role(auth.uid(), 'superadmin')
    OR public.has_role(auth.uid(), 'superadmin_user')
  )
);

-- DELETE: same logic
CREATE POLICY "bagno_originals_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'bagno-originals'
  AND (
    (storage.foldername(name))[1] = public.my_company()::text
    OR public.has_role(auth.uid(), 'superadmin')
    OR public.has_role(auth.uid(), 'superadmin_user')
  )
);
