

# Miglioramenti Impostazioni — Round 3

## Problemi identificati

1. **Console warning**: `InvitaUtenteModal` causa "Function components cannot be given refs" perché `DialogHeader` riceve un ref ma non usa `forwardRef`. Il fix è wrappare il contenuto del `DialogHeader` in un `div`.

2. **Tab Utenti vuoto**: La session replay mostra "Nessun utente trovato" con stats 0/0/0. Il problema è che `useAziendaSettings` richiede `companyId!` (non-null assertion) ma `TabUtenti` lo chiama con `companyId!` senza verificare che esista. Inoltre la query su `profiles` potrebbe non restituire risultati se l'utente non ha un `company_id` settato.

3. **Settings.tsx troppo grande (518 righe)**: Il tab API/CRM e Webhooks sono ancora inline nel componente principale con tutta la logica di stato. Vanno estratti in componenti dedicati.

4. **Tab Notifiche scarno**: Ha solo 3 switch, manca una sezione per le notifiche in-app o email specifiche per eventi.

5. **Sidebar desktop**: Mancano descrizioni sotto ogni voce per migliorare la navigabilità.

## Piano

### 1. Fix ref warning su InvitaUtenteModal e UserPermissionsModal
**Edit**: `src/components/impostazioni/InvitaUtenteModal.tsx`
- Wrappare il contenuto di `DialogHeader` per evitare il warning ref

### 2. Fix TabUtenti per gestire companyId null + mostrare utente corrente anche senza company
**Edit**: `src/components/impostazioni/TabUtenti.tsx`
- Guard `companyId` prima di chiamare `useAziendaSettings`
- Se `companyId` è null, mostrare messaggio "Nessuna azienda associata"
- Assicurarsi che l'utente corrente appaia sempre nella lista

### 3. Estrarre TabApi e TabWebhooks da Settings.tsx
**Create**: `src/components/impostazioni/TabApi.tsx` — CRM integrations + ElevenLabs test
**Create**: `src/components/impostazioni/TabWebhooks.tsx` — Webhook CRUD + logs
**Edit**: `src/pages/app/Settings.tsx` — Rimuovere 300+ righe di logica inline, importare i nuovi componenti

### 4. Aggiungere descrizioni nella sidebar desktop
**Edit**: `src/pages/app/Settings.tsx`
- Sotto ogni voce di navigazione nella sidebar, mostrare `tab.desc` in grigio per il tab attivo

### Files
- **Edit**: `src/components/impostazioni/InvitaUtenteModal.tsx`
- **Edit**: `src/components/impostazioni/TabUtenti.tsx`
- **Create**: `src/components/impostazioni/TabApi.tsx`
- **Create**: `src/components/impostazioni/TabWebhooks.tsx`
- **Edit**: `src/pages/app/Settings.tsx` (riduzione da ~518 a ~150 righe)

