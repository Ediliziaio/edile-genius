

# Analisi Completa: Documento vs Implementazione Attuale

## Stato Attuale

Il design system (Fase A), lo schema DB (Fase B) e le pagine base (Fase C) sono implementati. Ecco cosa **manca** rispetto al documento (50 pagine analizzate):

---

## 1. Schema DB — Colonne Mancanti

Il documento specifica molte colonne che non esistono nel DB attuale:

### `companies` — mancano:
- `phone`, `website`, `address`, `city`, `vat_number`, `notes_internal`
- `monthly_calls_limit` (DEFAULT 500), `calls_used_month` (DEFAULT 0)
- `updated_at`

### `profiles` — mancano:
- `phone`, `job_title`
- Il documento mette `role` direttamente su profiles (noi usiamo `user_roles` separato — **meglio così**, non cambiare)

### `agents` — mancano:
- `voice_name`, `temperature` (NUMERIC), `max_duration_sec`, `silence_sec`, `interrupt_enabled`
- `calls_qualified`, `updated_at`

### `contacts` — schema molto diverso:
- Il documento usa `first_name` + `last_name` (noi usiamo `full_name`)
- Mancano: `phone_alt`, `company_name`, `address`, `city`, `province`, `cap`, `sector`, `priority`, `last_contact_at`, `next_call_at`, `assigned_agent`, `assigned_user`, `call_attempts`, `metadata`, `created_by`
- Status diversi: il doc ha `new/to_call/called/qualified/not_qualified/appointment/callback/do_not_call/invalid` (noi: `lead/qualified/customer/lost`)
- Source diversi: il doc ha `manual/import_csv/import_excel/api/web_form/referral/cold_outreach`

### `contact_lists` — mancano:
- `color`, `icon`, `contact_count`, `status`, `created_by`

### `contact_list_members` — mancano:
- `added_at`
- Il doc usa `PRIMARY KEY (list_id, contact_id)` (noi usiamo `id` UUID + unique pair)

### `campaigns` — schema molto diverso:
- Mancano: `description`, `custom_first_msg`, `scheduled_start`, `scheduled_end`, `call_hour_limit`, `retry_attempts`, `retry_delay_min`, `call_window_start`, `call_window_end`, `call_days`, `contacts_total/called/reached/qualified`, `appointments_set`, `avg_duration`, `created_by`, `updated_at`
- Il doc usa `list_id` (noi: `contact_list_id`)
- Status diversi: il doc ha anche `scheduled/cancelled`

### `conversations` — mancano:
- `contact_id`, `campaign_id`, `direction`, `phone_number`, `summary`, `sentiment`

### `notes` — mancano:
- (struttura base OK, manca solo linking a conversations — gia presente)

### Trigger mancanti:
- `set_updated_at()` trigger su companies, agents, contacts, profiles
- `sync_list_count()` trigger su contact_list_members

---

## 2. Pagine/Funzionalità Mancanti

### Routing mancante (dal documento):
- `/app/contacts/import` — Wizard import CSV/Excel (3 step)
- `/app/contacts/:id` — Scheda contatto dettaglio
- `/app/lists/:id` — Dettaglio lista
- `/app/campaigns/new` — Wizard nuova campagna (4 step)
- `/app/campaigns/:id` — Dettaglio campagna
- `/superadmin/team` — Team management

### Rubrica Contatti — funzionalità mancanti:
- Vista Kanban (drag & drop tra status)
- Vista Schede (card grid)
- Paginazione (25/50/100 per pagina)
- Checkbox multi-select con azioni bulk (Assegna Agente, Cambia Status, Aggiungi a Lista, Pianifica Chiamata, Elimina)
- Side Panel dettaglio contatto (slide da destra) con tab Info/Chiamate/Note/Attività
- Filtri: settore, priorità
- Export CSV
- Click-to-call

### Import Contatti — interamente mancante:
- Upload CSV/Excel con drag & drop
- Mappatura colonne automatica
- Preview prime 3 righe
- Gestione duplicati
- Assegna a lista durante import
- Progress bar durante import

### Liste & Gruppi — funzionalità mancanti:
- Colore e icona per ogni lista
- "Vedi Contatti" e "Crea Campagna" come azioni
- Dettaglio lista `/app/lists/:id`

### Campagne — funzionalità mancanti:
- Wizard creazione 4 step (non implementato, c'è solo dialog base)
- Dettaglio campagna con stats live
- Start/pause/resume logic
- Configurazione finestra oraria, retry, giorni

### Dashboard Azienda — mancano:
- Quick actions (Importa Contatti, Nuova Campagna, Analytics)
- "Contatti per Status" widget
- "Prossime Chiamate" widget
- Info trial restante

### Dashboard SuperAdmin — mancano:
- Barra utilizzo mese (progress bar chiamate)
- Filtri settore/status sulla tabella aziende

### Wizard Nuova Azienda — mancano:
- Step 3 con riepilogo e checklist "cosa succede dopo"
- Campi aggiuntivi: telefono, sito web, città, P.IVA, note interne
- Test connessione ElevenLabs nello step 2

### Dettaglio Agente — mancano:
- Tab Integrazione (embed widget, ID agente, richiesta telefonica)
- Tab Analytics (grafici recharts)
- Sezione "Base di Conoscenza" (upload PDF/TXT)

### Impersonazione SuperAdmin:
- Il documento descrive un sistema di impersonazione (`sessionStorage.impersonating`) per permettere ai superadmin di "entrare" come un'azienda

---

## 3. Design/UI — Gap Minori

- Il documento specifica token `violet` nei colori — mancante nel Tailwind config
- Il documento specifica font `Plus Jakarta Sans` e `JetBrains Mono` — **OK, gia implementati**
- Google Fonts link in `index.html` — **OK, presente**
- Login dot grid SVG — **OK, implementato**
- Sidebar sezioni — **OK, implementato**

---

## Piano di Implementazione Suggerito

Data la portata enorme delle differenze, suggerisco di procedere in sotto-fasi:

### Fase D1 — Schema DB Alignment (colonne mancanti)
Migration per aggiungere tutte le colonne mancanti a `companies`, `agents`, `contacts`, `contact_lists`, `campaigns`, `conversations`. Creare i trigger `set_updated_at` e `sync_list_count`. Aggiornare i frontend che usano i campi rinominati (es. contacts status values).

### Fase D2 — Contacts Avanzati
- Aggiungere campi extra al form di creazione contatto
- Side panel dettaglio contatto con tab
- Vista Kanban e Schede
- Multi-select + azioni bulk
- Paginazione
- Export CSV

### Fase D3 — Import Contatti
- Pagina `/app/contacts/import` con wizard 3 step
- Upload e parsing CSV
- Mappatura colonne
- Inserimento batch

### Fase D4 — Campagne Avanzate
- Wizard creazione campagna 4 step
- Dettaglio campagna `/app/campaigns/:id`
- Start/pause logic

### Fase D5 — Dashboard Enhancement
- Widget mancanti su entrambe le dashboard
- Impersonazione superadmin

### Fase D6 — Agent Detail Enhancement
- Tab Integrazione
- Tab Analytics
- Base di Conoscenza

