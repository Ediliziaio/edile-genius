CREATE POLICY "Update bagno originals"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'bagno-originals')
WITH CHECK (bucket_id = 'bagno-originals');

CREATE POLICY "Delete bagno originals"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'bagno-originals');