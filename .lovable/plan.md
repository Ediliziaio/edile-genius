

# Analisi Completa: Wizard Attuale vs ElevenLabs

Il wizard a 5 step è già ben strutturato con sidebar, animazioni Framer Motion, voice picker con filtri, conversation flow avanzato, e test pre-creazione (TTS + Draft). Dopo analisi dettagliata del codice e della documentazione ElevenLabs, ecco cosa manca ancora per la parità completa:

## Gap Identificati

1. **Nessuna validazione tra step** — L'utente può avanzare senza compilare campi obbligatori (nome, prompt, voce)
2. **Nessun feedback di completamento step** — La sidebar mostra "completato" solo perché si è passati allo step successivo, non perché i campi sono compilati
3. **Mancano le Custom Tools (API/Client tools)** — ElevenLabs permette di configurare tool che l'agente può chiamare (es. API esterne, webhook)
4. **Manca la sezione Guardrails/Safety** — Limiti di contenuto, PII redaction
5. **Manca il supporto lingue aggiuntive** — Solo lingua principale, nessuna selezione multi-lingua
6. **Il webhook_url non viene salvato** — Il campo esiste nel form ma non viene passato a `buildConfig()` né alla edge function
7. **I file KB non vengono effettivamente caricati** — Il sistema raccoglie i file pending ma non li uploada al bucket `knowledge-base` durante la creazione
8. **Manca progress bar / indicatore completamento globale** — ElevenLabs mostra una percentuale di completamento
9. **Il TTS preview non usa le voice_settings personalizzate** — Chiama il TTS senza passare stability/similarity/speed

## Piano di Implementazione

### 1. Validazione Step e Completamento Intelligente
- Aggiungere logica di validazione per step (step 0: name + system_prompt, step 1: voice_id, etc.)
- La sidebar mostra check solo se i campi obbligatori dello step sono compilati
- Bottone "Avanti" disabilitato se lo step corrente non è valido
- Progress bar sotto l'header con % completamento globale

### 2. Upload effettivo Knowledge Base
- Modificare `handleSubmit` in `CreateAgent.tsx` per uploadare i file pending al bucket `knowledge-base` dopo la creazione dell'agente
- Salvare i riferimenti file nel campo `config.kb_files` dell'agente

### 3. Webhook e Voice Settings nel flusso di creazione
- Aggiungere `webhook_url` a `buildConfig()` e alla edge function `create-elevenlabs-agent`
- Passare `voice_settings` (stability, similarity, speed) nella chiamata TTS preview

### 4. Supporto Multi-Lingua
- Aggiungere campo `additional_languages` al form (multi-select)
- Passare alla edge function per la configurazione ElevenLabs

### 5. Sezione Custom Tools (Step 4 - Avanzate)
- Aggiungere un builder semplice per tool personalizzati: nome, descrizione, URL endpoint, metodo HTTP
- Salvare nel config come array di tool definitions

### 6. Guardrails / Safety (Step 4 - Avanzate)
- Toggle per PII redaction (numeri di telefono, email, carte di credito)
- Limiti di contenuto (blocco argomenti sensibili)

### File da modificare
- `CreateAgent.tsx` — Validazione step, upload KB, webhook nel config, progress bar
- `AgentStepSidebar.tsx` — Validazione visiva intelligente, progress indicator
- `StepAdvanced.tsx` — Sezione Custom Tools + Guardrails
- `StepReview.tsx` — Mostrare webhook, tools, KB files nel riepilogo, fix TTS con voice settings
- `StepAgent.tsx` — Multi-lingua selector
- `supabase/functions/create-elevenlabs-agent/index.ts` — Ricevere webhook_url, additional_languages, tools
- `supabase/functions/elevenlabs-tts/index.ts` — Accettare voice_settings opzionali

### Stima: ~7 file modificati, 0 nuovi componenti, 0 migrazioni DB

