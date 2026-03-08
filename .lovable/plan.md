

# Fix: Crediti Render Mancanti per Test

## Problema
La tabella `render_credits` non contiene alcuna riga per la company "Domus Group" (`f9361dd6-...`). Il trigger `init_render_credits` esiste ma la company e stata creata prima che il trigger fosse attivato. Quando la pagina RenderNew cerca i crediti con `.single()`, ottiene 406 (0 rows) e mostra "crediti non presenti".

## Soluzione
Inserire la riga `render_credits` mancante con 5 crediti gratuiti (come previsto dal trigger per nuove company).

**Migration SQL:**
```sql
INSERT INTO render_credits (company_id, balance, total_purchased, total_used)
VALUES ('f9361dd6-2499-4a70-afc6-43d69438bda8', 5, 5, 0)
ON CONFLICT (company_id) DO NOTHING;
```

Nessuna modifica al codice frontend necessaria. Dopo l'inserimento, la pagina `/app/render/new` trovera i crediti e permettera di generare il render.

