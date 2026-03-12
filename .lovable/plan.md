

# PROMPT 6 — Frontend Finale + Infrastruttura Lancio

## Analisi stato attuale

| Fix | Stato attuale | Azione necessaria |
|-----|--------------|-------------------|
| 1. ErrorBoundary | Gia esiste in `src/components/ErrorBoundary.tsx` e wrappa `<App>` globalmente. Ma non wrappa le singole route lazy — un crash in una pagina mostra schermo bianco dentro Shell | Aggiungere ErrorBoundary per-route + bottone "Riprova" (reset state) e "Dashboard" |
| 2. RenderHub memory leak | Nessun `setInterval` in RenderHub (usa `useEffect` con fetch singolo). RenderNew ha polling in step 2 ma ha gia cleanup. **Nessun memory leak reale** | Solo miglioramento: convertire a `useQuery` per consistenza |
| 3. Analytics limit | Gia usa `.limit(1000)` + mostra warning "truncated". Aggrega in JS. Nessuna tabella `call_logs` (usa `conversations`) | Aggiungere Skeleton loading durante caricamento |
| 4. Settings billing tab | Gia implementato con link a `/app/credits` e placeholder Stripe "Prossimamente" | Nessun fix necessario — gia funzionale |
| 5. Onboarding | Non esiste. `profiles` non ha `onboarding_completed`. Dashboard non ha redirect | Creare pagina + migration + redirect |
| 6. Health-check | Non esiste | Creare edge function |
| 7. Seed demo data | Non esiste | Creare edge function |

## Modifiche pianificate

### 1. Migration SQL
- Aggiungere `onboarding_completed BOOLEAN DEFAULT false` a `profiles`
- UPDATE tutti i profili esistenti a `true`

### 2. ErrorBoundary migliorato
**File: `src/components/ErrorBoundary.tsx`**
- Aggiungere bottone "Riprova" (reset state senza reload) e "Vai alla Dashboard"
- Mostrare stack trace in dev mode

**File: `src/App.tsx`**
- Creare wrapper `<SafeRoute>` che wrappa ogni lazy component in `<ErrorBoundary>` + `<Suspense>`
- Applicare a tutte le route `/app/*` e `/superadmin/*`

### 3. Analytics Skeleton
**File: `src/pages/app/Analytics.tsx`**
- Aggiungere skeleton loading con `<Skeleton>` per stat cards e charts durante `isLoading`

### 4. Onboarding (3 step)
**File: `src/pages/app/Onboarding.tsx`** (nuovo)
- Step 1: Configura azienda (nome, P.IVA, indirizzo, logo upload)
- Step 2: Crea primo cantiere (nome, indirizzo, date, responsabile) — inserisce in `cantieri`
- Step 3: Invita operaio o carica dati demo — inserisce in `cantiere_operai`
- Stepper visivo, validazione per step, skip su step 3

**File: `src/pages/app/Dashboard.tsx`**
- Aggiungere check `onboarding_completed` dal profilo, redirect a `/app/onboarding` se false

**File: `src/App.tsx`**
- Aggiungere route `/app/onboarding`

### 5. Health-check Edge Function
**File: `supabase/functions/health-check/index.ts`** (nuovo)
- Verifica secret obbligatori (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ELEVENLABS_API_KEY)
- Verifica connessione DB
- Protetto da SUPABASE_SERVICE_ROLE_KEY (no token extra)
- Aggiungere a `config.toml`

### 6. Seed Demo Data Edge Function
**File: `supabase/functions/seed-demo-data/index.ts`** (nuovo)
- Auth utente, prende company_id dal profilo
- Verifica account vuoto (0 cantieri)
- Inserisce: 2 cantieri, 4 operai, assegnazioni, 2 preventivi, 3 documenti scadenza
- Usa colonne reali dello schema (`committente` non `cliente`, `numero_preventivo` non `numero`, etc.)
- Aggiungere a `config.toml`

### File coinvolti

| File | Modifica |
|------|----------|
| Migration SQL | `onboarding_completed` su profiles |
| `src/components/ErrorBoundary.tsx` | Retry + Dashboard button |
| `src/App.tsx` | SafeRoute wrapper + onboarding route |
| `src/pages/app/Analytics.tsx` | Skeleton loading |
| `src/pages/app/Onboarding.tsx` | Nuovo — 3 step wizard |
| `src/pages/app/Dashboard.tsx` | Redirect onboarding |
| `supabase/functions/health-check/index.ts` | Nuovo |
| `supabase/functions/seed-demo-data/index.ts` | Nuovo |
| `supabase/config.toml` | 2 nuove funzioni |

