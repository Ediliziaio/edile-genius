

# AUDIT FINALE — Edile Genius

---

## 1. VALUTAZIONE GENERALE

| Dimensione | Voto | Nota |
|---|---|---|
| **Maturità prodotto** | 7/10 | Struttura solida, moduli principali funzionanti, ma con aree ancora "scheletro" |
| **Vendibilità** | 6/10 | Il core (agenti vocali + template hub + crediti) è vendibile. Il resto è rumore per il cliente |
| **Robustezza tecnica** | 6.5/10 | Webhook e billing sono solidi. Edge functions tutte con `verify_jwt = false` — rischio critico |
| **UX/Chiarezza** | 6/10 | Sidebar ben organizzata, ma troppe voci per un nuovo utente. Dashboard migliorata. Template hub forte |
| **Sicurezza** | 5/10 | RLS presente ovunque, ma TUTTE le edge functions hanno JWT disabilitato. Alcune non autenticano internamente |

**Punti forti principali:**
- Template Hub goal-oriented ("Cosa vuoi automatizzare?") — eccellente posizionamento commerciale
- Sistema crediti euro-based con billing reale per chiamata — industriale
- Webhook ElevenLabs completo: billing + stats + summary AI — funziona end-to-end
- Dashboard con Smart Actions e KPI persistenti
- Lead Score e Timeline unificata contatto

**Punti deboli principali:**
- Sicurezza edge functions (verify_jwt = false ovunque)
- Troppe sezioni sidebar per il primo utente (Cantieri, Documenti, Presenze, Render — sono noise per il 90% dei clienti al day 1)
- Nessun signup self-service (solo login manuale)
- Pagine CRM, Webhooks nelle integrazioni puntano a /app/settings — dead end
- Race condition nel topup crediti (read-then-update non atomico)

---

## 2. COSA È DAVVERO PRONTO

| Modulo | Stato | Vendibile? |
|---|---|---|
| **Login + Auth + RBAC** | Funzionante, multi-tenant con RLS | Sì |
| **Template Hub** (CreateAgent) | Eccellente — 15+ template con KPI, settore, risultato atteso | Sì, punto di forza commerciale |
| **Gestione Agenti** (lista + dettaglio) | Completo — score, tabs, voce, prompt, analytics, outbound | Sì |
| **Conversazioni** | Funzionante — filtri, summary, transcript, dettaglio | Sì |
| **Analytics** | Base ma funzionante — grafici tempo, esiti, per agente | Sì (sufficiente) |
| **Sistema Crediti** | Completo — billing per chiamata, topup, auto-recharge, blocco | Sì |
| **Dashboard** | Funzionante — KPI, Smart Actions, onboarding | Sì |
| **Contatti CRM** | Funzionante — tabella, filtri, lead score, timeline, kanban | Sì |
| **Campagne Outbound** | Strutturate ma non testate end-to-end | Parziale |
| **Integrazioni Hub** | Presente ma 2/5 card portano a dead-end | Da correggere |
| **Preventivi** | Funzionante — creazione, PDF, lista | Sì per edilizia |
| **Cantieri/Documenti/Presenze** | Funzionanti ma molto di nicchia | Solo per clienti edili avanzati |
| **Render AI** | Funzionante | Sì per serramentisti |
| **WhatsApp** | Strutturato ma richiede Meta Business setup complesso | Parziale |
| **SuperAdmin** | Completo — companies, pricing, templates, analytics, credits | Sì |

---

## 3. COSA NON È ANCORA PRONTO

**3.1 Sicurezza — CRITICO**
Tutte le 30+ edge functions hanno `verify_jwt = false` nel `config.toml`. Questo significa che chiunque con l'URL della funzione può chiamarla senza autenticazione. Alcune funzioni (es. `topup-credits`, `create-company`) autenticano internamente via Bearer token, ma altre (es. `generate-render`, `generate-report`, `save-report`, `add-knowledge-doc`) potrebbero non farlo. Questo è il rischio #1 prima di andare in produzione.

**3.2 Integrazioni CRM/Webhooks — Dead End**
Le card "CRM" e "Webhooks" nell'hub integrazioni puntano a `/app/settings` che non ha una sezione dedicata per configurare CRM sync o webhook endpoints. L'utente clicca e non trova nulla.

**3.3 Signup Self-Service**
Non esiste una pagina di registrazione. Ogni azienda deve essere creata manualmente dal SuperAdmin. Per scalare serve almeno un flusso base di signup → trial.

**3.4 Race Condition Crediti**
Il `topup-credits` fa due update separati (read `total_recharged_eur` + update). Sotto carico, due topup concorrenti possono sovrascriversi. Serve un'operazione atomica (RPC o singolo update con incremento).

**3.5 Campagne Outbound**
La pagina esiste ma il flusso reale di esecuzione (schedulazione chiamate, retry, gestione batch) non sembra completamente implementato lato backend.

---

## 4. COSA VA NASCOSTO O RIDOTTO

| Elemento | Azione | Motivo |
|---|---|---|
| **Sezione "OPERATIVITÀ"** (Cantieri, Documenti, Presenze) | Già collapsata — bene. Renderla visibile solo se l'azienda ha almeno 1 cantiere | Riduce noise per il 70% dei clienti |
| **"STRUMENTI AI" → Render** | Mostrare solo se il settore è serramenti/edilizia o se l'azienda ha crediti render | Irrilevante per chi non vende infissi |
| **Tab "Impostazioni" nell'agente** — dettagli LLM, TTS model, temperature, ASR quality, speculative turn | Spostare in collapsible "Avanzato" (già parzialmente fatto) | Troppo tecnico per l'imprenditore |
| **Dettaglio conversazione** — eval_score, minutes_billed, collected_data raw | Mostrare solo se popolati, non come "—" | I campi vuoti sembrano bug |
| **Card "Webhooks"** nelle integrazioni | Rimuovere o disabilitare finché non c'è una UI dedicata | Dead end oggi |
| **Card "CRM"** nelle integrazioni | Aggiungere badge "Prossimamente" o collegare a una vera pagina di setup | Dead end oggi |

---

## 5. TOP PRIORITÀ DI CORREZIONE

**P0 — Blockers pre-lancio:**

1. **Attivare `verify_jwt = true`** per tutte le edge functions che non sono webhook esterni (elevenlabs-webhook, whatsapp-webhook, telegram-cantiere-webhook possono restare false). Tutte le altre devono validare il JWT. Impatto: sicurezza critica.

2. **Rimuovere dead-end integrazioni** — CRM e Webhooks o li colleghi a una pagina reale o li nascondi con badge "Prossimamente".

3. **Rendere atomico l'aggiornamento crediti** nel topup — usare un singolo UPDATE con `balance_eur = balance_eur + $amount` via RPC o SQL diretto.

**P1 — Prima della vendita attiva:**

4. **Nascondere sezioni non rilevanti** per il cliente specifico (Cantieri/Render) in base al settore o all'uso effettivo.

5. **Aggiungere signup self-service** con trial automatico (anche minimo: email + password → company creata → redirect a /app).

6. **Testare end-to-end campagne outbound** — verificare che il flusso schedulazione → chiamata → retry funzioni davvero.

---

## 6. RISCHI PRINCIPALI

| Categoria | Rischio | Gravità |
|---|---|---|
| **Sicurezza** | Tutte le edge functions con verify_jwt=false. Qualcuno può chiamare `topup-credits` o `create-company` forzando i parametri | **CRITICO** |
| **Sicurezza** | `topup-credits` accetta `companyId` dal body — anche se verifica l'appartenenza, con JWT disabilitato nel config la prima riga di difesa manca | **ALTO** |
| **Costi** | Auto-recharge crediti scatta senza pagamento reale (no Stripe). L'azienda accumula saldo fittizio | **MEDIO** — accettabile se si gestisce manualmente |
| **UX** | Un nuovo utente vede 15+ voci sidebar dal primo login. Overload cognitivo | **MEDIO** |
| **Vendibilità** | Senza signup self-service, ogni cliente richiede intervento manuale del SuperAdmin | **MEDIO** |
| **Tecnico** | Race condition su `total_recharged_eur` in topup-credits. Sotto carico si perdono dati | **MEDIO** |

---

## 7. COSA SI PUÒ VENDERE SUBITO

**Pacchetto 1 — "Agente Vocale Qualifica Lead"** (P1 commerciale)
- Template: Richiama Lead Ads, Qualifica Serramenti, Qualifica Fotovoltaico, Qualifica Ristrutturazione
- Include: agente configurato + numero telefono + dashboard risultati + crediti
- Valore: "Non perdi più lead. L'agente risponde in 10 secondi, qualifica e fissa il sopralluogo."

**Pacchetto 2 — "Recupero Trattative"**
- Template: Recupera Preventivi Fermi, Recupera No-Show, Follow-up Sopralluogo
- Valore: "Recuperi il 25% dei preventivi che stavi perdendo."

**Pacchetto 3 — "Render Infissi AI"** (serramentisti)
- Render + template qualifica serramenti
- Valore: "Il cliente vede i nuovi infissi prima di comprare. Conversione +30%."

**Pacchetto 4 — "Cantiere Digitale"** (imprese edili strutturate)
- Cantieri + Report Telegram + Documenti scadenze + Presenze
- Valore: "Sai cosa succede in cantiere senza chiamare nessuno."

I pacchetti 1 e 2 sono vendibili oggi. Il 3 richiede settore specifico. Il 4 è per clienti avanzati.

---

## 8. RACCOMANDAZIONE FINALE

**Prima di andare forte sul mercato:**
1. Fixare la sicurezza JWT (1-2 ore di lavoro, impatto enorme)
2. Rimuovere/nascondere i dead-end (CRM, Webhooks)
3. Rendere atomico il topup crediti
4. Aggiungere signup self-service base

**Come semplificare:**
- La sidebar ha 6 sezioni. Per il primo mese di un nuovo cliente, bastano 3: Dashboard, Agenti, Contatti. Il resto può apparire progressivamente (progressive disclosure).
- Le sezioni Cantieri/Documenti/Presenze/Render dovrebbero essere visibili solo quando pertinenti.

**Come rafforzare il posizionamento:**
- Il Template Hub è il punto di forza. È già eccellente — goal-oriented, con KPI e risultati attesi. Usarlo come landing page del prodotto.
- Le Smart Actions nella dashboard sono il differenziante vero. Nessun CRM edile dice "Richiama Mario, il preventivo è fermo da 12 giorni." Questo è ciò che rende Edile Genius più di un chatbot tool.
- Il Lead Score + Timeline unificata completano il quadro: il commerciale sa chi chiamare e perché.

**Giudizio finale:**
La piattaforma ha una struttura solida e un posizionamento commerciale forte. Il core (agenti vocali + template hub + crediti + dashboard intelligente) è vendibile. Il rischio principale è la sicurezza delle edge functions — va fixata prima di qualsiasi demo con dati reali. Il secondo rischio è la complessità percepita: troppe sezioni visibili per un utente che deve solo "attivare un agente e vedere i risultati."

Con 3-4 fix mirati (JWT, dead-end, atomicità crediti, progressive disclosure sidebar), la piattaforma è pronta per i primi 10-20 clienti paganti.

