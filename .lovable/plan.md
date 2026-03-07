

# Piano: Completamento Modulo — Pagine Mancanti, Editor Agente, SuperAdmin Economics

## Stato Attuale

Il sistema crediti Euro-based è già implementato (DB, edge functions, pagina Credits, sidebar footer, VoiceTestPanel check). Il documento master richiede ancora diverse pagine e funzionalità.

## Blocco di Implementazione

Data la complessità, questo blocco copre le seguenti aree prioritarie:

### 1. Pagine Placeholder — Phone Numbers & Knowledge Base

**`/app/phone-numbers`** — Lista numeri con empty state, card per ogni numero (agente collegato, orari, costo, stats), button "Acquista Numero"

**`/app/phone-numbers/buy`** — Wizard 3 step: Paese/Tipo → Numeri disponibili (mock data per ora) → Collega ad agente + conferma

**`/app/knowledge-base`** — KB globale: lista documenti da `ai_knowledge_docs` dove `agent_id IS NULL`, button "Aggiungi Documento" con modal 3 tab (URL/File/Testo), indicatore storage

### 2. SuperAdmin Dashboard — Sezione Economics

Aggiungere sotto le card esistenti:
- 4 KPI card da `monthly_billing_summary`: Incassato, Costo EL, Margine, Margine %
- Tabella saldo crediti per azienda con stato (Regolare/Basso/Bloccato) e button "Sblocca manualmente" → modal per aggiungere crediti bonus (tipo `adjustment`)

### 3. PlatformSettings — Riepilogo Economico

Nella tab "Prezzi & Markup", aggiungere in fondo:
- 4 KPI card mese corrente (stessi dati da `monthly_billing_summary` o `ai_credit_usage` aggregato)

### 4. Routing & App.tsx

Aggiungere route:
- `/app/phone-numbers` → PhoneNumbers
- `/app/phone-numbers/buy` → BuyPhoneNumber  
- `/app/knowledge-base` → KnowledgeBase
- `/app/contacts/:id` → ContactDetail (placeholder)

### 5. Sidebar — Aggiornamento sezioni

La sidebar ha già le voci RISORSE (Numeri, KB, Crediti). Verificare che la struttura del documento sia rispettata — il doc organizza diversamente:
- PRINCIPALE: Dashboard, Agenti AI
- COMUNICAZIONE: Numeri di Telefono, Knowledge Base, Conversazioni
- CONTATTI: Rubrica, Liste & Gruppi, Campagne
- REPORT: Analytics, Crediti
- ACCOUNT: Impostazioni

Allineare la sidebar a questa struttura.

## File da creare/modificare

| File | Azione |
|------|--------|
| `src/pages/app/PhoneNumbers.tsx` | Nuovo (~200 righe) |
| `src/pages/app/BuyPhoneNumber.tsx` | Nuovo (~250 righe) |
| `src/pages/app/KnowledgeBase.tsx` | Nuovo (~200 righe) |
| `src/pages/app/ContactDetail.tsx` | Nuovo placeholder (~100 righe) |
| `src/pages/superadmin/Dashboard.tsx` | Aggiunta sezione Economics (~100 righe) |
| `src/pages/superadmin/PlatformSettings.tsx` | Aggiunta KPI economici nel tab pricing |
| `src/components/layout/Sidebar.tsx` | Riallineamento sezioni al doc |
| `src/App.tsx` | 4 nuove route |

Nessuna modifica al database necessaria — le tabelle `ai_phone_numbers`, `ai_knowledge_docs` esistono già.

