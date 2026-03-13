

# Fix: Storage upload RLS error on `bagno-originals`

## Problem
The photo upload to `bagno-originals` fails with `"new row violates row-level security policy"` (403). The upload call uses `upsert: true`, which requires **both** INSERT and UPDATE storage RLS policies. There is no UPDATE policy on `storage.objects` for `bagno-originals`, causing the failure.

## Fix

### 1. Add UPDATE storage RLS policy via migration
Add an UPDATE policy for the `bagno-originals` bucket so that upserts work:

```sql
CREATE POLICY "Update bagno originals"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'bagno-originals')
WITH CHECK (bucket_id = 'bagno-originals');
```

Also add a DELETE policy (needed for re-uploads/cleanup):

```sql
CREATE POLICY "Delete bagno originals"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'bagno-originals');
```

### 2. (Alternative) Remove `upsert: true`
Instead of adding the policy, change the upload call in `RenderBagnoNew.tsx` line 321 to remove `upsert: true`. Since each session generates a unique path (`{companyId}/{sessionId}/originale.{ext}`), there is no need for upsert — the path is always unique.

**Recommended approach**: Do both — add the UPDATE policy for robustness AND keep upsert for resilience.

### Scope
- One SQL migration (2 new storage policies)
- No client code changes needed

