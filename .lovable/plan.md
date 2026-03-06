

# Redesign Creazione Agente Vocale - Stile ElevenLabs

## Analisi Gap Attuale vs ElevenLabs

L'attuale wizard ha 4 step lineari con configurazioni minime. ElevenLabs offre un'esperienza molto piu ricca con:

**Mancante nella nostra app:**
1. **LLM Selection** - Scelta del modello (GPT-4o, Claude, Gemini, etc.)
2. **Conversation Flow avanzato** - Turn timeout, soft timeout, interruzioni, turn eagerness
3. **Max duration** - Durata massima conversazione
4. **System Tools** - End call automatico, language detection
5. **Voice settings avanzate** - Stability, similarity boost, speed, style
6. **Knowledge Base nell'onboarding** - Upload file durante creazione
7. **Evaluation criteria** - Criteri di successo/fallimento della conversazione
8. **Webhook/callback** configuration inline
9. **Privacy settings** - Data retention, PII redaction
10. **Widget customization** - Colore, avatar, posizione
11. **Live preview/test** durante la creazione (non solo dopo)

## Piano di Implementazione

### 1. Nuovo wizard a 5 step con sidebar di navigazione (stile ElevenLabs)

Sostituire il wizard lineare con un layout sidebar + content area:

```text
+-------------------+----------------------------------+
| Step Navigation   |  Content Area                    |
|                   |                                  |
| ● Agent           |  [Form fields per step attivo]   |
| ○ Voice           |                                  |
| ○ Conversation    |                                  |
| ○ Advanced        |                                  |
| ○ Review & Test   |                                  |
+-------------------+----------------------------------+
```

**Step 1 - Agent (Identita)**
- Nome, Descrizione
- Caso d'uso (template selector esistente, migliorato)
- Lingua principale + lingue aggiuntive
- System Prompt (con template pre-compilati dal use case)
- Primo messaggio
- LLM model selector (gpt-4o-mini default)
- Temperatura

**Step 2 - Voice**
- VoicePicker ridisegnato con:
  - Ricerca/filtro per nome, genere, accento
  - Preview audio piu grande con waveform
  - Voice settings: Stability slider, Similarity Boost slider, Speed slider
  - Categorie (Professional, Casual, Energetic, Calm)

**Step 3 - Conversation Flow**
- Turn timeout (1-30s slider)
- Soft timeout (on/off + durata + messaggio filler)
- Interruzioni (on/off)
- Turn eagerness (Eager/Normal/Patient)
- Durata massima conversazione (slider 1-30 min)
- System tools: End Call (on/off + prompt), Language Detection (on/off)

**Step 4 - Advanced**
- Knowledge Base upload (drag & drop, riuso componente esistente)
- Evaluation criteria (campo testo per definire cosa e successo/fallimento)
- Privacy: data retention toggle
- Settore (dropdown esistente)

**Step 5 - Review & Live Test**
- Riepilogo completo di tutte le impostazioni
- Bottone Test Vocale inline (riuso VoiceTestPanel)
- Pubblicazione: Bozza / Attivo

### 2. Componenti da creare/modificare

**Nuovi componenti:**
- `src/components/agents/create/AgentStepSidebar.tsx` - Sidebar navigazione step
- `src/components/agents/create/StepAgent.tsx` - Step 1
- `src/components/agents/create/StepVoice.tsx` - Step 2 con VoicePicker migliorato
- `src/components/agents/create/StepConversation.tsx` - Step 3
- `src/components/agents/create/StepAdvanced.tsx` - Step 4
- `src/components/agents/create/StepReview.tsx` - Step 5 con test inline
- `src/components/agents/VoicePickerEnhanced.tsx` - VoicePicker ridisegnato con filtri, search, voice settings

**File da modificare:**
- `src/pages/app/CreateAgent.tsx` - Riscrivere con nuovo layout
- `src/pages/app/AgentDetail.tsx` - Aggiornare config tab con stessi campi avanzati
- `src/components/agents/AgentConfigForm.tsx` - Espandere con nuovi campi
- `supabase/functions/create-elevenlabs-agent/index.ts` - Inviare nuovi parametri a ElevenLabs API (turn config, voice settings, tools, max duration)
- `supabase/functions/update-agent/index.ts` - Sincronizzare nuovi parametri con ElevenLabs

### 3. Database

Il campo `config` (jsonb) sul table `agents` puo contenere tutti i nuovi parametri senza migrazioni:

```json
{
  "temperature": 0.7,
  "llm_model": "gpt-4o-mini",
  "max_duration_sec": 600,
  "turn_timeout_sec": 10,
  "soft_timeout_sec": -1,
  "soft_timeout_message": "Hmm...",
  "interruptions_enabled": true,
  "turn_eagerness": "normal",
  "end_call_enabled": true,
  "end_call_prompt": "",
  "language_detection_enabled": false,
  "voice_stability": 0.5,
  "voice_similarity": 0.75,
  "voice_speed": 1.0,
  "voice_style": 0.5,
  "evaluation_criteria": "",
  "additional_languages": []
}
```

Nessuna migrazione necessaria: tutto nel campo `config` jsonb.

### 4. Aggiornamento Edge Functions

**create-elevenlabs-agent**: Estendere il body dell'API call con:
- `conversation_config.agent.prompt.tools` (end_call, language_detection)
- `conversation_config.agent.prompt.llm` (model selection)
- `conversation_config.turn` (timeout, eagerness)
- `conversation_config.tts` (voice_id + voice settings)
- `conversation_config.agent.max_duration_seconds`

**update-agent**: Stessa estensione per il PATCH.

### 5. UI/UX Details

- Animazioni Framer Motion tra step (slide left/right)
- Ogni sezione con toggle collapsible per opzioni avanzate
- Tooltips informativi su ogni impostazione
- Preview live del primo messaggio formattato
- Auto-save draft mentre si compila

### Stima: ~15 file coinvolti, 6 nuovi componenti, 2 edge function aggiornate, 0 migrazioni DB.

