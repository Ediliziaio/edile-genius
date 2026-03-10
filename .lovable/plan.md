

# Fix: "Canone mensile" → "Canone annuale" nel breakdown AI

In `src/components/sections/CostCalculator.tsx` linea 76, il label dice "Canone mensile Agente AI" ma il valore mostrato è annuale (`canone * 12`). Correzione: rinominare in **"Canone annuale Agente AI"** e aggiornare la descrizione coerentemente.

### Modifica

**`src/components/sections/CostCalculator.tsx`** (riga 76):
- `"Canone mensile Agente AI"` → `"Canone annuale Agente AI"`
- Descrizione: `"Piano Professional — in base al volume"` (invariata, già corretta)

