

# Analisi Audit — Sistema Crediti & SuperAdmin

## Risultato chiave: il prompt NON corrisponde all'architettura reale

Il prompt di audit descrive un'architettura **completamente diversa** da quella implementata in Edil Genius. Non esiste nessuna delle tabelle menzionate:

| Prompt descrive | Realtà nel DB |
|---|---|
| `plans`, `subscriptions`, `credit_balances`, `credit_transactions` | **Non esistono** |
| `services`, `service_routing`, `plans_services`, `feature_toggles` | **Non esistono** |
| `provider_api_keys`, `service_routing_overrides`, `credit_packages` | **Non esistono** |
| `profiles.is_super_admin` | **Non esiste** — i ruoli sono in `user_roles` con enum `app_role` |
| Modello tenant-based (`tenant_id = auth.uid()`) | Modello company-based (`company_id` via `my_company()`) |

### Architettura reale di Edil Genius

- **Crediti**: `ai_credits` (saldo EUR per company), `ai_credit_topups`, `ai_credit_usage`, `ai_credit_packages`
- **Ruoli**: tabella `user_roles` con enum `app_role` (superadmin, superadmin_user, company_admin, company_user)
- **Auth guard**: `AuthGuard` verifica ruoli via `useAuth()` che legge da `user_roles` — già funzionante
- **Credit check**: `check-credits-before-call` verifica JWT, deriva `company_id` dal profilo (non dal body), controlla `ai_credits.balance_eur`
- **Credit deduction**: `deduct_call_credits()` è già una funzione PL/pgSQL con `FOR UPDATE` (atomica)
- **Topup**: `topup_credits()` è già atomica con `FOR UPDATE`
- **Stripe webhook**: già idempotente via `stripe_session_id` unique check su `ai_credit_topups`
- **RLS**: tutte le tabelle finanziarie hanno RLS abilitato con policy corrette

## Cosa è già correttamente implementato

1. **Auth bypass prevention** ✅ — `check-credits-before-call` verifica JWT e deriva company_id dal profilo server-side
2. **Race condition crediti** ✅ — `deduct_call_credits()` e `topup_credits()` usano `FOR UPDATE`
3. **Stripe idempotency** ✅ — check su `stripe_session_id` prima di processare
4. **SuperAdmin guard** ✅ — `AuthGuard` con `requiredRole="superadmin"` che verifica `isSuperAdmin` da `user_roles`
5. **RLS su tabelle finanziarie** ✅ — tutte con `rowsecurity = true` e policy company-scoped + superadmin

## Cosa manca realmente (gap minori)

Dopo analisi accurata, l'unico gap identificabile è:

### G1. `platform_pricing` — manca policy SELECT per utenti company
La tabella `platform_pricing` ha solo `sa_pricing_all` per superadmin. Gli utenti company non possono leggere i prezzi, ma `check-credits-before-call` usa `service_role` quindi funziona. Tuttavia se il frontend volesse mostrare i costi, fallirebbe.

**Fix**: Aggiungere policy SELECT per `authenticated`.

## Raccomandazione

**Non implementare nulla di questo prompt.** Le tabelle, le funzioni e l'architettura descritte sono per un progetto diverso. Implementarle creerebbe un sistema parallelo e incompatibile con quello esistente.

L'unico fix minore è la policy mancante su `platform_pricing` per lettura company users.

---

## Se si vuole procedere

### Task 1 — Aggiungere policy SELECT su `platform_pricing` per company users
Migration SQL: `CREATE POLICY "pricing_read" ON platform_pricing FOR SELECT TO authenticated USING (true);`

Effort: 2 minuti.

