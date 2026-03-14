

# Ottimizzazione Superadmin per Visibilità Completa

L'area superadmin deve mostrare tutti i dati in modo leggibile su qualsiasi schermo. I problemi principali sono: tabelle con troppe colonne che traboccano su mobile, grafici che si comprimono, sidebar superadmin con troppe voci senza raggruppamento logico, e pagine placeholder (Team, SystemLogs) inutili nella navigazione.

---

## Problemi Identificati

1. **CompanyTable (7 colonne + azioni)** — impossibile da leggere su mobile, nessun `overflow-x-auto` o layout alternativo
2. **Dashboard tabelle (Revenue per Azienda, Credit Health)** — 6-7 colonne, stessa problematica
3. **Monitoring tabelle (Weekly Reports 6 col, Reserved Credits 4 col)** — overflow su schermi < 768px
4. **GlobalAnalytics tabella breakdown** — usa `<table>` nativo senza responsive wrapper
5. **StatsCard `text-3xl`** — troppo grande su mobile, testo lungo (es. `€1.234,56`) trabocca
6. **CompanyDetail header** — badges + button "Impersona" inline, si sovrappone su mobile
7. **PlatformSettings TabsList** — 6+ tab orizzontali, overflow su mobile senza scroll
8. **Topbar `pageTitleMap`** — mancano le pagine superadmin (Dashboard, Aziende, Analytics, ecc.)
9. **Sidebar superadmin** — la voce "Nuova Azienda" non è necessaria nella nav (è un'azione, non una pagina), e mancano link a pagine esistenti come API Keys e SA Settings
10. **Companies.tsx filtri** — 4 filtri inline traboccano su mobile

---

## Piano di Implementazione

### 1. StatsCard.tsx — Responsive sizing
- Ridurre `text-3xl` a `text-2xl md:text-3xl`
- Ridurre `p-6` a `p-4 md:p-6`
- Icon container da `h-10 w-10` a `h-8 w-8 md:h-10 md:w-10`

### 2. CompanyTable.tsx — Mobile card layout
- Su mobile (`md:hidden`): rendere ogni company come una card compatta con nome, stato, piano e azioni
- Su desktop (`hidden md:block`): mantenere la tabella attuale
- Nascondere colonne secondarie (Settore, Agenti, Chiamate/mese, Data) su mobile

### 3. Dashboard.tsx — Responsive tables + grids
- Wrappare tutte le tabelle in `overflow-x-auto`
- Revenue table: nascondere colonne Costi/Minuti su mobile (`hidden md:table-cell`)
- Credit Health table: nascondere Ricaricato/Auto-Ricarica su mobile
- Header buttons: stack verticale su mobile
- Economics KPI grid: `grid-cols-2` su mobile (già ok) ma ridurre font

### 4. Monitoring.tsx — Table responsive
- Weekly Reports: nascondere colonne Settimana/Tentativi/Errore su mobile
- Reserved Credits: già 4 colonne, wrappare in `overflow-x-auto`

### 5. GlobalAnalytics.tsx — Table + KPI fixes
- Wrappare breakdown table in `overflow-x-auto`
- KPI grid: già `grid-cols-2` ma i sub-KPI `grid-cols-3` vanno a `grid-cols-2 lg:grid-cols-3`
- Export button: icona sola su mobile

### 6. CompanyDetail.tsx — Header responsive
- Stack header verticale su mobile: nome + badges su una riga, bottoni sotto
- Tab triggers: aggiungere `overflow-x-auto` se servono

### 7. Companies.tsx — Filter responsive
- Filtri: stack a `grid grid-cols-2` su mobile invece di `flex-wrap`
- Search full-width sopra i filtri

### 8. PlatformSettings.tsx — TabsList scroll
- TabsList: aggiungere `overflow-x-auto flex-nowrap` per scroll orizzontale su mobile

### 9. Topbar.tsx — Aggiungere titoli superadmin
- Aggiungere al `pageTitleMap`: superadmin, companies, analytics, monitoring, platform-settings, render-config, logs, team, whatsapp, templates

### 10. SidebarNav.tsx — Pulizia navigazione superadmin
- Rimuovere "Nuova Azienda" (è un'azione, non una pagina)
- Aggiungere "API Keys" (`/superadmin/api-keys`) sotto PIATTAFORMA
- Riorganizzare in 4 sezioni chiare: Principale, Gestione, Report, Piattaforma

---

### File da modificare
- `src/components/superadmin/StatsCard.tsx`
- `src/components/superadmin/CompanyTable.tsx`
- `src/pages/superadmin/Dashboard.tsx`
- `src/pages/superadmin/Monitoring.tsx`
- `src/pages/superadmin/GlobalAnalytics.tsx`
- `src/pages/superadmin/CompanyDetail.tsx`
- `src/pages/superadmin/Companies.tsx`
- `src/pages/superadmin/PlatformSettings.tsx`
- `src/components/layout/Topbar.tsx`
- `src/components/layout/SidebarNav.tsx`

