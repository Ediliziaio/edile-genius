

## Implementation Plan — Remaining Enhancements

The sidebar restructuring and Cantieri collapsible section are **already implemented** from the previous round. Two files need enhancement:

### 1. Integrations Hub — Real Status + Telegram (`src/pages/app/Integrations.tsx`)

**Current state**: Static cards with hardcoded "available" status, no Telegram, CRM/Webhooks link to Settings.

**Changes**:
- Add **Telegram Bot** card pointing to `/app/cantieri/config`
- Fetch real connection status from Supabase:
  - `ai_phone_numbers` (active count) → Telephony status
  - `whatsapp_subscriptions` (status=active) → WhatsApp status
  - `company_integrations` (is_active=true) → CRM status
  - `company_channels` (channel_type=telegram, is_verified) → Telegram status
  - `company_channels` (any rows) → Webhooks status
- Show "Connesso" (green badge + CheckCircle) vs "Da configurare" (secondary badge)
- Show connected count in subtitle: "3/5 attive"
- Connected cards get primary border accent
- Button text: "Gestisci" if connected, "Configura" if not

### 2. Dashboard Welcome Flow — Guided Checklist (`src/pages/app/Dashboard.tsx`)

**Current state**: Generic 3-step onboarding ("Scegli un template → Configura la voce → Attiva e ricevi chiamate") with no real status checks.

**Changes** (only the `!hasAgents` onboarding block, lines 168-210):
- Replace generic steps with a **checklist that reflects actual progress**:
  1. "Scegli cosa automatizzare" → links to `/app/agents/new` → checked if agents exist (always unchecked in this branch since `!hasAgents`)
  2. "Attiva il primo agente" → links to `/app/agents/new` → checked if any agent is active
  3. "Collega i tuoi sistemi" → links to `/app/integrations` → checked if any integration is connected
- Each step shows a checkbox icon (checked/unchecked) instead of numbered circles
- Steps link to the relevant page when clicked
- Keep the primary CTA "Crea il Primo Agente" button
- Query `company_integrations` and `ai_phone_numbers` to determine step 3 status

### Files Modified
1. `src/pages/app/Integrations.tsx` — Real status, Telegram card, connected count
2. `src/pages/app/Dashboard.tsx` — Checklist-based welcome flow with actual status

