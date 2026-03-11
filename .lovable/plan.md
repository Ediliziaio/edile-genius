

# AUDIT FINALE COMPLETO — Edile Genius (edilizia.io)

---

## 1. VALUTAZIONE GENERALE DELLA PIATTAFORMA

**Giudizio complessivo: 7/10 — Solido MVP con gap critici prima della vendita.**

| Dimensione | Voto | Note |
|---|---|---|
| Maturità prodotto | 7/10 | Architettura completa, molti moduli funzionanti, ma troppi moduli esposti |
| Vendibilità | 5/10 | Troppa complessità visibile; un imprenditore edile si perde |
| Robustezza tecnica | 6/10 | Flussi principali solidi, ma sicurezza edge functions critica |
| UX/Onboarding | 6/10 | Buon wizard template, ma sidebar troppo densa e troppe schermate |
| Sicurezza | 4/10 | **TUTTI** i 40+ edge functions hanno `verify_jwt = false` — bloccante** |
| Controllo costi | 8/10 | Billing euro-based ben fatto, margini tracciati, auto-recharge |

**Punti forti:**
- Galleria template orientata al risultato (best-in-class per il target)
- Sistema crediti/billing euro-based maturo con margini tracciati
- Dashboard SuperAdmin con economics reali (ricavi/costi/margini)
- Smart Actions engine che guida l'utente all'azione
- Lead scoring automatico senza LLM
- Summary + main_reason AI post-chiamata

**Punti deboli:**
- Sicurezza edge functions: tutto aperto, nessun `verify_jwt = true`
- Troppi moduli esposti nella sidebar (15+ voci visibili)
- WhatsApp.tsx = 1549 righe, non refactorato
- Moduli "Cantieri", "Documenti", "Presenze", "Render" esposti a tutti per default
- Nessun password reset / forgot password
- Nessuna conferma email obbligatoria al signup
- CRM e Webhooks marcati "prossimamente" ma presenti nella pagina Settings con form attivi

---

## 2. COSA È DAVVERO PRONTO

| Modulo | Stato | Vendibile? |
|---|---|---|
| **Agenti Vocali AI** (crea, configura, testa, attiva) | Completo | **SI** |
| **Galleria Template** (18 template, goal-oriented) | Completo | **SI** |
| **Dashboard azienda** (KPI + Smart Actions) | Completo | **SI** |
| **Conversazioni** (lista, filtri, trascrizione, summary, main_reason) | Completo | **SI** |
| **Contatti** (CRUD, import, lead score, timeline, follow-up AI) | Completo | **SI** |
| **Campagne Outbound** (batch calling E2E) | Completo | **SI** |
| **Crediti Euro** (ricarica, auto-recharge, blocco, usage tracking) | Completo | **SI** |
| **Preventivi** (audio→PDF, template branding) | Completo | **SI** |
| **Analytics** (grafici, range, breakdown per agente) | Completo | **SI** |
| **SuperAdmin Dashboard** (economics, margini, CSV export) | Completo | **SI** |
| **Signup self-service** (trial 14gg) | Completo | **SI** |
| **Login/Auth** (email+password, RBAC) | Funzionale | Parziale* |

*Manca forgot password e conferma email.

---

## 3. COSA NON È ANCORA PRONTO

| Area | Problema | Impatto |
|---|---|---|
| **Sicurezza Edge Functions** | Tutti `verify_jwt = false` — qualsiasi utente anonimo può chiamare `topup-credits`, `create-company`, `run-campaign-batch` | **BLOCCANTE** |
| **WhatsApp** | 1549 righe, integrazione Meta complessa, richiede WABA attivo | Non vendibile senza partner Meta |
| **CRM Sync** | UI presente in Settings ma marcato "prossimamente" in Integrazioni — incoerente | Confonde |
| **Render AI** | Dipende da Gemini Flash Image (sperimentale), crediti separati da quelli voce | Fragile |
| **Cantieri/Documenti/Presenze** | Moduli completi ma molto specifici, esposti a tutti | Dispersivo |
| **Forgot Password** | Non implementato | L'utente resta bloccato fuori |
| **Email confirmation** | Signup non richiede conferma email | Rischio spam/abuse |
| **Stripe** | Non collegato — ricariche solo "manuali" (nessun pagamento reale) | Non monetizzabile |

---

## 4. COSA VA NASCOSTO O RIDOTTO

**Azione immediata: semplificare la sidebar.**

Oggi l'utente vede potenzialmente 15+ voci di menu. Un imprenditore edile ha bisogno di 6 max.

**Sidebar consigliata per l'utente base:**
```text
PANNELLO DI CONTROLLO
  Dashboard

I MIEI AGENTI
  Agenti
  Risultati

VENDITE
  Contatti
  Campagne

IMPOSTAZIONI
  Crediti
  Account
```

**Da nascondere (mostrare solo se attivati o in sezione "Avanzato"):**
- Archivio Conoscenze → dentro Dettaglio Agente
- Preventivi → solo se settore edile/serramenti
- Cantieri / Documenti / Presenze → solo se settore edile (già parzialmente fatto, ma troppo visibile)
- Render → solo se serramenti (già parzialmente fatto)
- Integrazioni → dentro Account/Settings
- Liste contatti → dentro Contatti

**Da nascondere completamente per ora:**
- WhatsApp come modulo standalone (troppo complesso, non pronto)
- CRM sync (prossimamente reale)
- Template Preventivo (nicchia estrema)

---

## 5. TOP PRIORITÀ DI CORREZIONE

### P0 — BLOCCANTI (prima di qualsiasi vendita)

1. **Attivare `verify_jwt = true` su TUTTE le edge functions interne** (topup-credits, create-elevenlabs-agent, run-campaign-batch, generate-render, crm-sync, etc.). Lasciare `false` SOLO per webhook esterni (elevenlabs-webhook, whatsapp-webhook, telegram-cantiere-webhook, self-service-signup).
   - Impatto: senza questo, chiunque può creare agenti, ricariche, chiamate outbound senza autenticazione.

2. **Forgot password** — Aggiungere pagina `/forgot-password` con `supabase.auth.resetPasswordForEmail()`.
   - Impatto: utente bloccato = utente perso.

3. **Stripe / pagamento reale** — Senza pagamento reale, la ricarica manuale è solo un segnaposto.
   - Impatto: nessun ricavo effettivo.

### P1 — ALTA PRIORITÀ (prima settimana di vendita)

4. **Semplificare sidebar** — Implementare il progressive disclosure aggressivo descritto sopra.

5. **Refactor WhatsApp.tsx** — 1549 righe. Spezzare in componenti o nascondere il modulo finché non è davvero pronto con un partner WABA.

6. **Coerenza CRM** — Rimuovere la sezione CRM da Settings.tsx se è "prossimamente" in Integrazioni. Un posto solo.

7. **Email di benvenuto post-signup** — Anche una semplice email di conferma attivazione. Oggi l'utente si registra e basta.

### P2 — MEDIA PRIORITÀ

8. **Trial countdown** — Mostrare i giorni rimanenti del trial (14gg) nella dashboard e sidebar.

9. **Onboarding guidato** — Dopo signup, un wizard di 3 step (non la checklist attuale che appare solo senza agenti). Un vero flow che porta alla creazione del primo agente.

10. **Error boundary globale** — Se un componente crasha, l'app non deve diventare bianca.

---

## 6. RISCHI PRINCIPALI

### Sicurezza (CRITICO)
- **40+ edge functions con `verify_jwt = false`**: chiunque può chiamare `POST /functions/v1/topup-credits` con un body arbitrario e aggiungere crediti. Le funzioni fanno auth interna via `getClaims`, ma Supabase non applica nemmeno il check del token a livello gateway.
- **self-service-signup** accetta un `user_id` arbitrario nel body — un attaccante potrebbe associare il proprio account a una company di un altro.

### Costi
- Il sistema billing è solido, ma senza Stripe i crediti sono "monopoly money". Nessun ricavo reale.
- Auto-recharge è implementato nel webhook ma senza gateway di pagamento reale dietro.

### UX
- Un imprenditore che apre la sidebar vede: Dashboard, Agenti, Archivio Conoscenze, Risultati, Contatti, Campagne, Preventivi, Cantieri, Documenti, Presenze, Render, Integrazioni, Crediti, Account. **Troppo.** Sembra un gestionale aziendale, non un prodotto AI semplice.

### Vendibilità
- Il nome del prodotto è incoerente: "Edile Genius" nel plan, "edilizia.io" nel logo sidebar, "Edilizia.io" nella landing. Serve un nome unico.

---

## 7. COSA SI PUÒ VENDERE SUBITO

### Pacchetto 1: "Agente Vocale AI" (vendita principale)
- **Template**: Richiama Lead Ads, Qualifica Lead Serramenti/Fotovoltaico/Ristrutturazione
- **Include**: Agente vocale, numero telefono, dashboard risultati, contatti, crediti
- **Prezzo consigliato**: €149-299/mese + consumo voce
- **Stato**: PRONTO (con fix sicurezza)

### Pacchetto 2: "Campagne Outbound"
- **Template**: Recupera Preventivi, Conferma Appuntamenti, Recupera No-Show
- **Include**: Campagne batch, contatti, liste, analytics
- **Stato**: PRONTO

### Pacchetto 3: "Preventivi AI" (add-on edilizia)
- **Include**: Preventivi da audio, PDF branded, template personalizzabili
- **Stato**: PRONTO (nicchia)

### NON vendere ancora:
- WhatsApp (troppo complesso, dipende da WABA)
- Render AI (sperimentale, Gemini Flash Image instabile)
- Cantieri/Report (nicchia troppo stretta, richiede Telegram setup)

---

## 8. RACCOMANDAZIONE FINALE

### Prima di andare sul mercato (1-2 settimane):

1. **Fix sicurezza edge functions** — `verify_jwt = true` su tutte le funzioni interne. Questo è il singolo fix con il più alto rapporto impatto/rischio del progetto.

2. **Forgot password** — 30 minuti di lavoro, essenziale.

3. **Sidebar semplificata** — Nascondere tutto ciò che non è core. La piattaforma deve sembrare: Dashboard → Agenti → Contatti → Campagne → Crediti. Stop.

4. **Stripe** — Collegare Stripe per ricariche reali. Senza questo, non c'è business.

5. **Nome prodotto uniforme** — Decidere: "edilizia.io" o "Edile Genius". Un nome solo, ovunque.

### Per rafforzare il prodotto (mese 1):

6. **Trial countdown visibile** nella dashboard e sidebar.
7. **Email transazionali** (benvenuto, ricarica, agente attivato) via Resend.
8. **Report settimanale automatico** al titolare (KPI email).
9. **Refactor WhatsApp.tsx** o nascondere completamente il modulo.

### Principio guida:
**Meno è meglio.** Questo prodotto ha 30 feature quando ne servono 8 ben fatte. Nascondi tutto il resto, vendilo come "semplice", e attiva i moduli avanzati solo quando il cliente li chiede. La complessità è il nemico della vendita.

