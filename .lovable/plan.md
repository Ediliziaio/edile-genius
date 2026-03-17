

# Audit Codice Edil Genius — Round 3 — Piano di Intervento

## Findings dalla Security Scan

6 findings, di cui 2 error e 4 warning. Stato rispetto ai round precedenti:

### GIA RISOLTO (round precedenti)
- PDFPreviewPanel `revokeObjectURL` cleanup ✅
- StepSuperfici `revokeObjectURL` cleanup ✅
- AccettaInvito page ✅
- setInterval cleanup in render pages ✅
- genera-preventivo-completo idempotency ✅
- RLS render tables: policy roles `public` → `authenticated` ✅

### NON ANCORA RISOLTO — da implementare ora

#### C1. `monthly_billing_summary` — RLS ancora disabilitato (ERROR)
La migration precedente ha solo fatto `REVOKE` sui permessi, ma `relrowsecurity` è ancora `false`. La vista è comunque accessibile a qualsiasi utente autenticato perché il `REVOKE` dal ruolo `anon` non impedisce l'accesso tramite il ruolo `authenticated`. Serve:
- `ALTER VIEW monthly_billing_summary SET (security_invoker = true)` — **oppure** drop/recreate con `security_invoker`
- Oppure: creare una `SECURITY DEFINER` function che controlla il ruolo prima di restituire dati

**Fix**: SQL migration che ricrea la vista con `security_invoker = on`, poi aggiunge RLS policy sulla tabella sottostante `ai_credit_usage` per superadmin (già presente) + crea un wrapper function `SECURITY DEFINER` che controlla `has_role(auth.uid(), 'superadmin')`.

Approccio più semplice: revocare SELECT da `authenticated` e concedere solo a `service_role`, forzando l'accesso solo via edge functions.

#### C2. `user_feature_permissions` — Privilege Escalation (ERROR)
La policy `permissions_company_admin` concede ALL (INSERT/UPDATE/DELETE) a qualsiasi utente della stessa company. Un utente normale può auto-assegnarsi permessi premium.

**Fix**: Drop la policy ALL e creare policy separate:
- SELECT: `company_id = my_company()` (tutti possono leggere)
- INSERT/UPDATE/DELETE: solo `company_admin` o `superadmin` tramite `my_role() IN ('company_admin', 'superadmin', 'superadmin_user')`

#### I1. `azienda_inviti` — Any member can manage invites (WARN)
La policy `inviti_company_admin` concede ALL a chiunque nella company. Un dipendente normale può inviare inviti, cancellarli, ecc.

**Fix**: Split in SELECT (tutti company) + INSERT/UPDATE/DELETE (solo admin).

#### I2. `useGeneraPDF` — Memory leak in `apriAnteprima`
La funzione `apriAnteprima` fa `setPdfUrl(url)` con `URL.createObjectURL` ma non c'è cleanup. `pdfUrl` non viene mai revocato. Minore impatto perché apre in nuova tab, ma comunque leak.

**Fix**: Aggiungere `useEffect` cleanup per `pdfUrl` nel hook.

#### I3. Stuck generation timeout
`usePreventivo` fa polling ogni 2s quando `stato === 'generazione'`, ma se la generazione fallisce silenziosamente, il preventivo resta bloccato per sempre.

**Fix**: Aggiungere timeout di 10 minuti nel refetchInterval che resetta lo stato a `bozza`.

---

## Piano di Implementazione

### Task 1 — Fix `monthly_billing_summary` accesso (SQL)
Revocare SELECT da `authenticated` sulla vista, lasciando accesso solo a `service_role` (le dashboard superadmin usano edge functions).

### Task 2 — Fix privilege escalation `user_feature_permissions` (SQL)
Drop policy `permissions_company_admin`, creare 2 policy:
- `permissions_company_read`: SELECT per `authenticated` con `company_id = my_company()`
- `permissions_admin_write`: INSERT/UPDATE/DELETE per `authenticated` con `my_role() IN ('company_admin', 'superadmin', 'superadmin_user')`

### Task 3 — Fix `azienda_inviti` policy (SQL)
Drop policy `inviti_company_admin`, creare:
- `inviti_company_read`: SELECT per company members
- `inviti_admin_write`: INSERT/UPDATE/DELETE solo per admin roles

### Task 4 — Fix `useGeneraPDF` pdfUrl leak + stuck generation timeout
- Aggiungere cleanup `useEffect` per `pdfUrl` in `useGeneraPDF`
- Aggiungere timeout 10min in `usePreventivo` refetchInterval

---

## Stima Effort

| Task | Effort |
|------|--------|
| T1. monthly_billing_summary | 3 min (SQL) |
| T2. user_feature_permissions | 5 min (SQL) |
| T3. azienda_inviti | 5 min (SQL) |
| T4. useGeneraPDF + usePreventivo | 5 min |
| **Totale** | **~18 min** |

