

# Strategia AI Avanzata — Edile Genius

## 1. ANALISI DELLO STATO ATTUALE

### Cosa c'è già
| Area | Stato | Dati disponibili |
|---|---|---|
| Agenti AI vocali/WhatsApp | Funzionante | Configurazione, prompt, voce, modello LLM |
| Conversazioni | Registrate | Transcript, outcome, sentiment, eval_score, eval_notes, collected_data, duration |
| Contatti/CRM | Operativo | Status, priority, source, call_attempts, next_call_at, assigned_agent |
| Campagne outbound | Strutturate | contacts_reached, appointments_set, contacts_qualified |
| Preventivi | Funzionante | Stato (bozza/inviato/accettato/rifiutato), importi, date |
| Cantieri + Report | Funzionante | Report giornalieri, avanzamento %, problemi, materiali |
| Knowledge Base | Funzionante | Documenti, URL, testo indicizzato |
| Credits/Billing | Funzionante | Balance, usage per call, cost breakdown |
| Analytics | Base | Grafici chiamate/tempo, outcome breakdown |

### Cosa manca — dove c'è opportunità reale
1. **Zero intelligenza sui dati**: i dati ci sono (conversazioni, outcome, contatti) ma nessuno li interpreta. Il titolare deve leggere tabelle e capire da solo.
2. **Nessun lead scoring**: i contatti hanno `priority` manuale ma nessun calcolo automatico basato su interazioni.
3. **Nessun suggerimento d'azione**: la dashboard mostra KPI ma non dice "cosa fare adesso".
4. **Nessun riassunto conversazione**: il transcript c'è ma manca un summary leggibile (il campo `summary` è quasi sempre null — viene dal webhook ElevenLabs solo se configurato).
5. **Preventivi senza follow-up intelligente**: un preventivo in "bozza" da 15 giorni non genera nessun alert.
6. **Contatti senza timeline unificata**: la scheda contatto non mostra conversazioni passate + preventivi + note in un flusso unico.
7. **Nessun follow-up generator**: il commerciale non riceve suggerimenti su cosa scrivere/dire.

### Aree a rischio di over-engineering
- Knowledge Assistant interno (basso volume, alto costo LLM)
- Agenti interni AI (troppo presto, confonde il prodotto)
- Analisi qualitativa profonda delle interazioni (il campo eval_score/eval_notes già copre il caso base)

---

## 2. CAPACITÀ AI CONSIGLIATE — Decisione netta

| # | Capacità | Deve esistere? | Valore reale | Complessità UX | Priorità |
|---|---|---|---|---|---|
| 1 | **AI Sales Brain (Smart Actions)** | **Sì** | Dice al titolare cosa fare ORA | Bassa — è una lista di azioni | **P1** |
| 2 | **Lead Scoring** | **Sì, semi-AI** | Prioritizza senza che il commerciale legga tutto | Bassa — un badge colorato | **P1** |
| 3 | **Next Best Action** | **Sì, ma integrato nel Sales Brain** | Non è un modulo separato, è l'output del Sales Brain | Zero — è già dentro le Smart Actions | **P1** |
| 4 | **Call Summary** | **Sì** | Il titolare non legge i transcript | Bassa — un paragrafo sotto la conversazione | **P1** |
| 5 | **Follow-up Generator** | **Sì** | Riduce i tempi del commerciale del 70% | Media — serve un bottone "Genera messaggio" | **P2** |
| 6 | **Agenti Interni AI** | **No, non ora** | Confonde il prodotto, basso ROI | Alta | **P3** |
| 7 | **Alert Intelligenti** | **Sì, ma come evoluzione delle Smart Actions** | Preventivi fermi, no-show, agenti inattivi | Bassa — notifiche nella dashboard | **P1** |
| 8 | **Knowledge Assistant Interno** | **No** | Volume troppo basso per giustificare il costo | Alta | **Evitare** |
| 9 | **Analisi Qualitativa Interazioni** | **Parziale** | eval_score + sentiment già esistono. Aggiungere solo "motivo principale" | Bassa — un campo in più | **P2** |
| 10 | **Supporto Decisionale** | **Sì, ma è il Sales Brain** | Non è un modulo separato | — | **P1** |

---

## 3. FUNZIONI P1 — Le 4 da costruire subito

### P1-A: Smart Actions Engine (evoluzione del "Da fare adesso")
La dashboard ha già `smartActions` con 3 casi hardcoded (bozze, telefoni mancanti, crediti bassi). Deve diventare un motore con 10+ regole basate sui dati reali.

**Regole concrete da aggiungere:**
- Preventivo in stato "bozza" da >7 giorni → "Invia o archivia il preventivo per {cliente}"
- Preventivo "inviato" da >10 giorni senza risposta → "Fai follow-up sul preventivo #{numero}"
- Contatto con status "callback" e `next_call_at` scaduto → "Richiama {nome} — era da richiamare"
- Contatto "qualified" senza appuntamento da >5 giorni → "Proponi appuntamento a {nome}"
- Agente attivo con 0 chiamate negli ultimi 7 giorni → "Verifica l'agente {nome} — nessuna attività"
- Campagna attiva con tasso appuntamenti <5% → "Rivedi il prompt della campagna {nome}"
- Documento in scadenza entro 15 giorni → "Rinnova {documento} — scade il {data}"

**Implementazione**: query Supabase lato client, logica JavaScript pura. Nessun LLM necessario. Costo: zero.

### P1-B: Lead Score Automatico
Un punteggio 0-100 calcolato da dati esistenti, senza LLM.

**Formula basata su segnali reali:**
```text
+30  ha avuto almeno 1 conversazione con outcome "qualified" o "appointment"
+20  ha avuto conversazione con sentiment "positive"
+15  ha un preventivo associato (anche indiretto via company_name match)
+10  ha telefono + email (contatto completo)
+10  è stato richiamato (callback count > 0)
+5   fonte = "web_form" o "referral" (lead inbound)
-10  ultima interazione > 30 giorni fa
-20  outcome più recente = "not_interested"
-30  status = "do_not_call" o "invalid"
```

**Visibilità**: badge colorato nella lista contatti e nella scheda contatto. Caldo (>60), Tiepido (30-60), Freddo (<30).

**Implementazione**: funzione TypeScript pura calcolata al render. I dati servono un join `contacts` + ultime `conversations` per quel contatto. Nessun LLM.

### P1-C: Call Summary Automatico
Generare un riassunto di 2-3 frasi per ogni conversazione completata.

**Implementazione**: nel webhook `elevenlabs-webhook/index.ts` (linee 72-208), dopo aver salvato il transcript, chiamare OpenAI con un prompt minimale:

```text
Riassumi questa conversazione telefonica in 2-3 frasi in italiano.
Indica: argomento principale, esito, e prossimo passo se menzionato.
```

Salvare nel campo `conversations.summary` che già esiste ma è quasi sempre null.

**Costo**: ~$0.001 per chiamata con gpt-4o-mini. Trascurabile.

**Visibilità**: mostrato nella tabella conversazioni, nella scheda contatto, e nella dashboard "attività recente".

### P1-D: Timeline Unificata del Contatto
La scheda contatto (`ContactDetailPanel.tsx`) mostra già conversazioni e note in tab separate. Unificarle in una timeline cronologica che include:
- Conversazioni (con summary)
- Note manuali
- Preventivi collegati
- Cambi di stato

**Implementazione**: query multi-tabella nel pannello contatto, ordinamento per data, rendering come timeline verticale.

---

## 4. MODULI AI CORRETTI

Non creo 9 moduli separati. La struttura corretta è:

| Modulo | Tipo | Scopo | Dove compare | P |
|---|---|---|---|---|
| **Smart Actions** | Capability trasversale | Suggerisce cosa fare basandosi su regole dati | Dashboard (zona C), scheda contatto, scheda preventivo | P1 |
| **Lead Score** | Capability trasversale | Badge di priorità calcolato | Lista contatti, scheda contatto, dashboard | P1 |
| **Summary Engine** | Backend (webhook) | Genera riassunti conversazioni | Conversazioni, scheda contatto, dashboard | P1 |
| **Follow-up Intelligence** | Feature UI | Genera bozza messaggio follow-up | Scheda contatto, scheda preventivo | P2 |
| **Opportunity Recovery** | Estensione Smart Actions | Alert su preventivi fermi, lead freddi, no-show | Dashboard, notifiche | P2 |

**NON devono esistere come moduli:**
- "AI Sales Brain" → è il nome marketing delle Smart Actions
- "Internal AI Assistant" → confonde, non serve ora
- "Knowledge Assistant" → il knowledge base serve gli agenti, non gli umani
- "AI Insights" → troppo vago, diventa decorativo

---

## 5. DOVE MOSTRARE L'AI NEL PRODOTTO

| Punto UX | Cosa mostrare | Visibilità |
|---|---|---|
| **Dashboard — Zona C** | Smart Actions espanse (7-10 azioni concrete con priorità) | **Centrale** — è la prima cosa che il titolare vede |
| **Lista Contatti — colonna** | Lead Score badge (🔴🟠⚪🔵) | **Centrale** — nella tabella come colonna |
| **Scheda Contatto — header** | Lead Score + "Azione consigliata" inline | **Centrale** |
| **Scheda Contatto — tab Timeline** | Cronologia unificata con summary | **Centrale** |
| **Tabella Conversazioni — colonna Summary** | Riassunto 1 riga al posto del transcript raw | **Centrale** |
| **Scheda Preventivo** | Alert "fermo da X giorni" + bottone "Genera follow-up" | **Discreta** — sotto i dettagli |
| **Scheda Agente — tab Panoramica** | "Nessuna attività da 7 giorni" se applicabile | **Discreta** |
| **Dove NON deve apparire** | Nella configurazione agente, nel setup template, nelle impostazioni | Non mettere AI dove l'utente configura |

---

## 6. OUTPUT AI UTILI — Esempi concreti

```text
DASHBOARD:
• "Richiama Mario Rossi — era da richiamare ieri alle 15:00"
• "Preventivo #042 fermo da 12 giorni — invia un follow-up"  
• "L'agente 'Qualifica Infissi' non riceve chiamate da 8 giorni"
• "3 documenti in scadenza questa settimana"

SCHEDA CONTATTO:
• Lead Score: 75/100 🔴 Caldo
• "Ultima chiamata positiva — proponi appuntamento"
• "Ha chiesto preventivo per infissi il 15/03"

CONVERSAZIONE:
• Summary: "Il cliente ha chiesto informazioni su infissi in PVC per 
  un appartamento di 80mq. Interessato ma vuole confrontare i prezzi. 
  Da richiamare tra 3 giorni."

PREVENTIVO:
• "Inviato 10 giorni fa, nessuna risposta. Suggerimento: invia 
  messaggio WhatsApp di follow-up."
```

---

## 7. COSA EVITARE

| Errore | Perché è sbagliato | Come evitarlo |
|---|---|---|
| Score AI con formula opaca | L'utente non capisce perché un lead è "caldo" | Usare regole esplicite, mostrare i fattori |
| Insight lunghi generati da LLM | Nessuno li legge | Max 2-3 frasi, sempre azionabili |
| Modulo "AI Insights" separato | Diventa una pagina morta che nessuno visita | Distribuire gli insight nei punti di lavoro |
| Follow-up automatico senza conferma | Il commerciale perde il controllo | Sempre "suggerito", mai inviato automaticamente |
| AI nella configurazione agente | Confonde setup con operatività | AI solo nei flussi operativi |
| Dashboard AI separata | Duplica la dashboard principale | Tutto nella dashboard esistente |

---

## 8. STRUTTURA PER RUOLI

**Titolare/Imprenditore**: Dashboard con Smart Actions ("cosa devo fare oggi"), KPI, lead caldi in evidenza. Vuole controllo in 30 secondi.

**Commerciale**: Lista contatti ordinata per Lead Score, summary delle ultime chiamate, azione consigliata per ogni contatto, follow-up suggeriti. Vuole sapere chi chiamare prima.

**Operations/Back Office**: Alert documenti in scadenza, preventivi da inviare, cantieri senza report. Vuole non dimenticare nulla.

**Admin/Power User**: Tutto quanto sopra + possibilità di personalizzare le regole delle Smart Actions (P3, non ora).

---

## 9. ROADMAP DI PRIORITÀ

### P1 — Costruire subito (impatto immediato, dati già disponibili)
1. **Smart Actions Engine** — espandere le 3 regole attuali a 10+
2. **Lead Score** — formula JS client-side, badge nella lista contatti
3. **Call Summary** — aggiungere al webhook ElevenLabs, mostrare ovunque
4. **Timeline Contatto** — unificare conversazioni + note + preventivi

### P2 — Importante dopo (richiede P1 come base)
5. **Follow-up Generator** — bottone "Genera messaggio" con LLM nella scheda contatto/preventivo
6. **Opportunity Recovery alerts** — preventivi fermi, lead dormenti
7. **Motivo principale** — estrarre dal transcript il motivo di interesse/rifiuto (1 campo aggiuntivo)

### P3 — Avanzato / successivo
8. **Personalizzazione regole Smart Actions** per admin
9. **Report settimanale automatico** via email al titolare
10. **Trend predittivo** su tasso conversione (richiede storico >3 mesi)

---

## 10. RACCOMANDAZIONE FINALE

**Come deve essere percepita l'AI**: "La piattaforma mi dice cosa fare. Non devo pensarci io."

**Come renderla un vantaggio competitivo**: nessun competitor nel settore edile offre Smart Actions basate sui dati reali dell'azienda. Un CRM mostra tabelle. Un chatbot risponde. Edile Genius dice: "Richiama Mario, il preventivo è fermo da 12 giorni, il lead è caldo." Questo è il differenziante.

**Come evitare che diventi confusa o decorativa**: 
- Mai un modulo AI separato. L'AI è distribuita nei punti di lavoro.
- Mai output lunghi. Max 2 frasi.
- Mai azioni automatiche senza conferma.
- Mai score senza spiegazione.
- Mai feature AI che non genera soldi, risparmia tempo, o aumenta controllo.

### Implementazione tecnica in sintesi

Le 4 funzioni P1 richiedono:
1. **Smart Actions**: solo logica JS nel Dashboard.tsx — query aggiuntive a preventivi, documenti, contatti callback
2. **Lead Score**: funzione TypeScript pura + join conversations nella lista contatti
3. **Call Summary**: 10 righe aggiuntive nel webhook `elevenlabs-webhook/index.ts` + mostrare `summary` dove già c'è il campo
4. **Timeline Contatto**: refactor di `ContactDetailPanel.tsx` con query multi-tabella

Nessun nuovo modulo backend. Nessuna nuova tabella. Nessun nuovo edge function (tranne le 10 righe nel webhook esistente). Tutto costruibile con i dati e le strutture già presenti.

