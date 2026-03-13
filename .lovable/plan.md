

# Miglioramenti pagina Impostazioni — Analisi e Piano

## Cosa manca / cosa migliorare

### Problemi strutturali
1. **Profilo utente duplicato** — Il form profilo utente (nome, avatar, password) è dentro il tab "Notifiche" (righe 501-508) invece di avere un tab dedicato o stare nel tab Profilo. Confonde l'utente.
2. **Tab Profilo disconnesso dal profilo utente** — `TabProfilo` gestisce solo i dati azienda, ma non c'è modo di modificare nome/avatar/password dal tab corretto.
3. **Nessuna conferma per azioni distruttive** — Eliminare webhook e rimuovere membri non chiede conferma.

### UX mancanti
4. **Nessun indicatore di sezione attiva nella sidebar desktop** — La sidebar non mostra una descrizione sotto il titolo della sezione selezionata nel content area.
5. **Header di sezione inconsistente** — Alcuni tab hanno header con titolo+descrizione, altri no. Manca un componente header uniforme.
6. **Tab Fatturazione troppo scarno** — Mostra solo saldo crediti e ultime ricariche. Mancano: piano corrente, data rinnovo, storico fatture, link al portale Stripe.
7. **Nessun feedback visivo sulle stat del tab Utenti** — Le 3 card stats mostrano dati identici (utenti totali = accesso attivo).

### Sicurezza / robustezza
8. **Nessun dialogo di conferma per rimozione membro** — `rimuoviMembro.mutate()` viene chiamato direttamente senza AlertDialog.
9. **Tab API non mostra API key aziendale** — Non c'è modo di vedere/generare la propria API key per integrazioni esterne.

## Piano di implementazione

### 1. Spostare profilo utente nel tab Profilo
**Edit**: `src/pages/app/Settings.tsx` e `src/components/impostazioni/TabProfilo.tsx`
- Aggiungere sezione "Il tuo profilo" (nome, avatar, email, password) sotto i dati azienda in TabProfilo
- Rimuovere il form profilo/password dal tab Notifiche

### 2. Aggiungere AlertDialog per azioni distruttive
**Edit**: `src/components/impostazioni/TabUtenti.tsx`
- Wrappare il bottone Trash2 in un AlertDialog con messaggio "Sei sicuro di voler rimuovere questo utente?"

**Edit**: `src/pages/app/Settings.tsx`
- Aggiungere conferma per eliminazione webhook

### 3. Fixare stats duplicata nel tab Utenti
**Edit**: `src/components/impostazioni/TabUtenti.tsx`
- Terza card: mostrare il numero di inviti pendenti (query su `azienda_inviti` con `stato = 'pending'`) invece di ripetere il totale utenti

### 4. Aggiungere header uniforme per ogni sezione
**Edit**: `src/pages/app/Settings.tsx`
- Creare un componente `SectionHeader` riutilizzabile con titolo + descrizione + icona
- Usarlo come header in tutte le sezioni (api, webhooks, notifiche, fatturazione)

### 5. Arricchire tab Fatturazione
**Edit**: `src/pages/app/Settings.tsx` (BillingTabContent)
- Aggiungere card piano corrente con nome piano e data rinnovo (da `companies.plan`)
- Aggiungere link "Gestisci abbonamento" verso portale Stripe
- Mostrare badge stato (attivo/trial/scaduto)

### 6. Aggiungere sezione inviti pendenti nel tab Utenti
**Edit**: `src/components/impostazioni/TabUtenti.tsx`
- Sotto la lista membri, mostrare inviti in sospeso con possibilità di revocarli
- Query su tabella `azienda_inviti` filtrata per `company_id` e `stato = 'pending'`

### Files
- **Edit**: `src/pages/app/Settings.tsx` — rimuovere profilo da notifiche, header uniforme, fatturazione arricchita, conferma eliminazione webhook
- **Edit**: `src/components/impostazioni/TabProfilo.tsx` — aggiungere sezione profilo utente personale con cambio password
- **Edit**: `src/components/impostazioni/TabUtenti.tsx` — AlertDialog rimozione, fix terza stat, sezione inviti pendenti

