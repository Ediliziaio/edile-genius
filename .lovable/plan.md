

# Create SuperAdmin User

There are no hardcoded credentials or existing edge functions to create a standalone superadmin user (without a company). I need to:

## Plan

1. **Create a temporary edge function** `create-superadmin` that:
   - Uses the service role key to call `supabase.auth.admin.createUser()` with email `f.andriciuc@overthemol.com` and password `Password2025!`
   - The `handle_new_user` trigger will auto-create the profile and assign `company_user` role
   - The function then updates the role from `company_user` to `superadmin` in `user_roles`
   - Returns success confirmation

2. **Deploy and invoke** the function to create the user

3. **Delete the edge function** after use (it's a one-time operation)

This is the only way since Supabase Auth user creation requires the service role key, which is only available server-side in edge functions.

