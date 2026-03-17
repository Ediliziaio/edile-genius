

# Impostazioni Azienda + Sistema Permessi — Gap Analysis

## Already Implemented

All database tables, hooks, components, and edge functions described in this prompt already exist:

### Database (confirmed in types.ts)
- **`piattaforma_features`** — Feature catalog with `id`, `nome`, `descrizione`, `categoria`, `icona`, `crediti_per_uso`. Uses `company_id` referencing `companies`.
- **`azienda_features_sbloccate`** — Company feature unlocks with `company_id`, `feature_id`, `limite_mensile`, `attivo`, `sbloccato_il`, `scade_il`.
- **`user_feature_permissions`** — Per-user permissions with `company_id`, `user_id`, `feature_id`, `abilitato`, `limite_mensile`, `limite_giornaliero`.
- **`user_feature_usage`** — Usage tracking with `company_id`, `user_id`, `feature_id`, `usato_il`, `dettagli`.
- **`azienda_inviti`** — Invite system with `company_id`, `email`, `ruolo`, `token`, `scade_il`, `accettato`.

### Hooks
- **`useAziendaSettings`** (`src/hooks/useAziendaSettings.ts`) — Feature queries, member management, invite, remove, role change mutations.
- **`useCheckPermesso`** (`src/hooks/useCheckPermesso.ts`) — 3-level permission check (company feature → user permission → monthly usage limit) + `registraUtilizzo` utility.

### Components
- **`TabProfilo`** — Company + personal profile management.
- **`TabPiano`** — Plan display with feature catalog, usage progress bars, category grouping.
- **`TabUtenti`** — Team member list, role management, invite/remove with confirmation dialogs.
- **`UserPermissionsModal`** — Per-user feature toggle + monthly/daily limits + usage progress bars.
- **`InvitaUtenteModal`** — Email + role selection (admin/membro).
- **Settings page** (`src/pages/app/Settings.tsx`) — Hub with 7-tab sidebar navigation.

### Edge Function
- **`invita-membro`** — Creates invite record, sends email via Resend with accept link.

### Routes & Navigation
- Routes configured in `App.tsx` under `/app/settings`.
- Sidebar navigation includes settings link.

## Incompatibilities in the Prompt

The prompt uses `azienda_id` referencing `auth.users(id)` and references non-existent tables (`team_members`, `profiles.ruolo`, `profiles.nome_azienda`). The actual schema uses:
- `company_id` referencing `companies(id)`
- Members tracked via `profiles.company_id` (no `team_members` table)
- Roles in `user_roles` table (not `profiles.ruolo`)

The prompt's SQL would create duplicate/conflicting tables and break the existing system.

## Conclusion

**No changes needed.** The entire permissions system described in this prompt is already fully implemented and working with the correct schema conventions (`company_id` / `companies` / `profiles`).

