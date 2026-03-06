

# Redesign: Light Theme + Nuovo Design System edilizia.io

## Analisi del documento

Il PDF descrive una riscrittura completa del design system: da **dark theme** (attuale) a **light theme bianco + verde**. Le modifiche principali:

1. **Nome brand**: "edilizia.io" (non "EdiliziaInCloud")
2. **Tema piattaforma**: da dark (#0A0A0A) a light (bianco + verde #3ECF6E)
3. **Nuovo sistema colori**: token `brand.*` e `ink.*` al posto di `app-*`
4. **Nuovi border-radius**: card=16px, btn=10px, pill=999px
5. **Nuove shadows**: card, hover, brand, focus, modal
6. **Button tokens**: primario verde, secondario bianco border, ghost trasparente
7. **Schema DB diverso**: nomi colonne differenti (`el_api_key` vs `elevenlabs_api_key`, `el_agent_id` vs `elevenlabs_agent_id`, `calls_month` vs `calls_this_month`, ecc.)
8. **Nuove tabelle**: contacts, contact_lists, contact_list_members, campaigns, notes
9. **Nuove funzioni RLS**: `my_role()` e `my_company()` al posto di `has_role()` e `get_user_company_id()`
10. **Sidebar ristrutturata**: sezioni con header (PRINCIPALE, CONTATTI, REPORT, ACCOUNT)
11. **Login redesign**: sfondo SVG dot grid verde, titoli "Bentornato" / "Accedi alla tua piattaforma AI"

## Proposta: split in fasi

Data la portata enorme, propongo di procedere per fasi:

### Fase A (questa build) — Design System + Theme Switch
- Aggiornare `tailwind.config.ts` con i nuovi token colore (`brand.*`, `ink.*`, shadows, border-radius)
- Aggiornare `src/index.css` rimuovendo le variabili dark `--app-*` e sostituendo con i nuovi token light
- Aggiornare `Shell.tsx`: rimuovere `dark-app`, usare `bg-ink-50`
- Aggiornare `Login.tsx`: light theme, nome "edilizia.io", SVG grid background, titoli dal documento
- Aggiornare `Sidebar.tsx`: light theme, sezioni con header, nome "edilizia.io"
- Aggiornare `Topbar.tsx`: light theme
- Aggiornare tutte le pagine platform (`Dashboard`, `Agents`, `CreateAgent`, `AgentDetail`, `Conversations`, `Analytics`, `Settings`, `CompanyDetail`, `Companies`, `CreateCompany`, `SuperAdminDashboard`) per usare i nuovi token (`ink-*`, `brand-*` al posto di `hsl(var(--app-*))`)

### Fase B (prossima) — Database schema alignment
- Migration per rinominare colonne (`elevenlabs_api_key` → `el_api_key`, ecc.)
- Nuove tabelle (`contacts`, `contact_lists`, `campaigns`, `notes`)
- Nuove funzioni RLS (`my_role()`, `my_company()`)
- Aggiornare tutti i riferimenti nel codice frontend e edge functions

### Fase C (successiva) — Nuove pagine
- Contacts (rubrica, kanban, import CSV)
- Lists & Groups
- Campaigns outbound

## Dettaglio tecnico Fase A

### `tailwind.config.ts`
Aggiungere:
```
colors: {
  brand: { DEFAULT: '#3ECF6E', hover: '#2FB85C', light: '#F0FBF5', muted: '#E4F7ED', border: '#B2ECCA', text: '#1A7A40' },
  ink: { 900: '#0D1117', 800: '#1C2B3A', 700: '#2D3F50', 600: '#4A5E72', 500: '#637485', 400: '#8A9BAC', 300: '#B8C5D0', 200: '#D9E2EA', 100: '#EDF1F5', 50: '#F5F7FA', 0: '#FFFFFF' },
  // red, amber, blue, violet tokens
}
borderRadius: { card: '16px', btn: '10px', pill: '999px' }
boxShadow: { card, hover, brand, focus, modal, inset }
```

### `Shell.tsx`
- Rimuovere `dark-app` class
- Background: `bg-ink-50`

### `Login.tsx`
- Background: `bg-ink-50` con SVG dot grid pattern
- Card: `bg-white border border-ink-200 rounded-card shadow-card`
- Logo: `edilizia` in `ink-900` + `.io` in `brand`
- Titoli: "Bentornato" h1, "Accedi alla tua piattaforma AI" subtitle

### `Sidebar.tsx`
- `bg-white border-r border-ink-200`
- Logo "edilizia.io"
- Sezioni: PRINCIPALE, CONTATTI, REPORT, ACCOUNT con header label
- Active item: `bg-brand-light text-brand-text`
- Aggiungere voci: Rubrica, Liste & Gruppi, Campagne

### Tutte le pagine platform
- Sostituire `hsl(var(--app-text-primary))` → `text-ink-900`
- `hsl(var(--app-text-secondary))` → `text-ink-500`
- `hsl(var(--app-bg-secondary))` → `bg-white`
- `hsl(var(--app-bg-elevated))` → `bg-ink-50`
- `hsl(var(--app-border))` → `border-ink-200`
- `hsl(var(--app-brand))` → `bg-brand` / `text-brand`
- Rimuovere tutti gli `style={{ }}` inline e usare classi Tailwind

### File da modificare (Fase A)
- `tailwind.config.ts`
- `src/index.css`
- `src/components/layout/Shell.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Topbar.tsx`
- `src/pages/Login.tsx`
- `src/pages/app/Dashboard.tsx`
- `src/pages/app/Agents.tsx`
- `src/pages/app/CreateAgent.tsx`
- `src/pages/app/AgentDetail.tsx`
- `src/pages/app/Conversations.tsx`
- `src/pages/app/Analytics.tsx`
- `src/pages/app/Settings.tsx`
- `src/pages/superadmin/Dashboard.tsx`
- `src/pages/superadmin/Companies.tsx`
- `src/pages/superadmin/CreateCompany.tsx`
- `src/pages/superadmin/CompanyDetail.tsx`
- `src/components/superadmin/StatsCard.tsx`
- `src/components/superadmin/CompanyTable.tsx`
- `src/components/agents/AgentCard.tsx`
- `src/components/agents/AgentConfigForm.tsx`
- `src/components/agents/VoicePicker.tsx`
- `src/components/agents/VoiceTestPanel.tsx`
- `src/components/agents/UseCaseSelector.tsx`
- `src/components/conversations/TranscriptViewer.tsx`
- `src/components/custom/WaveformVisualizer.tsx`

