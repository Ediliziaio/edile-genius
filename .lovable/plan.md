

# Isolamento dati per utenti con ruolo limitato (company_user)

## Obiettivo
Gli utenti con ruolo `company_user` devono vedere solo gli agenti e i render creati da loro stessi. Gli utenti `company_admin` e i superadmin continuano a vedere tutto il contenuto dell'azienda.

## Approccio

Creare un hook `useIsAdmin` che espone un booleano `isAdmin` (true per `company_admin`, `superadmin`, `superadmin_user`). Poi aggiungere il filtro `.eq("created_by", user.id)` nelle query quando `isAdmin` è false.

## File da modificare

### 1. `src/hooks/useIsAdmin.ts` (nuovo)
Hook semplice che legge i ruoli da `useAuth()` e ritorna `{ isAdmin: boolean }`. Admin = `company_admin` | `superadmin` | `superadmin_user`.

### 2. `src/pages/app/Agents.tsx`
Nella query degli agenti, se `!isAdmin`, aggiungere `.eq("created_by", user.id)` alla query Supabase. Così un `company_user` vede solo i propri agenti.

### 3. Pagine Hub render (6 file)
Applicare lo stesso filtro `created_by` / `user_id` condizionale nei seguenti file, dove attualmente filtrano solo per `company_id`:
- `src/pages/app/RenderHub.tsx` — gallery query
- `src/pages/app/RenderBagnoHub.tsx` — gallery query
- `src/pages/app/RenderFacciataHub.tsx` — gallery query
- `src/pages/app/RenderGallery.tsx` — gallery query

Le pagine `RenderPavimentoHub`, `RenderPersianeHub`, `RenderStanzaHub`, `RenderTettoHub` già filtrano per `user_id` — nessuna modifica necessaria.

### 4. `src/pages/app/Dashboard.tsx`
Filtrare i conteggi agenti per `created_by` quando `!isAdmin`.

## Logica del filtro

```text
if (isAdmin || isSuperAdmin) → .eq("company_id", companyId)
else                         → .eq("company_id", companyId).eq("created_by", user.id)
```

Nessuna modifica al database o alle RLS — il filtro è applicato lato applicazione sulla colonna `created_by` già esistente.

