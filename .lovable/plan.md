

# Analisi Completa: Stato Attuale vs Documento

## Completato (Fasi A-D1-fix)

| Fase | Stato |
|------|-------|
| A - Design System light theme | DONE |
| B - Schema DB rename columns | DONE |
| C - Pagine base Contacts/Lists/Campaigns | DONE |
| D1 - Colonne mancanti + funzioni DB | DONE |
| D1-fix - Trigger effettivi + default status | DONE |

## Stato Dettagliato delle Mancanze

### Routing — Mancante
| Route | Stato |
|-------|-------|
| `/app/contacts/import` | NON ESISTE |
| `/app/contacts/:id` | NON ESISTE |
| `/app/lists/:id` | NON ESISTE |
| `/app/campaigns/new` | NON ESISTE (usa dialog) |
| `/app/campaigns/:id` | NON ESISTE |
| `/superadmin/team` | NON ESISTE (link in sidebar) |

### Rubrica Contatti — Mancante
- Side panel dettaglio contatto (slide da destra) con tab Info/Chiamate/Note/Attività
- Vista Kanban drag & drop tra status
- Vista Schede (card grid)
- Checkbox multi-select con azioni bulk (Assegna Agente, Cambia Status, Aggiungi a Lista, Elimina)
- Filtri per settore e priorità (solo status implementato)
- Modifica/cancellazione contatti
- Click-to-call
- Paginazione: IMPLEMENTATA
- Export CSV: IMPLEMENTATO
- Form creazione con campi doc: IMPLEMENTATO

### Import Contatti — Interamente Mancante
- Upload CSV/Excel con drag & drop
- Mappatura colonne automatica + preview
- Gestione duplicati
- Progress bar inserimento batch

### Liste & Gruppi — Parziale
- Colore: IMPLEMENTATO
- Icona per lista: NON implementato (campo `icon` esiste in DB ma UI non lo usa)
- Azioni "Vedi Contatti" e "Crea Campagna": MANCANTI
- Dettaglio lista `/app/lists/:id`: MANCANTE

### Campagne — Parziale
- Lista + filtri + creazione base: IMPLEMENTATI
- Wizard 4 step: MANCANTE (usa dialog semplice)
- Dettaglio campagna con stats live: MANCANTE
- Start/pause/resume logic: MANCANTE
- Configurazione finestra oraria/retry/giorni: MANCANTE

### Dashboard Azienda — Parziale
- Stats base + agenti recenti + conversazioni: IMPLEMENTATI
- Quick actions (Importa Contatti, Nuova Campagna, Analytics): MANCANTI
- Widget "Contatti per Status": MANCANTE
- Widget "Prossime Chiamate": MANCANTE
- Info trial restante: MANCANTE

### Dashboard SuperAdmin — Parziale
- Stats KPI 4 card: IMPLEMENTATE
- Barra utilizzo mese (progress bar chiamate): MANCANTE
- Filtri settore/status sulla tabella aziende: MANCANTI (la pagina Companies li ha, Dashboard no)

### Wizard Nuova Azienda — Parziale
- 3 step con riepilogo: IMPLEMENTATO
- Checklist "cosa succede dopo" nello step 3: MANCANTE
- Campi aggiuntivi (telefono, sito web, città, P.IVA, note interne): MANCANTI
- Test connessione ElevenLabs nello step 2: MANCANTE

### Dettaglio Agente — Parziale
- Tab Panoramica/Configurazione/Test/Conversazioni: IMPLEMENTATI
- Tab Integrazione (embed widget, ID agente, richiesta telefonica): MANCANTE
- Tab Analytics (grafici recharts): MANCANTE
- Sezione Base di Conoscenza (upload PDF/TXT): MANCANTE

### Impersonazione SuperAdmin — Interamente Mancante
- `sessionStorage.impersonating` per "entrare" come azienda

### Design/UI — Gap Minori
- Token `violet` nei colori Tailwind: MANCANTE (usato solo inline `violet-100/700`)

---

## Piano Fasi Rimanenti (aggiornato)

### Fase D2 — Contacts Avanzati
- Side panel dettaglio contatto con tab
- Filtri settore/priorità
- Modifica/cancellazione contatti
- Checkbox multi-select + azioni bulk

### Fase D3 — Import Contatti
- `/app/contacts/import` wizard 3 step
- Upload/parsing CSV, mappatura colonne, inserimento batch

### Fase D4 — Campagne Avanzate
- Wizard 4 step `/app/campaigns/new`
- Dettaglio campagna `/app/campaigns/:id`
- Start/pause/resume

### Fase D5 — Dashboard Enhancement + Impersonazione
- Widget mancanti su entrambe le dashboard
- Campi extra wizard nuova azienda
- Impersonazione superadmin

### Fase D6 — Agent Detail Enhancement
- Tab Integrazione + Analytics + Base di Conoscenza
