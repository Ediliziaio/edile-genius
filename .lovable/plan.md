

# Piano: Pagina "Per Chi È" con Mega-Menu e Sotto-Pagine per Settore

## Concept
Ispirandosi al riferimento JetHR (screenshot), creare un sistema di navigazione con dropdown "Per Chi È" che mostra categorie del settore edile, con una landing page principale e sotto-pagine dedicate per ogni tipo di azienda. Stile persuasivo Kennedy/Abraham/Belfort.

## Struttura

### 1. Categorie aziende edili

**Per Dimensione:**
- Artigiani e Micro Imprese (1-5 dipendenti)
- Piccole Imprese (6-25 dipendenti)
- Medie Imprese (26-100 dipendenti)
- Grandi Aziende e General Contractor (100+)

**Per Settore:**
- Serramentisti e Infissi
- Installatori Fotovoltaico
- Imprese di Ristrutturazione
- Imprese Edili Generali
- Posatori e Pavimentisti
- Lattonieri e Coperture
- Impianti Idraulici e Termici
- Impianti Elettrici
- Cartongessisti e Finiture
- Progettisti e Studi Tecnici

### 2. File da creare/modificare

**Nuovo file `src/data/perChiE.ts`** — dati centralizzati per tutte le categorie (slug, titolo, icon lucide, pain points, soluzioni AI, ROI, CTA copy). Ogni categoria ha i dati per generare la pagina dinamica.

**Nuovo file `src/pages/PerChiE.tsx`** — pagina indice che mostra tutte le categorie in grid (dimensione + settore), ciascuna cliccabile verso `/per-chi-e/:slug`.

**Nuovo file `src/pages/PerChiEDetail.tsx`** — pagina dinamica che legge lo slug dall'URL, trova i dati in `perChiE.ts` e renderizza una landing page persuasiva con:
- Hero con H1 specifico per il settore ("Sei Un Serramentista? Ecco Perché I Tuoi Competitor Ti Stanno Superando.")
- Sezione "Il Tuo Problema" — 3 pain point specifici del settore con icone XCircle rosse
- Sezione "La Nostra Soluzione Per Te" — 3 soluzioni AI mappate al settore specifico
- Numeri/ROI specifici per settore
- Testimonianza/caso studio fittizio ma realistico
- Sezione Garanzia
- CTA finale dark stile Belfort

**Modifica `src/components/sections/Navbar.tsx`** — aggiungere "Per Chi È" con mega-dropdown che mostra 2 colonne (Dimensione Azienda | Settore) con icone, come nel riferimento JetHR. Il dropdown appare on hover/click.

**Modifica `src/App.tsx`** — aggiungere routes:
- `/per-chi-e` → `PerChiE`
- `/per-chi-e/:slug` → `PerChiEDetail`

### 3. Struttura pagina singola (PerChiEDetail) — Stile Kennedy

Ogni pagina settore segue questo schema persuasivo:

1. **Hero**: Badge settore, H1 aggressivo personalizzato, sottotitolo con pain + promise, 3 mini-stat
2. **"Il Problema"**: 3 card con i problemi specifici di quel tipo di azienda (es. per serramentisti: "Lead che chiedono preventivi e spariscono", "Commerciali che fanno sopralluoghi a vuoto", "Telefonate perse = soldi persi")
3. **"La Soluzione"**: Come l'AI risolve quei problemi specifici, con 3 card verdi
4. **ROI Box**: Numeri concreti di risparmio per quel settore
5. **Caso Studio**: Mini-storia di un'azienda tipo (fittizio ma credibile)
6. **Guarantee**: Componente `<Guarantee />` riutilizzato
7. **CTA Dark**: "Ogni Giorno Che Aspetti, Un Tuo Competitor Chiude Un Contratto In Più."

### 4. Mega-menu Navbar

Il link "Per Chi È" nella navbar avrà un dropdown con:
- Colonna sinistra: "DIMENSIONE AZIENDA" — 4 link con icone lucide
- Colonna destra: "SETTORE" — 10 link con icone lucide
- Stile: bg-white, shadow, rounded, con hover states, linea separator verticale

Sul mobile: accordion/collapsible che mostra le stesse categorie.

## File totali
- **Creare**: `src/data/perChiE.ts`, `src/pages/PerChiE.tsx`, `src/pages/PerChiEDetail.tsx`
- **Modificare**: `src/components/sections/Navbar.tsx`, `src/App.tsx`

