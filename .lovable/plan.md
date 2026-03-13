

# Plan: Create `bathroomPromptBuilder.ts` — Doc 2/5

## What

Create `src/modules/render-bagno/lib/bathroomPromptBuilder.ts` containing all TypeScript interfaces, material physics dictionaries, block builder functions (A-K + Layout + Finale), helper functions, and the main `buildBathroomPrompt()` export.

## Single file creation

The file will contain exactly what Doc 2/5 specifies:

1. **Interfaces/Types** (~150 lines): `AnalysiBagno`, `TipoIntervento`, `SostituzioneElementi`, `ConfigPiastrella`, `ConfigDoccia`, `ConfigVasca`, `ConfigVanity`, `ConfigSanitari`, `ConfigRubinetteria`, `ConfigParete`, `ConfigLayout`, `ConfigurazioneBagno`
2. **TILE_PHYSICS dictionary**: 15 material descriptions
3. **Block builders** (A-K): `buildBlock_A` through `buildBlock_K`, each generating a labeled prompt section
4. **Constants**: `BATHROOM_SYSTEM_PROMPT` (10 rules), `BATHROOM_NEGATIVE_PROMPT` (25+ terms)
5. **Helper functions**: `buildPosaDescription`, `buildFugaDescription`, `buildShowerTypeDesc`, `buildSoffioneDesc`, `buildVascaPositionDesc`, `buildLavaboDesc`, `buildRubStyle`, `buildPareteDesc`, `buildIlluminazioneDesc`
6. **Main export**: `buildBathroomPrompt(analisi, config)` returning `{ userPrompt, systemPrompt, negativePrompt }`
7. **Layout block**: `buildBlock_Layout()` for full demolition mode

No other files are modified. This is a standalone module with no external imports.

