

# Riprogettazione Libreria Template — Edile Genius

## 1. ANALISI DELLA LIBRERIA ATTUALE

### Due librerie separate che si sovrappongono
Esistono **due pagine template distinte** che creano confusione:
- `/app/agents/new` (CreateAgent.tsx) — hub con 15 template statici + DB, categorie per canale (Vocali, WhatsApp, Vendita Visiva)
- `/app/templates` (Templates.tsx) — seconda libreria con categorie operative (Reportistica, Qualifica Lead, Sicurezza, HR Operai)

Entrambe caricano da `agent_templates` in Supabase. L'utente non sa quale usare.

### Template deboli o sovrapposti
| Template | Problema |
|----------|----------|
| "Agente Vocale Personalizzato" | Troppo generico, da developer. Non ha caso d'uso. |
| "Qualificatore Lead Infissi" vs "Qualifica Serramentista" (EDILIZIA_PROMPT_TEMPLATES) | Duplicato: stesso use case, due prompt diversi |
| "Risponditore Campagne Ads" vs "Acquisizione Lead Cantiere" | Sovrapposti: entrambi qualificano lead in ingresso |
| "Follow-up Preventivi WhatsApp" | Sottile differenza con "Recupero Preventivi Scaduti" — l'utente non capisce quale scegliere |

### Categorie deboli
- **"Vocali"** e **"WhatsApp"** sono categorie per canale, non per risultato. Un imprenditore pensa "devo recuperare preventivi", non "voglio un agente vocale".
- **"Vendita Visiva"** contiene solo 1 template attivo. Non è una categoria, è un prodotto.
- Templates.tsx ha categorie operative (Sicurezza, HR Operai) che non esistono in CreateAgent.tsx.
- `EDILIZIA_PROMPT_TEMPLATES` (6 template) in PromptTemplates.ts sono usati solo nel wizard step avanzato, invisibili dalla libreria.

### Lacune evidenti
- Zero template post-vendita (solo "Recensioni")
- Zero template WhatsApp per primo contatto lead
- Zero template per follow-up dopo sopralluogo
- Zero template per supporto/FAQ
- Nessun template "interno" (riassunto chiamate, alert)
- Render ha un solo template attivo su un solo settore

### Problemi di naming e microcopy
- "Qualificatore" è gergo tecnico — un serramentista dice "richiamare chi chiede preventivi"
- "Inbound Campagne" — linguaggio da marketer, non da imprenditore edile
- Subtitle della libreria: "Ogni template include prompt, workflow di automazione n8n e integrazione canali" — troppo tecnico
- Badge "TOP SETTORE", "ALTO ROI" — buoni ma inconsistenti

---

## 2. NUOVA STRUTTURA DELLA LIBRERIA

### Decisione architetturale
**Eliminare `/app/templates` (Templates.tsx)** e consolidare tutto in **`/app/agents/new` (CreateAgent.tsx)** come unico punto di ingresso. Una sola libreria, una sola esperienza.

### Nuove categorie (per risultato, non per canale)

```text
CATEGORIE
├─ Tutti
├─ 📞 Lead e Appuntamenti        (acquisire e gestire nuovi contatti)
├─ 💰 Preventivi e Trattative    (chiudere più vendite)
├─ 💬 WhatsApp e Assistenza      (rispondere ai clienti H24)
├─ ⭐ Post-vendita               (fidelizzare e ottenere recensioni)
├─ 🎨 Vendita Visiva             (render e mockup per convincere)
└─ 🕐 Prossimamente
```

Filtro settore trasversale resta: Tutti | Serramenti | Fotovoltaico | Ristrutturazioni | Edilizia

---

## 3. TEMPLATE CONSIGLIATI — Catalogo finale

### 📞 LEAD E APPUNTAMENTI (P1)

**1. Richiama Lead da Campagne**
- Slug: `richiama-lead-ads`
- Obiettivo: Rispondere in <10 secondi ai lead da Meta/Google Ads
- Problema: I lead da campagne si perdono perché nessuno risponde in tempo
- Target: tutti i settori
- Canale: vocale
- Facilità: facile (8 min)
- KPI: "Risposta in <10 sec"
- Badge: 🔥 ALTO ROI
- _Unifica gli attuali "Risponditore Campagne Ads" + "Acquisizione Lead Cantiere"_

**2. Qualifica Lead Serramenti**
- Slug: `qualifica-serramenti`
- Obiettivo: Raccogliere tipo infisso, materiale, quantità e fissare sopralluogo
- Problema: Il commerciale perde tempo con lead non qualificati
- Target: serramenti
- Canale: vocale
- Facilità: facile (10 min)
- KPI: "Tasso qualifica ~35%"
- Badge: TOP SERRAMENTI

**3. Qualifica Lead Fotovoltaico**
- Slug: `qualifica-fotovoltaico`
- Obiettivo: Verificare tipo immobile, consumo, copertura e fissare sopralluogo tecnico
- Target: fotovoltaico
- Canale: vocale
- Facilità: facile (10 min)
- KPI: "Tasso qualifica ~40%"

**4. Qualifica Lead Ristrutturazione**
- Slug: `qualifica-ristrutturazione`
- Obiettivo: Filtrare per tipo intervento, metratura, budget
- Target: ristrutturazioni
- Canale: vocale
- Facilità: facile (10 min)
- KPI: "Tasso qualifica ~30%"
- Badge: POPOLARE

**5. Conferma Appuntamenti**
- Slug: `conferma-appuntamenti`
- Obiettivo: Chiamare il giorno prima per confermare, raccogliere info logistiche
- Problema: Il 30-40% dei sopralluoghi salta senza conferma
- Target: tutti
- Canale: vocale
- Facilità: facile (8 min)
- KPI: "No-show -40%"

**6. Recupera No-Show**
- Slug: `recupera-noshow`
- Obiettivo: Ricontattare chi ha saltato il sopralluogo e riprogrammare
- Target: tutti
- Canale: vocale
- Facilità: facile (8 min)
- KPI: "Recupero ~50%"

### 💰 PREVENTIVI E TRATTATIVE (P1)

**7. Recupera Preventivi Fermi**
- Slug: `recupera-preventivi`
- Obiettivo: Richiamare dopo 7-14 giorni, capire il motivo, rilanciare
- Problema: Il 60-70% dei preventivi non riceve mai un follow-up
- Target: tutti
- Canale: vocale
- Facilità: facile (10 min)
- KPI: "Recupero ~25%"
- Badge: ESSENZIALE

**8. Follow-up Dopo Sopralluogo**
- Slug: `followup-sopralluogo`
- Obiettivo: Chiamare 2-3 giorni dopo il sopralluogo per rispondere a dubbi e accelerare la decisione
- Problema: Il cliente resta in silenzio dopo il sopralluogo, il venditore non richiama
- Target: tutti
- Canale: vocale
- Facilità: facile (10 min)
- KPI: "Decisione +15% più veloce"
- _Nuovo template, non esiste oggi_

**9. Follow-up Preventivi WhatsApp**
- Slug: `followup-preventivi-wa`
- Obiettivo: Messaggio WhatsApp automatico ai preventivi in scadenza
- Problema: La telefonata è troppo invasiva, l'email non viene letta
- Target: tutti
- Canale: whatsapp
- Facilità: facile (10 min)
- KPI: "Tasso apertura ~85%"

### 💬 WHATSAPP E ASSISTENZA (P1)

**10. Assistente WhatsApp Commerciale**
- Slug: `assistente-whatsapp`
- Obiettivo: Rispondere H24 su WhatsApp, raccogliere richieste, fissare appuntamenti
- Problema: I messaggi WhatsApp restano senza risposta per ore
- Target: tutti
- Canale: whatsapp
- Facilità: medio (15 min)
- KPI: "Risposta <30 sec"
- Badge: ESSENZIALE

**11. Primo Contatto Lead WhatsApp**
- Slug: `primo-contatto-wa`
- Obiettivo: Messaggio automatico di benvenuto + qualifica rapida quando un lead scrive per la prima volta
- Problema: Il lead scrive su WhatsApp e non riceve risposta per ore
- Target: tutti
- Canale: whatsapp
- Facilità: facile (8 min)
- KPI: "Tempo risposta <1 min"
- _Nuovo template_

### ⭐ POST-VENDITA (P2)

**12. Raccolta Recensioni**
- Slug: `raccolta-recensioni`
- Obiettivo: Chiamare dopo i lavori, raccogliere voto, guidare alla recensione Google
- Problema: L'azienda non chiede mai recensioni, la reputazione online resta ferma
- Target: tutti
- Canale: vocale
- Facilità: facile (8 min)
- KPI: "+3 recensioni/mese"

**13. Verifica Soddisfazione Post-Lavoro**
- Slug: `verifica-soddisfazione`
- Obiettivo: Contattare il cliente 1 settimana dopo per verificare che tutto funzioni
- Problema: I problemi post-installazione emergono tardi e generano reclami
- Target: serramenti, fotovoltaico
- Canale: vocale
- Facilità: facile (8 min)
- KPI: "Reclami -30%"
- _Nuovo template_

### 🎨 VENDITA VISIVA (P2)

**14. Render Infissi AI**
- Slug: `render-infissi`
- Obiettivo: Foto facciata → render con nuovi infissi in 30 secondi
- Target: serramenti
- Canale: visuale
- Facilità: facile (5 min)
- KPI: "Conversione +30%"
- Badge: BEST SELLER

**15. Render Coperture AI** (disabled)
**16. Render Facciate AI** (disabled)

### 🕐 PROSSIMAMENTE

**17. Assistente Showroom** (disabled)

---

## 4. TEMPLATE DA ELIMINARE / UNIFICARE

| Template attuale | Azione | Motivo |
|---|---|---|
| "Agente Vocale Personalizzato" | **Eliminare** dalla libreria | Troppo generico, da developer. Chi vuole il controllo totale usa il wizard direttamente. Aggiungere un link "Crea da zero" discreto in fondo alla pagina. |
| "Risponditore Campagne Ads" | **Rinominare** → "Richiama Lead da Campagne" | Nome più business-oriented |
| EDILIZIA_PROMPT_TEMPLATES (6 template nel wizard) | **Mantenere** solo nel wizard step avanzato | Sono "quick-fill" per prompt, non template di libreria. Non duplicare. |
| Templates.tsx (pagina separata) | **Eliminare** la pagina | Consolidare in CreateAgent.tsx. La route `/app/templates` deve redirigere a `/app/agents/new`. |
| "Qualifica Serramentista" (EDILIZIA) | **Fondere** con "Qualifica Lead Infissi" | Stessa funzione, prompt diverso. Tenere il migliore. |
| Categorie "Reportistica", "Sicurezza", "HR Operai" | **Eliminare** come categorie | Sono template di Cantieri (modulo separato), non della libreria agenti AI |

---

## 5. MIGLIORAMENTI UX

### Header della libreria
- Titolo: "Cosa vuoi automatizzare?" (già buono, mantenere)
- Sottotitolo attuale: "Scegli un obiettivo e attiva il tuo agente in pochi minuti." → **OK**
- Rimuovere qualsiasi riferimento a "prompt", "n8n", "workflow" dal subtitle

### Card template — miglioramenti
1. **Aggiungere "Risultato atteso"** sotto la descrizione: una riga in grassetto tipo "→ Recupera il 25% dei preventivi persi" — è il motivo per cui l'imprenditore clicca
2. **Badge settore più prominenti**: "Ideale per Serramentisti" come pill colorata, non grigia
3. **Rimuovere "aziende" dal counter** se è 0 — mostrare solo se > 5 per social proof
4. **Aggiungere badge "Facile da attivare"** ai template con setup ≤ 10 min

### Filtri
- Categorie: da canale → a risultato (come sopra)
- Settore filter: mantenere, renderlo più visibile
- Aggiungere un ordinamento implicito: featured first, poi per installs_count desc

### Link "Crea da zero"
In fondo alla griglia, un link discreto: "Non trovi quello che cerchi? Crea un agente da zero →" che porta al wizard vuoto.

---

## 6. PRIORITÀ

**P1 — Subito**
- Consolidare in una sola libreria (eliminare Templates.tsx, redirect)
- Nuove categorie per risultato
- Rinominare template esistenti
- Aggiungere "Risultato atteso" sulle card
- Aggiungere "Follow-up Dopo Sopralluogo" (template mancante ad alto valore)
- Rimuovere "Agente Vocale Personalizzato" dalla griglia → link in fondo
- Migliorare microcopy header e badge

**P2 — Dopo**
- Aggiungere "Primo Contatto Lead WhatsApp"
- Aggiungere "Verifica Soddisfazione Post-Lavoro"
- Badge settore colorati
- Ordinamento intelligente (featured + installs)

**P3 — Successivo**
- Template interni (riassunto chiamate, alert) — embed nei flussi, non in libreria
- Render aggiuntivi (coperture, facciate)

---

## 7. IMPLEMENTAZIONE TECNICA

### File da modificare

**1. `src/pages/app/CreateAgent.tsx`** — File principale
- Sostituire `CATEGORIES` con le nuove categorie per risultato
- Aggiornare `STATIC_TEMPLATES`: rinominare, riassegnare categorie, aggiungere campo `result` (risultato atteso), aggiungere nuovi template, rimuovere "vocale-custom"
- Aggiornare `TemplateHubCard`: mostrare `result` come riga evidenziata, badge settore colorati, nascondere installs se < 5
- Aggiungere link "Crea da zero" in fondo alla griglia
- Aggiornare `mapDbCategory` per le nuove categorie

**2. `src/pages/app/Templates.tsx`** — Eliminare il contenuto, redirect
- Sostituire con un redirect a `/app/agents/new`

**3. `src/App.tsx`** — Route redirect
- Route `/app/templates` → redirect to `/app/agents/new`

**4. `src/components/layout/SidebarNav.tsx`** — Rimuovere voce "Template" se ancora presente, la navigazione ai template avviene dal bottone "Nuovo" nella lista agenti

