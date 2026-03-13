

# Impostazioni Azienda + Sistema Permessi Utenti

## Analysis

The prompt requests a complete Settings redesign with a multi-tier permission system. Critical schema mismatches with the existing codebase:

- **No `aziende` table** — the app uses `companies` (English column names: `name`, `logo_url`, `phone`, `address`, `website`, `sector`, `plan`)
- **No `azienda_members` table** — users are linked to companies via `profiles.company_id`
- **No `useAziendaContext` hook** — the app uses `useAuth()` + `useCompanyId()`
- The existing Settings.tsx (856 lines) has 6 tabs: Profile, API, CRM, Webhooks, Notifiche, Fatturazione

The new tables (`piattaforma_features`, `azienda_features_sbloccate`, `user_feature_permissions`, `user_feature_usage`, `azienda_inviti`) don't exist and must be created. Since we can't run migrations directly, we'll reference them via `as any` casts and the tables will need to be created in Supabase separately.

## Adaptation Strategy

- Replace all `aziende` references with `companies` and map column names (nome→name, telefono→phone, etc.)
- Replace `azienda_members` with `profiles` table queries filtered by `company_id`
- Replace `useAziendaContext` with existing `useAuth()` + `useCompanyId()`
- Use `company_id` instead of `azienda_id` in all new tables
- The invite system will use `azienda_inviti` (new table) but member listing uses `profiles`

## Plan

This is a large feature. I'll implement it in logical order:

### 1. Rewrite Settings page as vertical sidebar layout
**Edit**: `src/pages/app/Settings.tsx`
- Replace horizontal tabs with vertical sidebar navigation (desktop) + horizontal scroll (mobile)
- 7 tabs: Profilo, Piano & Funzioni, Utenti, API, Webhooks, Notifiche, Fatturazione
- Extract existing tab content into sub-components
- Use `useSearchParams` for tab routing

### 2. Create `useAziendaSettings` hook
**Create**: `src/hooks/useAziendaSettings.ts`
- Queries `piattaforma_features`, `azienda_features_sbloccate`, `user_feature_permissions`, `user_feature_usage` (all via `as any` casts)
- Members list from `profiles` filtered by `company_id`
- Mutations: `aggiornaPermesso`, `rimuoviMembro`, `cambiaRuolo`
- `invitaUtente` calls `invita-membro` edge function

### 3. Create TabProfilo component
**Create**: `src/components/impostazioni/TabProfilo.tsx`
- Company logo upload with hover overlay
- Brand color picker with presets + live preview badge
- Company data form (name, email, phone, website, address, description)
- Maps to `companies` table columns

### 4. Create TabPiano component
**Create**: `src/components/impostazioni/TabPiano.tsx`
- Gradient hero card showing current plan + feature unlock percentage
- Features grouped by category (render, preventivi, agenti_ai, automazioni, crm)
- Per-feature: active/locked state, monthly usage bar, credit cost
- Upgrade CTA at bottom

### 5. Create TabUtenti component
**Create**: `src/components/impostazioni/TabUtenti.tsx`
- Stats row (total users, admins, active)
- Search bar + user list with avatar, role badge, last access
- Role selector dropdown (owner/admin/membro) for admins
- "Permessi" button opens UserPermissionsModal
- "Invita utente" button opens InvitaUtenteModal

### 6. Create UserPermissionsModal
**Create**: `src/components/impostazioni/UserPermissionsModal.tsx`
- Shows all company-unlocked features grouped by category
- Per-feature: toggle switch, monthly/daily limit inputs, usage progress bar
- Save all permissions in batch

### 7. Create InvitaUtenteModal
**Create**: `src/components/impostazioni/InvitaUtenteModal.tsx`
- Email input + role selection (Membro/Admin) as visual cards
- Calls `invita-membro` edge function

### 8. Create `useCheckPermesso` hook
**Create**: `src/hooks/useCheckPermesso.ts`
- Checks: feature active for company → user has permission → monthly limit → daily limit
- `registraUtilizzo()` utility function
- 30s stale time cache

### 9. Create `invita-membro` edge function
**Create**: `supabase/functions/invita-membro/index.ts`
- Auth check (caller must be owner/admin via profiles)
- Creates record in `azienda_inviti`
- Sends branded email via Resend (graceful skip if no API key)

### 10. Update sidebar link
**Edit**: `src/components/layout/SidebarNav.tsx`
- Change "Account" link label to "Impostazioni" (href stays `/app/settings`)

### Files Summary
- **Rewrite**: `src/pages/app/Settings.tsx`
- **Create**: `src/hooks/useAziendaSettings.ts`
- **Create**: `src/hooks/useCheckPermesso.ts`
- **Create**: `src/components/impostazioni/TabProfilo.tsx`
- **Create**: `src/components/impostazioni/TabPiano.tsx`
- **Create**: `src/components/impostazioni/TabUtenti.tsx`
- **Create**: `src/components/impostazioni/UserPermissionsModal.tsx`
- **Create**: `src/components/impostazioni/InvitaUtenteModal.tsx`
- **Create**: `supabase/functions/invita-membro/index.ts`
- **Edit**: `src/components/layout/SidebarNav.tsx`

### Important Notes
- All new tables (`piattaforma_features`, `azienda_features_sbloccate`, `user_feature_permissions`, `user_feature_usage`, `azienda_inviti`) must be created in Supabase manually using the SQL from the prompt (adapted to use `company_id` instead of `azienda_id`)
- The `RESEND_API_KEY` secret is required for invite emails
- New table queries will use `as any` casts since types.ts won't have them until regenerated

