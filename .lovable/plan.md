

# Implementazione Sistema Prompt Master — Sostituzione Strutturale Infissi

Il PDF descrive un sistema completo per passare dal prompt generico attuale (che produce una semplice "colorazione") a un sistema a blocchi (A-L) che genera una vera **sostituzione strutturale** degli infissi. L'implementazione copre: nuovo promptBuilder, analisi foto avanzata, schema DB, configuratore UX ampliato, e aggiornamento Edge Function.

---

## Fase 1 — Schema DB (migration SQL)

Aggiungere colonne a `render_sessions`:
- `prompt_blocks JSONB`
- `prompt_version TEXT`
- `prompt_char_count INTEGER`
- `foto_analisi JSONB`
- `config_snapshot JSONB`

Aggiungere colonne a `render_infissi_presets`:
- `materiale_tipo TEXT`
- `colore_ral TEXT`
- `colore_ncs TEXT`
- `finitura TEXT DEFAULT 'liscio_opaco'`

---

## Fase 2 — Nuovo `promptBuilder.ts`

Riscrivere completamente `src/modules/render/lib/promptBuilder.ts` con:
- Nuova `RenderConfig` estesa (interfacce `foto_analisi`, `nuovo_infisso`, `render_options`)
- Tutti i tipi enumerati (`TipoApertura`, `MaterialeAttuale`, `MaterialeNuovo`, `StileEdificio`, `ColoreConfig`, `ProfiloTelaio`, `VetroConfig`, `OscuranteConfig`, `FerramentaConfig`, `CassonettoConfig`)
- Dizionario `MATERIAL_PHYSICS` con descrizioni fisiche per materiale (PVC, alluminio, legno, legno-alluminio, acciaio)
- Funzione `getMaterialDistinction(old, new)` per descrivere differenze fisiche tra vecchio e nuovo
- Dizionario `APERTURA_DESCRIPTION` per ogni tipo apertura
- 12 funzioni `buildBlock_A` → `buildBlock_L` che costruiscono i blocchi del prompt
- Funzione principale `buildRenderPrompt(config, provider)` che assembla tutto e ritorna `{ systemPrompt, userPrompt, negativePrompt, promptVersion, charCount }`
- Mantenere le funzioni `validatePhoto` e `checkImageDimensions` esistenti

---

## Fase 3 — Aggiornamento `analyze-window-photo` Edge Function

Aggiornare il prompt di analisi per restituire il JSON strutturato `foto_analisi` con tutti i campi richiesti dal nuovo sistema:
- `tipo_apertura`, `materiale_attuale`, `colore_attuale`, `condizioni`, `num_ante_attuale`, `spessore_telaio`, `presenza_cassonetto`, `tipo_cassonetto`, `tipo_vetro_attuale`, `stile_edificio`, `materiale_muro`, `colore_muro`, `presenza_davanzale`, `presenza_inferriata`, `piano`, `luce`, `angolo_ripresa`

---

## Fase 4 — Aggiornamento `generate-render` Edge Function

Sostituire la sezione di costruzione prompt con:
- Ricostruire `RenderConfig` dalla sessione DB (usando `session.foto_analisi`, `session.config`)
- Chiamare `buildRenderPrompt()` con il provider
- Inviare `systemPrompt` come system message + `userPrompt` come user message al gateway AI
- Salvare `prompt_blocks`, `prompt_version`, `prompt_char_count`, `config_snapshot` nella sessione

---

## Fase 5 — Configuratore UX (`RenderNew.tsx`)

Aggiornare il flusso di configurazione (Step 1) con:
- **Analisi automatica foto**: dopo l'upload, chiamare `analyze-window-photo` e salvare `foto_analisi` nella sessione. Mostrare un mini-riepilogo dei risultati rilevati (materiale attuale, tipo apertura, condizioni)
- **Nuove sezioni configuratore**:
  - "Profilo Telaio" — 3 card radio (Residenziale 70mm/3camere, Premium 82mm/5camere, Passivhaus 92mm/7camere) + radio pills forma profilo (Squadrato, Arrotondato, Europeo)
  - "Ferramenta" — select maniglia (Leva Alluminio, Leva Acciaio, Pomolo, Alzante) + palette colore ferramenta (Argento, Nero opaco, Inox, Bronzo, Oro)
- **Info box "Cambio strutturale"**: mostra cosa viene sostituito (prima/dopo) basandosi sull'analisi foto

---

## Note tecniche

- Il promptBuilder sarà un file frontend (`src/modules/render/lib/promptBuilder.ts`) ma la logica di assemblaggio verrà anche replicata inline nella Edge Function (dato che le Edge Functions non possono importare da `src/`)
- I preset DB esistenti restano compatibili — i nuovi campi (`materiale_tipo`, `colore_ral`, etc.) saranno opzionali
- Il `ANALYSIS_PROMPT` aggiornato nell'edge function `analyze-window-photo` produrrà dati strutturati che alimentano direttamente i blocchi B e C del prompt

