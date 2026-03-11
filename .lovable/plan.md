

# Riprogettazione Dashboard KPI — Edile Genius

## 1. ANALISI DELLA DASHBOARD ATTUALE

### Problemi trovati

**La dashboard attuale non è una dashboard KPI.** E' una schermata di stato/onboarding con 4 zone:
- Hero con greeting + 3 status pills (agenti attivi, conversazioni mese, crediti)
- Onboarding checklist OR smart actions (bozze, numeri mancanti, crediti bassi)
- Griglia completa di tutte le AgentCard
- Tabella ultime 5 conversazioni

**KPI deboli o assenti:**
- "Conversazioni questo mese" è un numero grezzo senza contesto (0 su cosa? meglio o peggio del mese scorso?)
- Zero KPI sui risultati commerciali (appuntamenti fissati, lead qualificati, preventivi recuperati)
- Zero KPI sulla performance (tasso successo, durata media)
- Il saldo crediti è mostrato come pill + nel sidebar — duplicato e senza contesto di consumo
- Nessun trend o confronto temporale
- Nessun alert proattivo oltre ai crediti

**Problemi di gerarchia:**
- Le AgentCard occupano il 60% dello spazio ma non mostrano KPI aggregati — sono solo una lista navigazione
- La tabella "Attività Recente" mostra dati grezzi (durata in secondi, outcome tecnici) senza valore decisionale
- L'onboarding checklist è utile solo al primo accesso, poi diventa rumore

**Dati disponibili in Supabase che oggi non vengono usati in dashboard:**
- `conversations.outcome` → appuntamenti (`appointment`), qualificati (`qualified`)
- `conversations.duration_sec` → durata media
- `conversations.direction` → inbound vs outbound
- `agents.calls_month`, `agents.calls_total`, `agents.avg_duration_sec`
- `ai_credits.balance_eur`, `ai_credits.total_spent_eur`
- `ai_credit_usage` → costo per agente (già disponibile)

---

## 2. NUOVA STRUTTURA DELLA DASHBOARD

```text
┌──────────────────────────────────────────────────────┐
│  ZONA A — Hero sintetico (greeting + stato generale) │
│  1 riga: nome utente + 3 status pills               │
│  + banner alert se crediti bloccati                   │
├──────────────────────────────────────────────────────┤
│  ZONA B — KPI Principali (4 card grandi)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │Agenti    │ │Interaz.  │ │Appunt.   │ │Crediti   ││
│  │Attivi    │ │Questo    │ │Fissati   │ │Rimasti   ││
│  │          │ │Mese      │ │          │ │          ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
├──────────────────────────────────────────────────────┤
│  ZONA C — Da Fare Adesso (smart actions, max 3)      │
│  Solo se ci sono azioni. Nascosto se tutto ok.       │
├──────────────────────────────────────────────────────┤
│  ZONA D — Risultati del Mese (breakdown outcomes)    │
│  Mini chart orizzontale: appuntamenti, qualificati,  │
│  non interessati, segreteria — con numeri             │
├──────────────────────────────────────────────────────┤
│  ZONA E — Attività Recente (5 righe, semplificata)   │
│  Agente | Risultato | Quando                         │
└──────────────────────────────────────────────────────┘
```

**Cosa viene RIMOSSO dalla dashboard:**
- La griglia completa AgentCard → spostata nella pagina `/app/agents` (dove già esiste). In dashboard mostrare solo un riassunto numerico.
- L'onboarding checklist → mostrata SOLO se `agents.length === 0`. Una volta che l'utente ha almeno 1 agente, sparisce per sempre.
- Colonna "Durata" dalla tabella recenti → dato tecnico, non utile all'imprenditore
- Status pill "conversazioni questo mese" → diventa KPI card con più contesto

---

## 3. KPI CONSIGLIATI

### KPI Card 1: Agenti Attivi
- **Cosa misura:** Agenti con status "active" / totale agenti
- **Perché è utile:** L'imprenditore capisce se i suoi agenti stanno lavorando
- **Priorità:** P1
- **Dove:** Zona B, prima card
- **Formato:** "3 / 5 attivi" con icona verde se tutti attivi, giallo se alcuni inattivi
- **Decisione:** "Devo completare/attivare qualcosa?"

### KPI Card 2: Interazioni Questo Mese
- **Cosa misura:** Count di `conversations` del mese corrente
- **Perché è utile:** Volume di lavoro degli agenti
- **Priorità:** P1
- **Dove:** Zona B, seconda card
- **Formato:** Numero grande + delta vs mese precedente (se disponibile, fetch mese-1)
- **Decisione:** "I miei agenti stanno lavorando abbastanza?"

### KPI Card 3: Appuntamenti Fissati
- **Cosa misura:** Count di `conversations` con `outcome = 'appointment'` nel mese
- **Perché è utile:** IL KPI più importante per un imprenditore edile. Appuntamenti = soldi.
- **Priorità:** P1
- **Dove:** Zona B, terza card
- **Formato:** Numero grande con icona calendario, colore primario
- **Decisione:** "L'AI sta portando risultati concreti?"

### KPI Card 4: Crediti Disponibili
- **Cosa misura:** `ai_credits.balance_eur`
- **Perché è utile:** Evitare blocchi, pianificare ricariche
- **Priorità:** P1
- **Dove:** Zona B, quarta card
- **Formato:** €XX.XX con barra usage e colore condizionale (verde > €5, giallo €1-5, rosso < €1)
- **Decisione:** "Devo ricaricare?"

### Sezione Risultati del Mese (Zona D)
- **Cosa misura:** Breakdown degli outcome delle conversazioni del mese
- **Priorità:** P1
- **Formato:** 4-5 mini-pill orizzontali con conteggio: Appuntamenti (X), Qualificati (X), Richiamata (X), Non interessati (X), Segreteria (X)
- **Decisione:** "Come sta andando la conversione?"

---

## 4. KPI DA RIMUOVERE / NASCONDERE

| Elemento attuale | Azione | Motivo |
|---|---|---|
| Griglia completa AgentCard | **Rimuovere** dalla dashboard | Appartiene a `/app/agents`. Dashboard deve mostrare KPI, non navigazione. Un link "Vedi tutti gli agenti →" basta. |
| Colonna "Durata" nella tabella recenti | **Rimuovere** | Dato tecnico irrilevante per l'imprenditore |
| Onboarding checklist (quando hasAgents) | **Nascondere** | Dopo il primo agente, l'onboarding è completato. Le smart actions bastano. |
| Status pill "conversazioni questo mese" | **Promuovere** a KPI card | La pill è troppo piccola per un dato così importante |
| Status pill "agenti attivi" | **Promuovere** a KPI card | Idem |
| Status pill "crediti" | **Promuovere** a KPI card | Il dato è già nel sidebar, ma in dashboard serve con più contesto |

---

## 5. MIGLIORAMENTI UX

### Lettura in 10 secondi
L'imprenditore apre la dashboard e vede:
1. **Greeting** → contesto personale (1 sec)
2. **4 KPI card** → stato immediato del business (5 sec)
3. **Alert/azioni** → solo se serve intervenire (2 sec)
4. **Risultati** → breakdown performance (2 sec)

### Microcopy migliorato
- "Conversazioni" → "Interazioni gestite" (più business)
- "Outcome: appointment" → "Appuntamento fissato"
- "Outcome: qualified" → "Lead qualificato"
- "Outcome: not_interested" → "Non interessato"
- "Outcome: voicemail" → "Segreteria"
- "Outcome: callback" → "Da richiamare"
- Tabella recenti header: "Agente | Risultato | Quando" (rimuovere Durata)

### Empty states
- 0 interazioni: "I tuoi agenti non hanno ancora gestito interazioni questo mese. Verifica che siano attivi."
- 0 appuntamenti: "Nessun appuntamento fissato questo mese."
- 0 agenti: Onboarding checklist (mantenerlo solo in questo caso)

---

## 6. IMPLEMENTAZIONE TECNICA

### File: `src/pages/app/Dashboard.tsx` — Riscrittura completa

**Query da aggiungere:**
- Conversazioni mese precedente (per delta %)
- Breakdown outcome del mese corrente (count per outcome)

**Struttura nuova del componente:**
1. Hero greeting (semplificato, senza status pills)
2. 4 KPI card grid (agenti attivi con ratio, interazioni mese con delta, appuntamenti fissati, crediti con barra)
3. Smart actions (condizionale, max 3)
4. Sezione "Risultati del Mese" — pill orizzontali per outcome
5. Tabella "Attività Recente" — 3 colonne: Agente, Risultato, Quando
6. Onboarding checklist — solo se 0 agenti (come oggi, nessun cambiamento)

**Rimozione:**
- Griglia AgentCard completa → solo un link "Vedi tutti gli agenti"
- Status pills → sostituiti da KPI card

Nessun altro file da modificare. La dashboard è contenuta interamente in `Dashboard.tsx`.

---

## 7. PRIORITÀ

**P1 — Implementare ora:**
- 4 KPI card (agenti attivi, interazioni mese, appuntamenti fissati, crediti)
- Rimuovere griglia AgentCard dalla dashboard
- Sezione "Risultati del Mese" con breakdown outcome
- Tabella recenti semplificata (3 colonne)
- Microcopy business-oriented

**P2 — Dopo:**
- Delta % vs mese precedente sulle KPI card
- Mini sparkline nelle card (richiede dati giornalieri)

**P3 — Successivo:**
- KPI "Costo per appuntamento" (richiede join credits + outcomes)
- KPI per agente nella dashboard (breakdown)

