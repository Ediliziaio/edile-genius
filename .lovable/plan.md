

## Nessuna modifica necessaria

Questa integrazione ElevenLabs completa è **già stata implementata** nel messaggio precedente. Tutti i 10 parti del prompt sono già presenti nel codebase:

1. **Migrazione DB** — Tutti i campi su `agents`, `conversations`, `ai_phone_numbers`, `ai_knowledge_docs` + tabella `outbound_call_log` con RLS
2. **Edge Functions** — `create-elevenlabs-agent` (riscritta), `update-agent` (aggiornata), `elevenlabs-webhook` (HMAC + collected_data), `elevenlabs-outbound-call` (nuova), `elevenlabs-import-phone-number` (nuova), `add-knowledge-doc` (file upload), `get-elevenlabs-voices` (filtri avanzati)
3. **BuyPhoneNumber** — Flusso 4 step Twilio reale
4. **AgentConfigForm** — Sezioni ASR, Strumenti Integrati, Sicurezza & Valutazione + TTS Model selector
5. **AgentDetail** — Tab "Chiamate Uscenti", colonna eval_score nelle conversazioni
6. **TranscriptViewer** — Mostra eval_score, eval_notes, collected_data
7. **VoicePickerEnhanced** — Filtri genere, lingua, categoria
8. **AgentIntegrationTab** — Sezione webhook post-chiamata
9. **AgentOutboundTab** — Form chiamata singola + log
10. **CreateAgent.types.ts** — Tutti i nuovi campi

Non ci sono gap da colmare. Il codice è completo e funzionante.

