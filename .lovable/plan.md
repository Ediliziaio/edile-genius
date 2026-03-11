

# Architettura di Prodotto — Edile Genius

## FASE 1 — Analisi dell'attuale struttura

### Problemi strutturali trovati

**1. Cantieri è un prodotto parallelo, non un modulo**
La sidebar ha una sezione "CANTIERI" con 3 voci (Gestione Cantieri, Documenti e Scadenze, Presenze) che è un gestionale operativo completamente separato dalla logica degli Agenti AI. Sta nella stessa navigazione come se fosse allo stesso livello di "Agenti", ma ha zero relazione con la value proposition core. Confonde il posizionamento: l'utente non capisce se sta comprando un sistema AI o un gestionale cantieri.

**2. Settings è un cassetto disordinato**
`Settings.tsx` (705 righe) contiene 6 tab: Profilo, API (ElevenLabs test), CRM, Webhooks, Notifiche, Fatturazione. Mescola configurazione utente, integrazioni tecniche, e billing in un unico posto. Le integrazioni CRM e i Webhook dovrebbero vivere altrove.

**3. Contatti + Campagne + Liste sono un mini-CRM non dichiarato**
Rubrica, Liste, Campagne, Import CSV formano un CRM embrionale che compete con i CRM esterni che l'utente già usa. Il rischio è: costruire un CRM mediocre invece di integrarsi bene con quelli esistenti.

**4. WhatsApp è trattato come pagina standalone**
`/app/whatsapp` (1549 righe) è un modulo enorme con subscription, numbers, templates, conversations, broadcast, settings — tutto dentro un singolo file. È di fatto un sotto-prodotto, ma vive come una voce nascosta in "Impostazioni > Telefono e WhatsApp".

**5. Render AI è disconnesso dal resto**
RenderHub, RenderNew, RenderGallery sono un modulo visual che non ha nessuna relazione con gli agenti. Non appare nemmeno nella sidebar company attuale. È un add-on vendibile separatamente ma oggi è orfano.

**6. Knowledge Base è in Impostazioni ma è core**
L'archivio conoscenze determina la qualità degli agenti. Nasconderlo in "Impostazioni" lo rende invisibile e sottovalutato.

**7. Preventivi ha logica autonoma ma è sotto "Contatti & Vendite"**
Il modulo preventivi (audio→PDF, template, tracking) è un tool stand-alone. Metterlo accanto a "Rubrica" non ha senso logico — non è un'attività di vendita, è uno strumento operativo.

**8. Troppi livelli di navigazione mescolati**
6 sezioni sidebar con 14 voci. Un utente che entra per la prima volta vede: Dashboard, Agenti, Crea Nuovo, Conversazioni, Rubrica, Campagne, Preventivi, Cantieri, Documenti, Presenze, Analytics, Telefono, Knowledge Base, Crediti, Account. È un muro.

**9. Sovrapposizioni concrete**
- "Conversazioni" nella sidebar È GIÀ dentro AgentDetail → tab Conversazioni
- "Analytics" nella sidebar È GIÀ dentro AgentDetail → tab Risultati
- "Knowledge Base" È GIÀ dentro AgentDetail → tab Impostazioni
- Tre posti per la stessa informazione = confusione

**10. Nessun modulo "Integrazioni" reale**
CRM sync, Webhooks, WhatsApp connect, Telegram config, N8N — tutto sparso tra Settings, WhatsApp page, CantiereConfig, PlatformSettings. L'utente non ha un posto unico per "collegare i miei sistemi".

---

## FASE 2 + 3 — Struttura ideale e classificazione

### MODULI CORE (devono esistere, devono dominare la UX)

**1. Control Room (Dashboard)**
- Scopo: vista istantanea dello stato dell'azienda AI
- Contiene: KPI agenti attivi, chiamate oggi/mese, crediti, azioni consigliate, agenti da completare
- Non contiene: configurazioni, dettagli tecnici, log
- Visibile: sempre, prima voce
- Priorità: P1

**2. Agenti**
- Scopo: creare, gestire, monitorare tutti gli agenti AI
- Contiene: lista agenti, creazione da template, dettaglio con panoramica/prompt/conversazioni/risultati/impostazioni
- Include: il template hub come sotto-flusso di creazione
- Include: conversazioni e analytics come tab dentro ogni agente (non come pagine separate nella sidebar)
- Non contiene: knowledge base globale, integrazioni globali
- Visibile: sempre, sezione primaria
- Priorità: P1

**3. Contatti**
- Scopo: gestire la rubrica e le liste per campagne outbound
- Contiene: rubrica, liste, import, dettaglio contatto
- Non contiene: campagne (sono un'attività degli agenti), preventivi
- Visibile: sempre
- Priorità: P1

### MODULI DI SUPPORTO (rafforzano il valore, non dominano)

**4. Campagne Outbound**
- Scopo: lanciare campagne di chiamate outbound con gli agenti
- Contiene: lista campagne, wizard creazione, dettaglio/progresso
- È un'attività che UTILIZZA agenti + contatti, quindi va separata da entrambi
- Visibile: sempre, ma sotto i contatti
- Priorità: P2

**5. Preventivi**
- Scopo: strumento operativo per creare preventivi professionali da audio/foto
- Contiene: lista preventivi, wizard creazione, dettaglio, template PDF
- Non contiene: rubrica contatti, campagne
- Va trattato come tool operativo autonomo
- Visibile: sempre
- Priorità: P2

**6. Archivio Conoscenze**
- Scopo: alimentare tutti gli agenti con documenti, URL, testi
- Deve uscire da "Impostazioni" e diventare sezione propria
- È il "cervello" condiviso degli agenti — va promosso
- Visibile: sempre, nella sezione agenti
- Priorità: P1

**7. Risultati (Analytics)**
- Scopo: vista aggregata cross-agente delle performance
- Contiene: grafici, KPI, trend, confronti tra agenti
- Le analytics per-agente restano dentro AgentDetail
- Questa pagina serve per il quadro complessivo
- Visibile: sempre
- Priorità: P2

### MODULI AVANZATI (utili ma da rendere secondari)

**8. Integrazioni**
- Scopo: un posto unico per collegare sistemi esterni
- Contiene: CRM sync (oggi in Settings), Webhooks (oggi in Settings), WhatsApp Business (oggi pagina standalone), Telefonia/numeri, Telegram config
- Non contiene: configurazione account, profilo utente
- Deve essere un singolo hub con card per integrazione
- Visibile: sezione impostazioni, ma come voce propria prominente
- Priorità: P2

**9. Crediti e Piano**
- Scopo: billing, consumo, ricarica
- Contiene: saldo, storico, auto-recharge, piani
- Visibile: impostazioni
- Priorità: P1 (perché blocca l'uso se vuoto)

**10. Account**
- Scopo: profilo utente, notifiche, sicurezza
- Contiene: nome/avatar, notifiche, password
- Non contiene: CRM, webhooks, integrazioni, API keys
- Visibile: impostazioni
- Priorità: P3

### MODULI DA SEPARARE

**11. Cantieri → Modulo separato / add-on**
- Posizione strategica: è un gestionale operativo, non AI. Non deve stare allo stesso livello degli agenti.
- Opzioni: (A) Spostarlo in una sotto-sezione "Strumenti Operativi" con label chiara, (B) Renderlo un add-on attivabile, (C) Separarlo completamente.
- Raccomandazione: opzione A — sezione propria "OPERATIVITÀ" in fondo alla sidebar, collassabile. Non deve competere visivamente con gli agenti.
- Include: Cantieri, Documenti/Scadenze, Presenze
- Priorità: P3

**12. Render AI → Modulo separato / add-on**
- Non è un agente. Non è un'automazione. È un tool visual.
- Deve avere una sezione propria "Strumenti AI" o essere un add-on attivabile
- Non deve mai confondersi con "Agenti"
- Priorità: P3

### MODULI DA UNIFICARE

**13. WhatsApp → dentro Integrazioni**
- Oggi è una pagina monster standalone. Va smontata:
  - Connessione numero → Integrazioni hub
  - Template messaggi → sotto-sezione di Integrazioni > WhatsApp
  - Conversazioni WhatsApp → dentro Conversazioni dell'agente WhatsApp
  - Broadcast → dentro Campagne (è un tipo di campagna)

**14. Telefono + WhatsApp → dentro Integrazioni**
- "Telefono e WhatsApp" è oggi una voce sidebar. Va dentro Integrazioni come card "Telefonia" e card "WhatsApp".

**15. Conversazioni sidebar → RIMUOVERE dalla sidebar**
- Le conversazioni sono GIÀ dentro ogni agente. La vista globale cross-agente può restare come sotto-tab di "Risultati" o come filtro nella lista agenti.
- Avere "Conversazioni" come voce separata nella sidebar crea ridondanza.

### MODULI MANCANTI

**16. Onboarding Center**
- Oggi non esiste. L'utente entra e vede la dashboard vuota.
- Serve: welcome flow, checklist primo agente, setup guidato
- Priorità: P1

**17. Centro Notifiche**
- Oggi le notifiche sono switch in Settings. Non c'è un feed di attività.
- Serve: bell icon in topbar con feed di eventi recenti (nuovo lead qualificato, agente bloccato, crediti bassi)
- Priorità: P2

---

## FASE 4 — Separazione Agenti esterni vs interni vs Visual

```text
┌─────────────────────────────────────────────────────┐
│                    EDILE GENIUS                      │
├──────────────┬──────────────┬────────────────────────┤
│  AGENTI      │  STRUMENTI   │  STRUMENTI             │
│  OPERATIVI   │  INTERNI AI  │  VISUAL AI             │
│              │              │                        │
│  • Voce      │  (Futuro)    │  • Render Infissi      │
│  • WhatsApp  │  • Lead      │  • Mockup ambienti     │
│  • Email     │    scoring   │  • Preview prodotti    │
│  • Chat      │  • Sintesi   │                        │
│  • Outbound  │    chiamate  │  Separato dagli        │
│              │  • Alert     │  agenti. È un tool.    │
│  Questi sono │    commerc.  │                        │
│  gli AGENTI  │              │  Accesso: sezione      │
│  che il      │  Accesso:    │  "Strumenti AI" o      │
│  cliente     │  integrati   │  add-on nella sidebar  │
│  compra.     │  nei flussi, │                        │
│              │  non moduli  │                        │
│  Accesso:    │  separati    │                        │
│  "I Miei     │              │                        │
│  Agenti"     │              │                        │
└──────────────┴──────────────┴────────────────────────┘
```

Gli "Agenti interni" (lead scoring, sintesi, suggerimenti) oggi non esistono come modulo e NON devono diventare un modulo separato. Devono essere funzionalità embedded nei flussi esistenti (es. badge nel dettaglio contatto, insight nella dashboard, suggerimenti nelle azioni consigliate).

---

## FASE 5 — Valutazione moduli fondamentali

| Modulo | Esiste? | Deve essere modulo o sottosezione? | Visibilità | Classe |
|--------|---------|-------------------------------------|------------|--------|
| Dashboard / Control Room | Sì | Modulo | Prima voce | Core P1 |
| Agent Builder (wizard) | Sì | Sotto-flusso di Agenti | On-demand | Core P1 |
| Template Library | Sì (dentro CreateAgent) | Sotto-flusso di Agenti | On-demand | Core P1 |
| Agent Management | Sì | Modulo | Primario | Core P1 |
| Knowledge Base | Sì (nascosto) | Modulo proprio | Primario | Supporto P1 |
| Integrations Hub | No (sparso) | Modulo proprio | Impostazioni | Supporto P2 |
| Event Engine (Webhooks/N8N) | Parziale (in Settings) | Sotto-sezione di Integrazioni | Avanzato | Avanzato P3 |
| AI Sales Brain | No | Non serve come modulo — embed nei flussi | — | Futuro P3 |
| Cost & Usage Center | Sì (Credits) | Modulo | Impostazioni | Core P1 |
| Analytics / KPI | Sì | Modulo | Secondario | Supporto P2 |
| Internal AI Tools | No | Non creare modulo — embed | — | Futuro P3 |
| Visual AI / Render | Sì | Modulo separato | Add-on | Separato P3 |
| Settings | Sì (sovraccarico) | Smontare in Account + Integrazioni | Secondario | — |
| API / Webhook Layer | Sì (in Settings) | Sotto-sezione Integrazioni | Avanzato | Avanzato P3 |
| CRM Sync Layer | Sì (in Settings) | Sotto-sezione Integrazioni | Avanzato | Supporto P2 |
| Onboarding Center | No | Flusso condizionale al primo accesso | On-demand | Core P1 |

---

## FASE 7 — Architettura di prodotto consigliata

### Sidebar company — struttura finale

```text
PANNELLO DI CONTROLLO
  └ Dashboard                          P1

I MIEI AGENTI
  ├ Tutti gli Agenti                   P1
  ├ Archivio Conoscenze                P1
  └ Risultati                          P2

VENDITE
  ├ Contatti                           P1
  ├ Campagne                           P2
  └ Preventivi                         P2

OPERATIVITÀ (collapsible, chiuso default)
  ├ Cantieri                           P3
  ├ Documenti                          P3
  └ Presenze                           P3

STRUMENTI AI (solo se attivato)
  └ Render Infissi                     P3

IMPOSTAZIONI
  ├ Integrazioni                       P2
  ├ Crediti e Piano                    P1
  └ Account                            P3
```

### Cosa sparisce dalla sidebar
- **"Crea Nuovo"** → non serve come voce sidebar, c'è il bottone nella lista agenti
- **"Conversazioni"** → dentro ogni agente + filtro in Risultati
- **"Telefono e WhatsApp"** → dentro Integrazioni
- **"Archivio Conoscenze"** promosso da Impostazioni a "I Miei Agenti"

### Voci ridotte: da 14 a 11 (e 3 collassate)

---

## FASE 8 — Priorità di implementazione

**P1 — Essenziale subito**
- Dashboard con onboarding condizionale (se 0 agenti → welcome flow)
- Agenti (lista + dettaglio + wizard semplificato) — già fatto
- Contatti (rubrica base)
- Knowledge Base promosso in sidebar
- Crediti e Piano (blocca l'uso)
- Ristrutturazione sidebar secondo la nuova architettura

**P2 — Importante dopo**
- Campagne outbound
- Preventivi
- Risultati (analytics cross-agente)
- Hub Integrazioni (CRM + Webhooks + WhatsApp + Telefonia unificati)
- Centro Notifiche (bell icon)

**P3 — Utile ma successivo**
- Cantieri / Documenti / Presenze (sezione collassata)
- Render AI (add-on)
- Event Engine / N8N avanzato
- Account (profilo/sicurezza)

---

## FASE 9 — Cosa nascondere

| Elemento | Dove va | Come |
|----------|---------|------|
| ElevenLabs Agent ID | Impostazioni agente, ultima sezione | Collapsible "Dettagli tecnici" |
| Webhook JSON payload | Integrazioni > Webhooks | Espandibile su click |
| N8N workflow config | Integrazioni > Automazioni | Solo superadmin o admin avanzato |
| System logs | Solo superadmin | Mai visibile a company |
| Platform pricing/markup | Solo superadmin | Mai visibile a company |
| API keys raw | Integrazioni | Mascherati con •••• |
| Temperature/LLM model | Wizard step 1 collapsible | Già implementato |
| PII redaction / ASR quality | AgentDetail > Impostazioni | Collapsible "Sicurezza" |
| Voice stability/similarity decimali | AgentDetail > Prompt e Voce | Slider senza decimali |
| Webhook secret | Integrazioni | Copiabile ma mascherato |
| config_schema JSON | Solo superadmin templates | Mai visibile a company |

---

## FASE 10 — Raccomandazione finale

### Come deve essere percepito il prodotto
"Entro, vedo i miei agenti che lavorano, capisco i risultati, posso attivarne di nuovi in 3 minuti."

### Struttura che aiuta a vendere
- **3 macro-aree primarie** (Agenti, Vendite, Operatività) = 3 value proposition vendibili come pacchetti
- Dashboard come "control room" dove l'imprenditore vede che l'AI sta lavorando
- Template hub come "catalogo servizi" — ogni template è un servizio vendibile
- Integrazioni come "si collega ai tuoi sistemi" — non "configura webhook"

### Cosa evitare
- Non aggiungere MAI più di 12 voci sidebar per company
- Non creare moduli che esistono solo perché tecnicamente possibili (es. "Event Engine" come modulo UI)
- Non esporre configurazioni provider (ElevenLabs, OpenAI, Meta) all'utente finale
- Non duplicare informazioni in più posti (conversazioni in sidebar + in agente + in analytics)
- Non mescolare strumenti operativi (cantieri) con strumenti AI (agenti) nella stessa gerarchia visiva

### Implementazione raccomandata — primo step
Ristrutturare la sidebar e le route secondo l'architettura proposta. È un intervento UX-only che riorganizza ciò che già esiste senza toccare backend, con impatto immediato sulla percezione del prodotto.

