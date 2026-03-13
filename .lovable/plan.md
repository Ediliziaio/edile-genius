

# Render Facciata — Prompt Builder Engine (Doc 2/5)

## Obiettivo
Creare il sistema di prompt engineering per il modulo Render Facciata, con blocchi A-H + system prompt + negative prompt, seguendo lo stesso pattern modulare usato per Render Infissi e Render Bagno.

## File da creare

### 1. `src/modules/render-facciata/lib/facciataPromptBuilder.ts`
Core del prompt engine:
- **Tipi TypeScript**: `TipoInterventoFacciata` (5 valori), `ZonaApplicazione` (6), `FinituraIntonaco` (9), `TipoRivestimento` (14), `AnalysiFacciata` (21 campi), `ConfigurazioneFacciata`
- **Dizionari**: `FINITURA_PROMPTS` (9 finiture con descrizioni AI), `RIVESTIMENTO_PROMPTS` (14 materiali pietra/laterizio), `ZONA_PROMPTS` (6 zone applicazione)
- **Block Builders**:
  - `buildBlock_A()` — Analisi facciata esistente (21 campi)
  - `buildBlock_B()` — Replacement manifest con ✅/🚫 per tipo intervento
  - `buildBlock_C_Tinteggiatura()` — Colore + finitura intonaco
  - `buildBlock_D_Rivestimento()` — Materiale + zona + complementare
  - `buildBlock_E_Cappotto()` — Spessore + effetto reveals + colore finale
  - `buildBlock_F_ElementiArchitettonici()` — Cornici, marcapiani, davanzali
  - `buildBlock_G_Preservazione()` — Regole pixel-identical
  - `buildBlock_H_QualityRules()` — Fotorealismo + negative
- **Prompts esportati**: `FACADE_SYSTEM_PROMPT` (10 regole), `FACADE_NEGATIVE_PROMPT` (30+ termini)
- **Funzione principale**: `buildFacciataPrompt(analisi, config)` — assembler che concatena i blocchi in base al `tipo_intervento`

### 2. `src/modules/render-facciata/lib/facciataPresets.ts`
Stili pronti preconfigurati (8 stili):
- `moderno_grigio` — Grigio antracite rasato
- `classico_bianco_avorio` — Bianco antico graffiato fine
- `toscano_ocra` — Ocra classica liscia
- `cappotto_bianco_graffiato` — Cappotto 12cm + bianco graffiato
- `misto_travertino_beige` — Piano terra travertino, sopra beige
- `pietra_zoccolatura` — Zoccolatura Pietra Serena + bianco calce
- `laterizio_rosso` — Mattone a vista cotto rosso
- `verde_salvia_contemporaneo` — Verde salvia rasato

## Struttura directory
```
src/modules/render-facciata/
└── lib/
    ├── facciataPromptBuilder.ts   ← Core prompt engine
    └── facciataPresets.ts         ← Stili pronti
```

## Pattern seguiti
- Stessa struttura modulare a blocchi (A-H) del `promptBuilder.ts` per infissi
- Stessi dizionari descrizione-AI del `bathroomPromptBuilder.ts` (TILE_PHYSICS pattern)
- Esportazione `PromptResult` con `{userPrompt, systemPrompt, negativePrompt}`
- Versione `FACCIATA_PROMPT_VERSION = "1.0.0"`

## Note di implementazione
- Il file deve essere **type-safe** — tutte le interfacce esportate per uso in `RenderFacciataNew.tsx`
- I `prompt_fragment` nei preset devono matchare esattamente i valori in `render_facciata_presets` del DB
- `buildBlock_E_Cappotto` calcola automaticamente la nuova profondità reveal: `current_depth + spessore_cm`

