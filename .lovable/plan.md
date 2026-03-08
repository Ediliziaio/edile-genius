

# Verifica Stato Attuale — Agent Hub Refactor

## Risultati Verifica

### 1. Sidebar — OK
- "STRUMENTI VENDITA" e "Render AI" sono stati rimossi dal `companyNav`
- La sidebar company ha esattamente le sezioni richieste: PRINCIPALE, AUTOMAZIONI, COMUNICAZIONE, CONTATTI, REPORT, ACCOUNT
- SuperAdmin ha ancora "Config Render AI" sotto "PIATTAFORMA" (corretto, e accessibile solo da superadmin)

### 2. Template Hub `/app/agents/new` — OK
- `CreateAgent.tsx` e stato riscritto come Template Hub con griglia, filtri categoria, ricerca
- 9 template statici (5 vocali, 2 WhatsApp, 1 render attivo, 2 prossimamente)
- Carica anche template da DB (`agent_templates`) e li mergia con quelli statici
- Filtri categoria con pill scrollabili
- Layout responsive (4 col desktop, 2 tablet, 1 mobile)
- Card con striscia colorata in cima, icona, badge canale/difficolta, metriche, CTA

### 3. Route `/app/agents/new/:slug` — OK
- Route presente in `App.tsx` (linea 95)
- `AgentTemplateWizard.tsx` gestisce slug vocali (wizard 5 step) e redirect per render
- Header con breadcrumb "← Scegli Template" e banner tipo template

### 4. Pagina Agenti `/app/agents` — OK
- Filtri per tipo e stato
- Contatori "N agenti attivi · N in bozza"
- Bottone "+ Nuovo Agente" naviga a `/app/agents/new` (Template Hub)
- Empty state con 3 icone tipo + CTA "Scegli un Template"

### 5. AgentCard — OK
- Striscia sinistra 4px colorata per tipo (brand/green/violet/blue)
- Badge tipo con emoji (VOCALE/WHATSAPP/RENDER/OPERATIVO)
- Metriche contestuali per tipo
- Template di origine mostrato da `agent.use_case`

### 6. AgentDetail — OK
- `TABS_BY_TYPE` definito con tab diverse per vocal (8 tab), render (3 tab), whatsapp (5 tab)
- Tipo determinato da `agent.type`

### 7. Routing — OK
- Route render (`/app/render/*`) ancora presenti come fallback
- Non piu linkate dalla sidebar

---

## Problemi Rilevati

### Bug 1: forwardRef warning in `CreateAgent.tsx`
Console mostra 2 warning:
- `TemplateHubCard` riceve un ref implicito
- `Tooltip` dentro `TemplateHubCard` stesso problema

La `TemplateHubCard` e una funzione interna al file, non wrappata con `forwardRef`. Il warning viene dal Tooltip di Radix che tenta di passare un ref al suo child.

**Fix**: Il `TooltipTrigger` usa `asChild` e passa un ref al `<button>` child. Il problema e che il button non riceve correttamente il ref. Verificando il codice (linee 364-368), il `TooltipTrigger asChild` wrappa un `<button>` — questo dovrebbe funzionare. Il warning potrebbe venire dal fatto che la card stessa (div) riceve un ref dal grid. Non critico, ma risolvibile.

### Bug 2: RLS RESTRICTIVE sulle tabelle
Dalle tabelle fornite nel contesto, TUTTE le policy risultano `Permissive: No` (cioe RESTRICTIVE). Questo e un problema critico: con policy RESTRICTIVE, l'utente deve soddisfare TUTTE le policy simultaneamente (AND), il che significa che un company user non potra mai accedere ai dati perche la policy superadmin fallira sempre per lui.

**Nota**: Le verifiche precedenti hanno detto "0 RESTRICTIVE" ma i dati nel contesto mostrano chiaramente `Permissive: No` su tutte le tabelle. Questo potrebbe essere un problema di visualizzazione del contesto oppure un problema reale.

---

## Piano Fix

### Fix 1: Risolvere il warning forwardRef in TemplateHubCard
**File**: `src/pages/app/CreateAgent.tsx`
- Il warning viene dal Tooltip che non riesce a passare il ref. Wrappare il button del TooltipTrigger correttamente, oppure rimuovere `asChild` e usare il button di default del TooltipTrigger.

### Fix 2: Verificare lo stato RLS delle policy
Eseguire una query diretta su `pg_policies` per confermare se le policy sono effettivamente PERMISSIVE o RESTRICTIVE, dato che le informazioni nel contesto contrastano con le verifiche precedenti.

