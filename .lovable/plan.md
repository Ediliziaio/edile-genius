

# Implementazione Accesso SuperAdmin nelle Aziende (Impersonazione)

## Problema Attuale

L'infrastruttura di impersonazione esiste (context, banner, session storage) ma non funziona perché:

1. **Il bottone "Accedi come azienda"** nella tabella aziende è `disabled`
2. **Solo Dashboard.tsx** usa `impersonatingCompanyId` — le altre 10 pagine app usano direttamente `profile?.company_id`, quindi mostrano dati vuoti durante l'impersonazione
3. **La Sidebar** mostra sempre il menu superadmin anche durante l'impersonazione — il superadmin non vede le voci di navigazione dell'azienda
4. **AuthGuard** blocca i superadmin che accedono a `/app` senza essere `company_user`

## Piano di Implementazione

### 1. Creare un hook centralizzato `useCompanyId`
Nuovo file `src/hooks/useCompanyId.ts` che incapsula la logica:
```
impersonatingCompanyId || profile?.company_id
```
Tutti i file lo useranno al posto della logica inline.

### 2. Aggiornare tutte le pagine app (10 file)
Sostituire `const companyId = profile?.company_id` con `const companyId = useCompanyId()` in:
- Agents, AgentDetail, CreateAgent
- Contacts, ContactLists, ContactListDetail
- Conversations, Campaigns, CreateCampaign
- ImportContacts, Analytics, Settings

### 3. Abilitare il bottone nella CompanyTable
Rimuovere `disabled` dal bottone LogIn e collegarlo a `useImpersonation().startImpersonation()` + `navigate("/app")`.

### 4. Sidebar: mostrare menu azienda durante impersonazione
Quando `isImpersonating` è true, la sidebar mostra `companyNav` invece di `superadminNav`.

### 5. AuthGuard: permettere superadmin su /app
La guardia `requiredRole="company"` deve permettere anche i superadmin (che possono impersonare).

### File coinvolti
- **Nuovo**: `src/hooks/useCompanyId.ts`
- **Modificati**: `CompanyTable.tsx`, `Sidebar.tsx`, `AuthGuard.tsx`, + 11 pagine in `src/pages/app/`

Nessuna migrazione DB necessaria.

