

# Ottimizzazione Menu + Nuove Pagine "Come Funziona" e "Garanzia"

## Problema attuale
Il menu Navbar contiene `homeLinks` che puntano ad anchor della homepage (`#soluzione`, `#use-cases`, `#come-funziona`, `#risultati`, `#pricing`). Quando sei su un'altra pagina, questi link non funzionano correttamente. Il menu va semplificato con solo link a pagine dedicate.

## Modifiche

### 1. Navbar — Semplificazione menu
Rimuovere completamente `homeLinks` e la logica `isHome`/anchor. Il menu diventa:
- **Soluzioni** → `/soluzioni`
- **Come Funziona** → `/come-funziona` (nuova pagina)
- **Garanzia** → `/garanzia` (nuova pagina)
- **Chi Siamo** → `/chi-siamo`

Stesso pattern per desktop e mobile. Niente più condizionali `isHome ? <a> : <Link>`.

### 2. Pagina `/come-funziona` — `src/pages/ComeFunziona.tsx`
Pagina standalone con Navbar + Footer, contenente:
- Hero con badge "IL PROCESSO" e headline "Operativo in 7-14 Giorni"
- I 3 step esistenti da `HowItWorks.tsx` in layout espanso (più dettaglio per step, card più grandi)
- La sezione `ImplementationSteps` (4 step dettagliati) già presente in Solutions, riutilizzata qui
- CTA finale "Prenota Demo"

### 3. Pagina `/garanzia` — `src/pages/Garanzia.tsx`
Pagina standalone con Navbar + Footer, contenente:
- Hero con scudo emoji e headline "GARANZIA RIMBORSO 30 GIORNI"
- Blocco garanzia espanso dal contenuto di `Guarantee.tsx` con più dettagli
- Sezione FAQ garanzia (3-4 domande: "Cosa succede se non funziona?", "Come si misura?", "Ci sono clausole?", "Dopo i 30 giorni?")
- CTA finale

### 4. Routing — `App.tsx`
Aggiungere:
```
<Route path="/come-funziona" element={<ComeFunziona />} />
<Route path="/garanzia" element={<Garanzia />} />
```

### 5. Homepage — Nessuna rimozione
Le sezioni `HowItWorks` e `Guarantee` restano nella homepage come sezioni di scroll. Le nuove pagine sono versioni espanse/dedicate.

## File da creare/modificare
- **Creare**: `src/pages/ComeFunziona.tsx`, `src/pages/Garanzia.tsx`
- **Modificare**: `src/components/sections/Navbar.tsx` (semplificazione completa)
- **Modificare**: `src/App.tsx` (2 nuove route)

