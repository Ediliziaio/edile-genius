

# Analisi Voci Ridondanti nei Moduli Render

## Ridondanze trovate

### 1. PERSIANE — Tipi duplicati: `frangisole` e `brise_soleil`

Nel type `TipoPersoniana` e nel dizionario prompt, `frangisole` e `brise_soleil` sono sostanzialmente la stessa cosa:
- `frangisole`: "brise-soleil / sun-screening blades — large horizontal or vertical adjustable blades"
- `brise_soleil`: "architectural brise-soleil — fixed or adjustable horizontal/vertical blades for solar control, contemporary design"

La descrizione stessa di `frangisole` dice "brise-soleil". Sono due nomi per lo stesso prodotto architettonico. Il `PersianaStylePicker` UI mostra solo `brise_soleil` (9 voci), ma il tipo e il prompt contengono entrambi (13 voci).

**Fix**: Rimuovere `frangisole` dal type, dal prompt dictionary e da qualsiasi compatibilità nel MaterialePicker. Mantenere solo `brise_soleil`.

### 2. PERSIANE — Materiali duplicati: `legno` vs `legno_naturale`, `composito` vs `legno_composito`

Nel type `MaterialePersiana` (9 valori) e nel dizionario prompt:
- `legno`: "natural solid wood with visible grain texture"
- `legno_naturale`: "premium natural solid wood (larch, pine, iroko) with authentic visible grain texture, painted or natural finish"
  → Stesso materiale, una con più dettaglio. Il `MaterialePicker` UI mostra solo `legno_naturale` (6 voci), `legno` non appare mai nella UI.

- `composito`: "wood-composite material with realistic wood-grain embossing"
- `legno_composito`: "wood-composite material (WPC) — wood fiber + PVC blend, high weather resistance with realistic wood-grain embossing"
  → Identici. Il `MaterialePicker` UI mostra solo `legno_composito`, `composito` non appare.

**Fix**: Rimuovere `legno` e `composito` dal type e dal prompt dictionary. Mantenere `legno_naturale` e `legno_composito`.

### 3. PERSIANE — Tipi non nella UI: `scuro_dogato`, `persiana_scorrevole`, `alla_romana`, `frangisole`

Il type `TipoPersoniana` ha 13 valori, ma `PersianaStylePicker` ne mostra solo 9. Questi 4 tipi esistono nel type/prompt ma non sono selezionabili dall'utente:
- `scuro_dogato` — variante molto simile a `scuro_pieno`
- `persiana_scorrevole` — tipo di nicchia
- `alla_romana` — molto simile a `veneziana_classica`
- `frangisole` — duplicato di `brise_soleil`

Il materiale `ferro_battuto` esiste nel type ma non nel MaterialePicker UI (3 materiali su 9 sono "fantasma": `legno`, `composito`, `ferro_battuto`).

**Fix**: Rimuovere dal type le voci non presenti nella UI per evitare confusione e codice morto. Se in futuro servissero, si riaggiungeranno.

### 4. PERSIANE — `larghezza_lamella_mm` e `apertura_lamelle` mostrate solo per veneziane, ma inviate sempre nel prompt

La UI mostra il `LamellaPicker` solo quando il tipo è `veneziana_classica` o `veneziana_esterna`, ma il `buildPersianaPrompt` include SEMPRE `Slat width` e `Slat aperture` nel Block C, anche per tipi senza lamelle (scuro pieno, griglia sicurezza). Questo genera istruzioni incoerenti per l'AI.

**Fix**: Nel prompt builder, includere `Slat width` e `Slat aperture` solo per i tipi con lamelle (veneziana_classica, veneziana_esterna, gelosia, brise_soleil).

### 5. PAVIMENTO — `tipo_operazione` ha `aggiungi` ma non è usato dalla UI

Il type `TipoOperazione` per Pavimento include `"sostituisci" | "aggiungi" | "cambia_colore"`, ma la UI di `RenderPavimentoNew` non mostra mai un selettore per il tipo operazione — è hardcoded a `"sostituisci"`. Le opzioni `aggiungi` e `cambia_colore` sono codice morto.

**Fix**: Rimuovere `aggiungi` e `cambia_colore` dal type (o aggiungere il selettore alla UI se li si vuole supportare).

### 6. STANZA — Sovrapposizione tra 3 interventi sulle pareti

Il modulo Stanza ha tre interventi distinti per le pareti:
- **Verniciatura pareti** — cambia colore/finitura
- **Carta da parati** — applica wallpaper decorativo
- **Rivestimento pareti** — boiserie, mattone, pietra, pannelli 3D

Tutti e tre agiscono sulle pareti e possono essere attivati contemporaneamente, generando istruzioni contraddittorie per l'AI (es. "vernicia le pareti di bianco" + "applica carta da parati geometrica" + "aggiungi boiserie in legno"). Non c'è un guard che impedisca l'attivazione simultanea.

**Fix**: Aggiungere logica di mutua esclusione: se l'utente attiva `carta_da_parati` o `rivestimento_pareti`, disattivare automaticamente `verniciatura` (e viceversa), oppure mostrare un avviso.

### 7. TETTO — `tipo_tetto` mostrato nella UI ma mai usato nel prompt

`TIPO_TETTO_OPTIONS` (a_falde, piano, mansardato, ecc.) viene mostrato nello step analisi come badge informativo, ma il tipo di tetto NON viene passato alla configurazione né usato nel `buildTettoPrompt`. È puramente decorativo.

**Fix**: O collegarlo al prompt builder (utile per l'AI), oppure rimuovere il selettore dalla UI per non confondere l'utente.

---

## Piano di implementazione

### File da modificare

1. **`src/modules/render-persiane/lib/persianePromptBuilder.ts`**
   - Rimuovere `frangisole`, `scuro_dogato`, `persiana_scorrevole`, `alla_romana` dal type `TipoPersoniana` e dal dizionario `TIPO_PERSIANA_PROMPTS`
   - Rimuovere `legno`, `composito`, `ferro_battuto` dal type `MaterialePersiana` e dal dizionario `MATERIALE_PROMPTS`
   - Condizionare `Slat width`/`Slat aperture` nel Block C solo per tipi con lamelle

2. **`src/modules/render-persiane/components/MaterialePicker.tsx`**
   - Rimuovere riferimenti ai tipi eliminati nelle liste `compatibleWith`

3. **`src/modules/render-pavimento/lib/pavimentoPromptBuilder.ts`**
   - Rimuovere `aggiungi` e `cambia_colore` dal type `TipoOperazione` (oppure aggiungere selettore UI)

4. **`src/pages/app/RenderStanzaNew.tsx`**
   - Aggiungere logica di mutua esclusione per verniciatura / carta_da_parati / rivestimento_pareti

5. **`src/pages/app/RenderTettoNew.tsx`** + **`src/modules/render-tetto/lib/buildPrompt.ts`**
   - Passare `tipo_tetto` dall'analisi al prompt builder come contesto

