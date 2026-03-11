

# ANALISI APPROFONDITA DEI SERVIZI AI — Edile Genius

---

## FASE 1 — INVENTARIO COMPLETO DEI SERVIZI AI

| # | Servizio | Dove | Tecnologia | Visibile utente | Attivamente usato |
|---|---|---|---|---|---|
| 1 | **Agente Vocale AI** | Agent wizard + ElevenLabs | ElevenLabs ConvAI (LLM + TTS + ASR) | Si | Si — core |
| 2 | **Call Summary + Main Reason** | elevenlabs-webhook/summary.ts | OpenAI gpt-4o-mini | Si (dashboard, conversazioni, timeline) | Si — automatico post-call |
| 3 | **Lead Score** | lead-score.ts | Regole JS (no LLM) | Si (tabella contatti, scheda contatto) | Si — automatico |
| 4 | **Agent Quality Score** | agent-score.ts | Regole JS (no LLM) | Si (dettaglio agente) | Si — automatico |
| 5 | **Smart Actions Engine** | Dashboard.tsx | Regole JS su query DB | Si (dashboard) | Si — automatico |
| 6 | **Follow-up AI** | generate-followup | OpenAI gpt-4o-mini | Si (bottone in scheda contatto) | Si — on demand |
| 7 | **Preventivo da Audio** | process-preventivo-audio | OpenAI Whisper + GPT-4o | Si (wizard preventivo) | Si — on demand |
| 8 | **Report Cantiere da Voce** | telegram-cantiere-webhook + generate-report | OpenAI Whisper + gpt-4o-mini | Si (via Telegram) | Si — automatico |
| 9 | **Render AI (Sostituzione Infissi)** | generate-render | Gemini 2.5 Flash Image | Si (modulo Render) | Si — on demand |
| 10 | **Analisi Foto Finestra** | analyze-window-photo | Gemini 2.5 Flash (Vision) | Si (pre-compilazione wizard Render) | Si — automatico |
| 11 | **Voice Preview (TTS)** | elevenlabs-tts | ElevenLabs TTS | Si (selezione voce agente) | Si — on demand |
| 12 | **Campagne Outbound Batch** | run-campaign-batch + elevenlabs-outbound-call | ElevenLabs ConvAI + Twilio | Si (campagne) | Si — on demand |
| 13 | **CRM Sync** | crm-sync | Nessun LLM (API fetch HubSpot/Salesforce) | Parziale (UI "prossimamente") | No |
| 14 | **Alert Scadenze Documenti** | check-documenti-scadenze | Nessun LLM (regole date) | Dietro le quinte (email) | Si — schedulabile |
| 15 | **Alert Ritardi SAL** | check-sal-ritardi | Nessun LLM (regole milestone) | Dietro le quinte (Telegram/email) | Si — schedulabile |
| 16 | **Billing Automatico** | elevenlabs-webhook | Nessun LLM (logica pricing) | Dietro le quinte | Si — automatico |

---

## FASE 2 — ANALISI FUNZIONALE PROFONDA

### 1. Agente Vocale AI
- **Input**: System prompt, first message, voce, config LLM/TTS/ASR, knowledge base
- **Processo**: ElevenLabs gestisce conversation turn-by-turn con LLM + TTS + ASR in real-time
- **Output**: Conversazione vocale completa, transcript, collected data, eval score
- **Utilita**: MASSIMA — e il prodotto core
- **Automazione**: Elimina 100% del lavoro di risposta telefonica e qualificazione iniziale
- **Impatto**: Diretto su lead generation e customer service
- **Scalabilita**: Alta (multi-agente, multi-azienda)
- **Chiarezza**: Buona grazie ai template goal-oriented
- **Rischio**: Basso se il prompt e ben scritto; rischio risposte inappropriate con prompt deboli

### 2. Call Summary + Main Reason
- **Input**: Transcript completo della conversazione
- **Processo**: gpt-4o-mini genera JSON con summary (2-3 frasi) + main_reason (1 frase)
- **Output**: Riassunto leggibile + motivo principale di interesse/rifiuto
- **Utilita**: ALTA — evita la lettura di transcript lunghi
- **Automazione**: 100% automatico, zero intervento
- **Impatto**: Alto su decision-making commerciale
- **Scalabilita**: Ottima (costo ~$0.001/call)
- **Chiarezza**: Eccellente — visibile ovunque serve
- **Rischio**: Basso — fallisce silenziosamente se OPENAI_API_KEY manca

### 3. Lead Score
- **Input**: Status contatto, outcome conversazioni, sentiment, preventivi, call attempts, recency
- **Processo**: Regole a punteggio pesato (no LLM)
- **Output**: Score 0-100 con label (Caldo/Tiepido/Freddo) e fattori esplicativi
- **Utilita**: MEDIA-ALTA — utile per prioritizzazione
- **Automazione**: 100% automatica
- **Impatto**: Medio — aiuta a focalizzare ma non guida azioni specifiche
- **Scalabilita**: Infinita (pura logica client-side)
- **Chiarezza**: Buona (badge colorati + tooltip fattori)
- **Rischio**: MEDIO — le regole sono statiche e uguali per tutti; non si adattano al settore o al comportamento specifico dell'azienda

### 4. Agent Quality Score
- **Input**: Campi configurazione agente (prompt, voce, settore, sync EL, telefono)
- **Processo**: Checklist pesata con blockers
- **Output**: Score 0-100 + label + azioni suggerite
- **Utilita**: MEDIA — aiuta il setup ma non la performance
- **Automazione**: Automatica
- **Impatto**: Basso post-setup
- **Scalabilita**: Infinita
- **Chiarezza**: Buona
- **Rischio**: Nessuno

### 5. Smart Actions Engine
- **Input**: Crediti, agenti draft, contatti callback scaduti, preventivi stale, documenti in scadenza, campagne low-performing, lead dormienti
- **Processo**: 10+ regole con query DB dedicate
- **Output**: Lista azioni prioritizzate con link diretti
- **Utilita**: ALTA — e il "cervello operativo" della dashboard
- **Automazione**: 100% automatica
- **Impatto**: ALTO — guida le azioni quotidiane
- **Scalabilita**: Buona
- **Chiarezza**: Eccellente
- **Rischio**: Basso — ma le regole sono hardcoded e non personalizzabili

### 6. Follow-up AI
- **Input**: Nome contatto, summary ultima conversazione, outcome, note, giorni di inattivita
- **Processo**: gpt-4o-mini genera messaggio WhatsApp/email pronto
- **Output**: Testo follow-up copiabile
- **Utilita**: MEDIA — utile ma richiede azione manuale (copia-incolla)
- **Automazione**: Parziale — genera il testo ma non lo invia
- **Impatto**: Basso-Medio
- **Scalabilita**: Buona
- **Chiarezza**: Buona
- **Rischio**: Basso

### 7. Preventivo da Audio
- **Input**: Audio sopralluogo + dati cliente
- **Processo**: Whisper trascrive -> GPT-4o struttura in voci con prezzario DEI 2025 -> PDF branded
- **Output**: Preventivo completo con voci categorizzate, totali, IVA, PDF scaricabile
- **Utilita**: MOLTO ALTA — trasforma un sopralluogo vocale in un documento professionale
- **Automazione**: ~80% (l'utente deve solo registrare e validare)
- **Impatto**: ALTO — risparmia ore di lavoro per preventivo
- **Scalabilita**: Buona
- **Chiarezza**: Buona
- **Rischio**: MEDIO — i prezzi AI sono stime; l'utente DEVE verificare

### 8. Report Cantiere da Voce (Telegram)
- **Input**: Messaggi vocali e foto via Telegram
- **Processo**: Whisper trascrive -> gpt-4o-mini struttura (lavori, materiali, problemi, avanzamento) -> HTML report -> email
- **Output**: Report giornaliero strutturato inviato ai manager
- **Utilita**: ALTA per chi gestisce cantieri
- **Automazione**: 90% (l'operaio manda un vocale, il sistema fa tutto)
- **Impatto**: Alto nel settore edile operativo
- **Scalabilita**: Buona
- **Chiarezza**: Buona (UX Telegram naturale)
- **Rischio**: Medio — dipende dalla qualita del vocale e dal setup Telegram

### 9. Render AI (Sostituzione Infissi)
- **Input**: Foto edificio + configurazione nuovo infisso (materiale, colore, profilo, vetro, oscuranti)
- **Processo**: Prompt V2 a 12 blocchi (A-L) -> Gemini 2.5 Flash Image genera foto manipolata
- **Output**: Immagine fotorealistica con infissi sostituiti
- **Utilita**: ALTA per serramentisti — valore di vendita enorme
- **Automazione**: 90%
- **Impatto**: Alto su conversione preventivi serramenti
- **Scalabilita**: Media (costoso per immagine, Gemini sperimentale)
- **Chiarezza**: Buona (wizard guidato)
- **Rischio**: ALTO — qualita immagine variabile, Gemini Flash Image instabile

### 10. Analisi Foto Finestra (Vision)
- **Input**: URL immagine firmata
- **Processo**: Gemini 2.5 Flash analizza 17+ parametri tecnici
- **Output**: JSON strutturato (tipo apertura, materiale, condizioni, stile edificio, etc.)
- **Utilita**: ALTA — pre-compila il wizard, elimina input manuale
- **Automazione**: 100%
- **Impatto**: Medio (ausiliaria al Render)
- **Scalabilita**: Buona
- **Chiarezza**: Trasparente (i dati appaiono nel wizard)
- **Rischio**: Medio — analisi errata = prompt render sbagliato

### 11. Voice Preview (TTS)
- **Input**: Testo + voice_id + settings
- **Processo**: ElevenLabs TTS genera audio MP3
- **Output**: Audio preview della voce
- **Utilita**: MEDIA — utile in fase di setup
- **Automazione**: On demand
- **Impatto**: Basso
- **Scalabilita**: Buona
- **Chiarezza**: Buona
- **Rischio**: Nessuno

### 12. Campagne Outbound Batch
- **Input**: Lista contatti + agente + config campagna
- **Processo**: Batch di chiamate ElevenLabs/Twilio con retry automatico
- **Output**: Chiamate outbound con tracking outcome per contatto
- **Utilita**: MOLTO ALTA — automazione vendite su larga scala
- **Automazione**: 95%
- **Impatto**: MOLTO ALTO — scalabilita commerciale
- **Scalabilita**: Alta
- **Chiarezza**: Buona
- **Rischio**: Medio — costi possono esplodere senza limiti; rischio reputazionale se l'agente e debole

---

## FASE 3 — VALUTAZIONE POTENZA

| Servizio | Livello | Motivazione |
|---|---|---|
| Agente Vocale AI | **AI molto potente** | Prodotto core, valore diretto, automazione totale |
| Call Summary + Main Reason | **AI potente** | Zero effort, output sempre utile, costo trascurabile |
| Lead Score | **AI utile** | Regole statiche, non impara, non si adatta |
| Agent Quality Score | **AI debole** | Checklist, non vera AI |
| Smart Actions Engine | **AI potente** | Guida azioni reali, ma regole non personalizzabili |
| Follow-up AI | **AI utile** | Genera testo ma non agisce |
| Preventivo da Audio | **AI molto potente** | Trasformazione reale audio->documento |
| Report Cantiere | **AI potente** | Automazione reportistica completa |
| Render AI | **AI potente** | Valore commerciale altissimo ma instabile |
| Analisi Foto Finestra | **AI utile** | Ausiliaria, non standalone |
| Voice Preview (TTS) | **AI debole** | Semplice proxy API |
| Campagne Outbound | **AI molto potente** | Scalabilita vendite automatica |

---

## FASE 4 — POTENZIALE DI MIGLIORAMENTO

### 1. Lead Score -> Lead Score Predittivo
- Usare le conversazioni storiche dell'azienda per calcolare pattern di conversione reali
- Pesare i fattori in base al tasso storico di chiusura per settore/fonte/outcome
- Aggiungere "tempo medio alla conversione" come fattore

### 2. Smart Actions -> Smart Actions con AI reasoning
- Usare un LLM per sintetizzare le 10+ regole in 3 azioni prioritarie naturali ("Oggi concentrati su...")
- Aggiungere suggerimento di azione specifica ("Richiama Mario Rossi e proponi lo sconto del 10%")
- Personalizzare soglie per azienda

### 3. Follow-up AI -> Follow-up Automatico
- Dopo X giorni senza risposta, inviare automaticamente il follow-up via WhatsApp/email
- L'utente approva una volta, il sistema esegue
- Trasformazione da "suggerimento" a "agente autonomo"

### 4. Call Summary -> Post-Call Actions AI
- Dopo il summary, generare automaticamente: update status contatto, creare task, suggerire next step
- Popolare automaticamente collected_data strutturato per il CRM
- Classificare automaticamente l'outcome (oggi dipende da ElevenLabs eval)

### 5. Render AI -> Render Multi-Variante
- Generare 3 varianti (materiali diversi) in un'unica sessione
- Aggiungere confronto costi automatico tra le opzioni
- Creare PDF comparativo per il cliente

### 6. Preventivo Audio -> Preventivo Intelligente
- Comparare i prezzi generati con lo storico dell'azienda (preventivi passati)
- Suggerire sconto ottimale basato sul tasso storico di accettazione
- Auto-detect se mancano voci comuni per quel tipo di lavoro

---

## FASE 5 — POTENZIALE TRASFORMAZIONE IN AGENTI AUTONOMI

| Servizio | Puo diventare agente? | Come |
|---|---|---|
| **Follow-up AI** | **SI - priorita alta** | Osserva contatti dormienti -> genera messaggio -> invia automaticamente -> monitora risposta -> scala a umano se serve |
| **Smart Actions** | **SI** | Osserva KPI giornalieri -> decide le 3 azioni piu urgenti -> notifica il titolare -> esegue quelle automatizzabili |
| **Lead Score** | **Parzialmente** | Potrebbe auto-assegnare priorita e trigger di richiamata senza intervento umano |
| **Preventivo Audio** | **No** | Richiede validazione umana (responsabilita legale/economica) |
| **Report Cantiere** | **Parzialmente** | Potrebbe auto-generare alert se rileva problemi ricorrenti o ritardi pattern |
| **Campagne Outbound** | **SI** | Potrebbe auto-lanciare batch quando rileva lead qualificati non contattati, o auto-fermarsi se il conversion rate scende |

---

## FASE 6 — VALORE COMMERCIALE

| Servizio | Vendibile come pacchetto? | Nome commerciale | Forza |
|---|---|---|---|
| Agente Vocale + Summary + Outbound | **SI — pacchetto principale** | "Segretaria AI H24" | ★★★★★ |
| Campagne Outbound + Lead Score | **SI** | "Recupero Clienti AI" | ★★★★ |
| Preventivo Audio | **SI — add-on** | "Preventivo Express" | ★★★★ |
| Report Cantiere | **SI — nicchia** | "Cantiere Smart" | ★★★ |
| Render AI | **SI — nicchia serramenti** | "Render Infissi AI" | ★★★ |
| Follow-up AI (se automatico) | **SI** | "Follow-up Automatico" | ★★★★ |
| Smart Actions | Non vendibile standalone | Parte del valore dashboard | ★★★ |

---

## FASE 7 — CLASSIFICA FINALE

### AI CORE (indispensabili)
1. **Agente Vocale AI** — il prodotto
2. **Call Summary + Main Reason** — il valore invisibile che rende il prodotto intelligente
3. **Campagne Outbound Batch** — scalabilita vendite
4. **Smart Actions Engine** — il "consulente virtuale" della dashboard

### AI UTILI (rafforzano il prodotto)
5. **Preventivo da Audio** — forte per edilizia
6. **Lead Score** — utile ma migliorabile
7. **Follow-up AI** — utile ma incompleto (non agisce)
8. **Report Cantiere** — forte per nicchia
9. **Analisi Foto Finestra** — ausiliaria ma ben fatta

### AI DEBOLI (migliorabili o trascurabili)
10. **Agent Quality Score** — checklist, non vera AI
11. **Voice Preview** — proxy API, non differenziante
12. **Render AI** — concetto forte ma Gemini Image troppo instabile per produzione

---

## FASE 8 — TOP 5 OPPORTUNITA DI POTENZIAMENTO

### 1. Follow-up Automatico (da suggerimento a agente)
**Cosa**: Trasformare il follow-up AI da "genera testo che l'utente copia" a "invia automaticamente dopo approvazione"
**Impatto**: Altissimo — i lead dormienti sono la risorsa piu sprecata. Un follow-up automatico via WhatsApp dopo 3-5 giorni di silenzio puo recuperare il 15-25% dei lead persi
**Implementazione**: Cron job che controlla contatti dormienti -> genera messaggio -> invia via WhatsApp API -> traccia risposta

### 2. Post-Call Actions Automatiche
**Cosa**: Dopo ogni chiamata, l'AI non solo genera il summary ma aggiorna automaticamente lo status del contatto, crea task per il commerciale, e suggerisce il next step
**Impatto**: Elimina il lavoro manuale post-call (oggi l'utente deve leggere il summary e agire). Ogni chiamata diventa un evento che attiva azioni
**Implementazione**: Estendere `elevenlabs-webhook` per analizzare outcome e scrivere su contacts/tasks

### 3. Dashboard AI Personalizzata ("Briefing Mattutino")
**Cosa**: Ogni mattina, un LLM analizza i dati dell'azienda e genera un briefing naturale di 5 righe: "Oggi hai 3 lead caldi da richiamare, il preventivo Rossi e senza risposta da 8 giorni, e la campagna Facebook sta andando bene"
**Impatto**: Trasforma la dashboard da "pannello con numeri" a "consulente che parla". L'utente capisce immediatamente cosa fare
**Implementazione**: Edge function schedulata + LLM che riceve dati aggregati

### 4. Lead Score Dinamico basato su Storico Aziendale
**Cosa**: Invece di regole fisse uguali per tutti, analizzare lo storico conversioni dell'azienda per pesare i fattori. Se un'azienda converte piu lead da referral, il peso referral aumenta
**Impatto**: Score piu accurato = prioritizzazione migliore = piu vendite
**Implementazione**: Batch job mensile che calcola pesi ottimali per azienda

### 5. Campagne Auto-Pilota
**Cosa**: Le campagne outbound si auto-regolano: se il conversion rate scende sotto una soglia, pausano e notificano. Se ci sono lead qualificati non contattati da 48h, suggeriscono di lanciare un batch
**Impatto**: L'utente non deve monitorare manualmente le campagne
**Implementazione**: Estendere Smart Actions + cron su campaign_contacts

---

## FASE 9 — CONCLUSIONI STRATEGICHE

### Valutazione generale potenza AI: 7.5/10

La piattaforma ha **4 servizi AI genuinamente potenti** (Agente Vocale, Summary, Outbound, Preventivo Audio) che giustificano il posizionamento come "AI platform". Il resto e supporto solido.

### Davvero forti
- Agente Vocale + Summary + Main Reason: pipeline completa e di valore reale
- Campagne Outbound: automazione vendite con tracking granulare
- Preventivo da Audio: trasformazione concreta e impressionante

### Parzialmente sfruttati
- **Follow-up AI**: genera ma non agisce — il salto a "agente autonomo" e la singola evoluzione piu impattante
- **Smart Actions**: regole potenti ma statiche e non personalizzabili
- **Lead Score**: utile ma non si adatta all'azienda

### Possibili killer feature
- **Follow-up Automatico via WhatsApp** — se funziona, e il motivo per cui un imprenditore paga
- **Briefing AI Mattutino** — differenziante fortissimo, nessun competitor lo fa
- **Post-Call Actions** — trasforma ogni chiamata in un workflow automatico

### Rischio inutilita
- **Agent Quality Score**: puo essere sostituito da un semplice indicatore di completezza
- **Render AI**: il concetto e perfetto, ma la tecnologia (Gemini Image) non e abbastanza affidabile per vendere come servizio premium. Da tenere in beta/labs
- **CRM Sync**: presente nel codice ma non attivo — o si completa o si rimuove

### Come diventare una vera AI platform
La piattaforma oggi e un **"software con funzioni AI"**. Per diventare una **"AI platform"**:
1. L'AI deve **agire**, non solo suggerire (follow-up automatico, post-call actions)
2. L'AI deve **imparare** dall'azienda (lead score dinamico, soglie personalizzate)
3. L'AI deve **comunicare** in modo naturale (briefing mattutino in linguaggio umano)
4. L'AI deve essere **invisibile** dove non serve (nascondere Agent Score, Voice Preview e dettagli tecnici)

Il salto da 7.5 a 9/10 sta in queste 4 trasformazioni. Nessuna richiede mesi: la 1 e la 3 si implementano in 1-2 settimane ciascuna.

