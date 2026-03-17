

# Audit Codice Edil Genius — Piano di Intervento

## Analisi Eseguita

Ho analizzato il documento di audit a 7 fasi e verificato il codebase reale. Ecco i risultati e le azioni concrete da implementare, raggruppate per priorità.

---

## Risultati Security Scan

La scansione di sicurezza ha trovato **3 warning**:
1. **Extension pgvector in public schema** — bassa priorità, comune con pgvector
2. **Leaked Password Protection disabilitata** — da abilitare in Supabase Auth settings
3. **`monthly_billing_summary` senza RLS** — vista con dati finanziari cross-company esposta

---

## CRITICO (Fix immediati)

### C1. `monthly_billing_summary` senza RLS
Vista con dati finanziari di tutte le aziende leggibile da chiunque sia autenticato. Serve policy che limiti l'accesso ai superadmin.

### C2. `PDFPreviewPanel` — URL.createObjectURL senza cleanup
Linea 32: `URL.createObjectURL(blob)` assegnato a `iframeUrl` ma mai rilasciato con `revokeObjectURL`. Memory leak a ogni preview.

### C3. Pagina `/accetta-invito` mancante
Il sistema inviti (`azienda_inviti` + edge function `invita-membro`) genera link con token, ma **non esiste la pagina** per accettare l'invito. Il link nell'email porta a un 404.

---

## IMPORTANTE (Fix necessari)

### I1. `StepSuperfici` — URL.createObjectURL senza cleanup su unmount
Le preview delle foto caricate non vengono rilasciate quando il componente viene smontato. Solo `removePhoto` fa cleanup.

### I2. `RenderPersianeNew` — setInterval senza cleanup nel blocco catch
Linea 248: `setInterval` per messaggi di stato. Se il rendering fallisce con un'eccezione non gestita prima di `clearInterval`, l'intervallo continua a girare.

### I3. `as any` pervasivo (73 file, 1151 occorrenze)
Molti `as any` sono dovuti a tabelle non presenti in `types.ts` (es. `render_bagno_sessions`, `azienda_features_sbloccate`, `render_stanza_stili_pronti`). Non sono bug di sicurezza ma impediscono il type-checking. Non risolvibili senza rigenerare i tipi Supabase — documentare per ora.

### I4. Nessuna validazione input strutturata nelle Edge Functions
Le edge functions accettano body JSON senza validazione schema (no Zod). Input malformati possono causare errori 500 non informativi.

---

## MINORE (Miglioramenti)

### M1. `useGeneraPDF` — setTimeout senza cleanup (linea 42)
`setTimeout(() => { setGenerando(false); }, 500)` senza `clearTimeout` nel cleanup. Basso impatto ma pattern scorretto.

### M2. Diversi `URL.createObjectURL` per download immediato
Pattern `createObjectURL → click → revokeObjectURL` è corretto in tutti i file di download (Contacts, Analytics, FoglioPresenze). Nessun leak qui.

### M3. Realtime subscriptions — tutte con cleanup
Tutti i `supabase.channel()` trovati hanno `removeChannel` nel return del useEffect. Nessun leak.

---

## Piano di Implementazione

### Fase 1 — Fix critici (3 task)

1. **RLS su `monthly_billing_summary`**: Migration SQL per aggiungere policy superadmin-only sulla vista.

2. **Memory leak PDFPreviewPanel**: Aggiungere `useEffect` cleanup per `revokeObjectURL` quando `iframeUrl` cambia o il componente si smonta.

3. **Pagina AccettaInvito**: Creare `src/pages/AccettaInvito.tsx` che:
   - Legge `?token=xxx` dalla URL
   - Verifica il token contro `azienda_inviti` (non scaduto, non usato)
   - Se utente non loggato → redirect a signup con token in state
   - Se utente loggato → aggiorna `profiles.company_id`, assegna ruolo, marca invito come usato
   - Aggiungere route in `App.tsx`

### Fase 2 — Fix importanti (2 task)

4. **Cleanup `StepSuperfici`**: Aggiungere `useEffect` return che fa `revokeObjectURL` su tutte le preview.

5. **Cleanup interval `RenderPersianeNew`** e simili: Assicurarsi che `clearInterval` sia chiamato anche nel catch, non solo nel try. Stesso pattern in `RenderBagnoNew` e `RenderFacciataNew`.

### Fase 3 — Miglioramenti (1 task)

6. **Abilitare Leaked Password Protection**: Istruzione per l'utente di attivarlo in Supabase Dashboard → Auth → Settings.

### Cosa NON implementare

- **CORS restrictivo per produzione**: Prematura — il progetto non è ancora in produzione con dominio custom.
- **Rate limiting via DB**: Complessità eccessiva per lo stato attuale. Il sistema crediti già limita l'uso.
- **Zod in tutte le edge functions**: Scope troppo ampio per un singolo intervento. Raccomandato come task separato futuro.
- **Refactoring `as any`**: Richiede rigenerazione tipi Supabase che non possiamo fare qui.

---

## Stima Effort

| Task | Effort |
|------|--------|
| C1. RLS monthly_billing_summary | 5 min (SQL) |
| C2. Fix PDFPreviewPanel leak | 5 min |
| C3. Pagina AccettaInvito | 30 min |
| I1. Fix StepSuperfici cleanup | 5 min |
| I2. Fix interval cleanup render pages | 10 min |
| **Totale** | **~55 min** |

