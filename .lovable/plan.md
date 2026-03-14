

# Fix: Agenti non salvati dopo creazione

## Problema Identificato

Ho analizzato il flusso completo e trovato **due problemi**:

1. **Submit silenzioso quando `companyId` è assente** — Il wizard in `AgentTemplateWizard.tsx` ha `if (!companyId) return;` che termina silenziosamente senza mostrare alcun errore. Il tuo utente è un superadmin con `company_id = NULL` nel profilo e usa l'impersonation per lavorare su un'azienda. Se la sessione di impersonation si perde (es. refresh, sessionStorage cancellato), `companyId` diventa null e il submit non fa nulla.

2. **Nessuna invalidazione della cache** — Dopo la creazione, il wizard naviga a `/app/agents/:id` ma non invalida la query `["company-agents", companyId]`. Quando l'utente torna alla lista, React Query potrebbe servire dati dalla cache stale.

Risultato confermato: **zero agenti nel database**, **zero log della edge function** — la funzione non è mai stata invocata.

## Piano

### 1. Aggiungere error handling quando companyId è assente
In `AgentTemplateWizard.tsx`, sia in `handleSubmit` che in `handleCreateDraft`:
- Sostituire `if (!companyId) return;` con un toast di errore esplicito che dice all'utente di selezionare un'azienda

### 2. Invalidare la cache dopo creazione
In `AgentTemplateWizard.tsx`:
- Importare `useQueryClient` da `@tanstack/react-query`
- Dopo la creazione riuscita, chiamare `queryClient.invalidateQueries({ queryKey: ["company-agents"] })` prima della navigazione

### 3. Mostrare un avviso nel wizard se companyId è null
- Se il superadmin non sta impersonando un'azienda, mostrare un banner di avviso in cima al wizard con un link per tornare alla lista aziende

---

### File da modificare
- `src/pages/app/AgentTemplateWizard.tsx` — error handling + cache invalidation + banner avviso

