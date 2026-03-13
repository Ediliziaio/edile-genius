

# Plan: RenderBagnoNew.tsx — 5-Step Wizard (Doc 3/5)

## Key Adaptations from User's Spec

The user's pseudocode has several issues that need correction to match the actual codebase:

1. **Auth pattern**: Uses `useSupabaseClient()`/`useUser()` (auth-helpers) — project uses `supabase` client directly + `useAuth()` + `useCompanyId()`
2. **DB schema mismatch**: Tables use `company_id` (required) + `created_by` instead of `user_id`. Insert must include `company_id`.
3. **Doc 4 components don't exist yet**: `TilePicker`, `ShowerConfigurator`, `VascaSelector`, `VanitySelector`, `RubinetteriaPicker`, `PareteColoreSelector` — these will be created in Doc 4. For now, we'll create **inline selectors** using presets from `render_bagno_presets` table, keeping the component structure ready for extraction in Doc 4.
4. **Supabase typed queries**: Must use proper typing or `as any` casts for new tables not fully in the generated types.

## What Gets Created/Modified

### 1. `src/pages/app/RenderBagnoNew.tsx` (~600 lines)
Complete 5-step wizard:

- **Step 1 (Foto)**: Upload zone, base64 conversion, call `analyze-bathroom-photo` edge function, display analysis pills. Creates session in `render_bagno_sessions` with `company_id`.
- **Step 2 (Tipo)**: 4 intervention types with auto-preset of element checkboxes.
- **Step 3 (Configura)**: Conditional sections per active element. Since Doc 4 components don't exist, each section uses **inline preset-based selectors** that load options from `render_bagno_presets` (fetched once on mount). Covers: wall tiles (effect/format/layout/grout), floor tiles, shower (type/box/tray/profiles), bathtub, vanity, sanitari (inline), rubinetteria, wall color, lighting.
- **Step 4 (Genera)**: Calls `buildBathroomPrompt()`, invokes `generate-bathroom-render`, shows animated progress steps.
- **Step 5 (Risultato)**: Before/after comparison toggle, download, save to gallery, regenerate.

### 2. No other files modified
Routes and sidebar already configured from Doc 1.

## Technical Notes

- Presets fetched via `supabase.from("render_bagno_presets").select("*").eq("is_active", true).order("sort_order")` on mount
- Gallery save includes `company_id` and `created_by`
- Uses `useToast()` for error feedback instead of `alert()`
- File input with accept="image/jpeg,image/png,image/webp,image/heic"
- Step navigation guards (can't advance without photo+analysis)

