

# Inserire €1000 crediti AI per Domus Group

## Problema
La tabella `ai_credits` non contiene alcuna riga per Domus Group (`f9361dd6-2499-4a70-afc6-43d69438bda8`). Il trigger `init_company_credits` non ha funzionato perche la company era stata creata prima dell'attivazione del trigger.

## Soluzione
Creare una migration SQL che inserisce la riga `ai_credits` con saldo di €1000:

```sql
INSERT INTO ai_credits (company_id, balance_eur, total_recharged_eur, total_spent_eur)
VALUES ('f9361dd6-2499-4a70-afc6-43d69438bda8', 1000, 1000, 0)
ON CONFLICT (company_id) DO UPDATE SET balance_eur = 1000, total_recharged_eur = 1000;
```

**File**: `supabase/migrations/20260308090000_domus_ai_credits_init.sql`

Nessuna modifica al codice frontend.

