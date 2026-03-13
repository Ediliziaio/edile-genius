

# Render Stanza Completo — Doc 2/5: StanzaPromptBuilder.ts

## Current State
Doc 1/5 is complete (DB tables, storage buckets, edge functions, routes, nav). Doc 2/5 (`stanzaPromptBuilder.ts`) does not exist — it's the core logic that generates surgical prompts for multi-intervention room renders.

## Changes

### 1. Create `src/modules/render-stanza/lib/stanzaPromptBuilder.ts`
Full prompt builder with:
- **Types**: `TipoStanza`, `TipoIntervento` (10 types), `StileArredo` (12 styles), `Intensita` (3 levels)
- **Config interfaces**: 10 specific configs (Verniciatura, Pavimento, Arredo, Soffitto, Illuminazione, CartaDaParati, RivestimentoPareti, Tende, RestylingCucina, RestylingBagno)
- **`ConfigurazioneStanza`**: master config nesting all interventions + notes + dimensions
- **`AnalisiStanza`**: structured analysis object matching the edge function response
- **12 block builders**: intro, pareti, pavimento, arredo, soffitto, illuminazione, carta da parati, rivestimento pareti, tende, restyling cucina, restyling bagno, preservazione
- **`ROOM_SYSTEM_PROMPT`**: 12 fundamental rules for the AI
- **`ROOM_QUALITY_SUFFIX`**: final quality checklist
- **`buildStanzaPrompt()`**: orchestrates all blocks into user/system prompts
- **`getInterventiAttivi()`**: helper to list active interventions
- **`STANZA_STILI_PRONTI_FALLBACK`**: 8 preset styles (Scandinavo, Industriale, Verde salvia, Lusso, Terracotta, Minimalista, Japandi, Verde bottiglia)

## Files
- **New**: `src/modules/render-stanza/lib/stanzaPromptBuilder.ts` — 700+ lines with all types, builders, presets, and main API

