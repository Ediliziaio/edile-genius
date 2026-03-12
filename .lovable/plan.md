

# Render Infissi v3 — Cassonetti, Tapparelle, Cerniere, Sostituzione Selettiva

## Panoramica

Riscrittura completa del sistema Render per supportare:
- **Sostituzione selettiva**: l'utente sceglie cosa sostituire (infissi, cassonetto, tapparella) indipendentemente
- **Cassonetti PVC configurabili**: 4 tipi materiale + 11 colori RAL
- **Tapparelle**: 5 tipi (PVC, alluminio, microforata, persiana, veneziana) + colori + stato render (aperta/chiusa/mezza)
- **Cerniere**: 3 tipi (europea, a libro, invisibile) + colore + numero per anta
- **Prompt v3.0.0**: blocchi A-L rivisitati con istruzioni di sostituzione selettiva

## Modifiche

### 1. Migrazione DB — Nuova colonna `preset_group` + seed dati

Aggiungere colonna `preset_group` alla tabella `render_infissi_presets` per distinguere preset cassonetto/tapparella/colori da quelli infisso. Inserire ~30 nuovi preset (4 cassonetti, 5 tapparelle, 11 colori cassonetto, 9 colori tapparella).

SQL: `ALTER TABLE` + `INSERT INTO` come da documento caricato (Parte 1).

### 2. `src/modules/render/lib/promptBuilder.ts` — Riscrittura v3.0.0

Sostituzione completa del file. Cambiamenti principali:
- Nuovi tipi: `CernieraColore`, `CassonettoMateriale`, `TapparellaMateriale`, `SostituzioneSelezione`
- Nuove interfacce: `CerniereConfig`, `CassonettoConfig` (estesa con materiale/colore/dimensione), `TapparellaConfig`
- `NuovoInfisso` esteso con `cerniere`, `tapparella`, `sostituzione`
- `FotoAnalisi` estesa con `colore_cassonetto_attuale`, `presenza_tapparella`, `tipo_tapparella_attuale`, `colore_tapparella_attuale`, `tipo_davanzale`
- Nuovi dizionari: `CASSONETTO_MATERIAL_DESC`, `TAPPARELLA_DESC`, `CERNIERA_DESC`
- Blocchi ridisegnati: Block C (sostituzione selettiva), Block E (cerniere), Block H (cassonetto esteso), Block I (tapparella), Block J/K/L aggiornati
- `buildRenderPromptV2()` assembla 12 blocchi, `promptVersion: "3.0.0"`
- Mantiene export legacy: `validatePhoto`, `checkImageDimensions`, `buildRenderPrompt`, `getMaterialDistinction`

### 3. `supabase/functions/generate-render/index.ts` — Prompt inline v3

Aggiornare la `buildPromptFromConfig()` inline:
- Aggiungere dizionari `CASSONETTO_MATERIAL_DESC`, `TAPPARELLA_DESC`, `CERNIERA_DESC`
- Aggiornare check `hasV2` per supportare `nuovoInfisso.sostituzione`
- Nuovi blocchi C (selettivo), E (cerniere), H (cassonetto esteso), I (tapparella)
- `promptVersion: "3.0.0"`

### 4. `supabase/functions/analyze-window-photo/index.ts` — Nuovi campi analisi

Aggiornare il prompt di analisi per estrarre:
- `colore_cassonetto_attuale`
- `presenza_tapparella`, `tipo_tapparella_attuale`, `colore_tapparella_attuale`
- `tipo_davanzale`

### 5. `src/pages/app/RenderNew.tsx` — UI Step 1 riscritta

Modifiche:
- Nuovi import: `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` + nuovi tipi dal promptBuilder
- Nuovi state: `sostituzione`, cassonetto (azione/materiale/colore), tapparella (azione/materiale/colore/guide/stato), cerniere (tipo/colore/perAnta), preset separati per cassonetto/tapparella/colori
- Load presets: separare per `category` in 4 gruppi aggiuntivi
- Step 1 UI: 
  - Sezione "Cosa vuoi sostituire?" con 3 toggle (infissi/cassonetto/tapparella)
  - Sezione condizionale "Configura Infissi" (materiale/colore/stile/vetro + profilo/ferramenta + cerniere v3)
  - Sezione condizionale "Configura Cassonetto" (azione + materiale + colore con "uguale infisso")
  - Sezione condizionale "Configura Tapparella" (azione + materiale + colore lamelle + colore guide + stato render)
  - Bottone "Genera" disabilitato se nessun elemento selezionato
- `startRender()`: costruire `nuovoInfisso` v3 con cerniere, cassonetto esteso, tapparella, sostituzione

### File modificati

| File | Azione |
|------|--------|
| DB migration | Nuova colonna + seed preset |
| `src/modules/render/lib/promptBuilder.ts` | Riscrittura completa v3 |
| `supabase/functions/generate-render/index.ts` | Aggiornamento inline prompt v3 |
| `supabase/functions/analyze-window-photo/index.ts` | Nuovi campi analisi |
| `src/pages/app/RenderNew.tsx` | UI Step 1 riscritta con sostituzione selettiva |

