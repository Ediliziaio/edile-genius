

# Audit Codice Edil Genius — Piano di Intervento

## Risultati Security Scan

5 findings totali dalla scansione automatica. Ecco lo stato e le azioni necessarie.

---

## CRITICO (2 fix)

### C1. `render_bagno_gallery` — Unauthenticated Write Access
La policy `Company users manage own gallery` è assegnata al ruolo `{public}` con condizione `(company_id = my_company()) OR (is_public = true)`. Per utenti non autenticati, `my_company()` ritorna NULL ma `is_public = true` è valutato indipendentemente → **qualsiasi utente anonimo può INSERT/UPDATE/DELETE righe con `is_public = true`**.

Stesso problema su: `render_tetto_gallery`, `render_tetto_sessions`, `render_tetto_stili_pronti`, `render_bagno_sessions`, `render_persiane_sessions`, `render_persiane_gallery`, `render_facciata_sessions`, `render_facciata_gallery`.

**Fix**: Migration SQL per cambiare tutte le policy da ruolo `public` a `authenticated`.

### C2. `monthly_billing_summary` — No RLS
Vista con dati finanziari cross-company (margin, revenue) leggibile da qualsiasi utente autenticato. RLS è **disabilitato** sulla vista.

**Fix**: Migration SQL per abilitare RLS e creare policy superadmin-only (o usare `security_invoker=true` se supportato).

---

## IMPORTANTE (1 fix)

### I1. `genera-preventivo-completo` — Non idempotente
La funzione aggiorna `stato` a `generazione` senza verificare lo stato corrente. Se chiamata due volte rapidamente, genera sezioni duplicate.

**Fix**: Aggiungere check `prev.stato === 'generazione'` → ritorna 409. Usare condizionale update: `.eq('stato', 'bozza')` per evitare race condition.

---

## GIÀ RISOLTO (dalla precedente audit)

- PDFPreviewPanel `revokeObjectURL` cleanup ✅ (line 28)
- StepSuperfici `revokeObjectURL` cleanup ✅ (line 24)
- Pagina `/accetta-invito` ✅ (esiste e funziona)
- `setInterval` cleanup in RenderPersianeNew/BagnoNew/FacciataNew ✅ (clearInterval in catch)

---

## NON IMPLEMENTABILE / BASSA PRIORITÀ

- **`as any` (1161 occorrenze in 74 file)**: Causate da tabelle non presenti in types.ts. Richiede rigenerazione tipi Supabase — non risolvibile qui.
- **Zod validation in tutte le edge functions**: Scope troppo ampio per un singolo intervento.
- **CORS restrictivo**: Prematura — progetto non ancora in produzione con dominio custom.
- **Extension pgvector in public schema**: Comune, bassa priorità.
- **Leaked Password Protection**: Azione manuale in Supabase Dashboard.

---

## Piano di Implementazione

### Task 1 — Fix RLS policy roles (SQL migration)
Cambiare tutte le policy sui render tables da `TO public` a `TO authenticated`. Circa 20 policy da aggiornare.

### Task 2 — Fix `monthly_billing_summary` RLS (SQL migration)
Abilitare RLS sulla vista e creare policy per soli superadmin.

### Task 3 — Fix idempotenza `genera-preventivo-completo`
Aggiungere guard `if (prev.stato === 'generazione') return 409` e update condizionale.

---

## Stima Effort

| Task | Effort |
|------|--------|
| T1. Fix RLS policy roles | 10 min (SQL) |
| T2. Fix monthly_billing_summary | 5 min (SQL) |
| T3. Fix idempotenza edge function | 5 min |
| **Totale** | **~20 min** |

