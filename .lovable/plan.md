

# Criticita: Template WhatsApp aprono il wizard vocale

## Problema

Quando l'utente clicca su un template WhatsApp (es. "Assistente WhatsApp Commerciale", "Primo Contatto Lead WhatsApp", "Follow-up Preventivi WhatsApp"), viene aperto lo stesso wizard di creazione agente vocale (`AgentTemplateWizard`), che crea un agente ElevenLabs. Questo e' sbagliato perche' questi template dovrebbero configurare un agente WhatsApp, non vocale.

**Causa tecnica**: In `AgentTemplateWizard.tsx`, riga 21-29, tutti gli slug WhatsApp (`assistente-whatsapp`, `primo-contatto-wa`, `followup-preventivi-wa`) sono inclusi nell'array `VOCAL_SLUGS`. La funzione `getAgentType()` restituisce sempre `"vocal"` per tutti, e il wizard procede con la creazione di un agente ElevenLabs (voce, TTS, chiamate).

Inoltre, in `CreateAgent.tsx` riga 424-431, sia i template WhatsApp statici che quelli vocali navigano tutti verso `/app/agents/new/{slug}`, che punta sempre ad `AgentTemplateWizard` — lo stesso componente per agenti vocali.

## Piano di Fix

### 1. Modificare il routing in `CreateAgent.tsx` (`TemplateHubCard.handleClick`)

Per i template con `channel: ["whatsapp"]`, navigare verso `/app/whatsapp` (la pagina WhatsApp gia' esistente) oppure verso un wizard dedicato WhatsApp, invece di `/app/agents/new/{slug}`.

### 2. Rimuovere gli slug WhatsApp da `VOCAL_SLUGS` in `AgentTemplateWizard.tsx`

Rimuovere `primo-contatto-wa`, `followup-preventivi-wa`, `assistente-whatsapp` dalla lista `VOCAL_SLUGS` (righe 25).

### 3. Aggiungere redirect/gestione in `AgentTemplateWizard` per slug WhatsApp

Se un utente naviga direttamente a `/app/agents/new/assistente-whatsapp`, il wizard dovrebbe riconoscere che e' un template WhatsApp e reindirizzare alla pagina corretta (come gia' fa per `render-infissi` che reindirizza a `/app/render/new`).

### File modificati

| File | Modifica |
|------|----------|
| `src/pages/app/CreateAgent.tsx` | In `handleClick`, se `channel` include `"whatsapp"`, navigare a `/app/whatsapp` invece di `/app/agents/new/{slug}` |
| `src/pages/app/AgentTemplateWizard.tsx` | Rimuovere slug WA da `VOCAL_SLUGS`; aggiungere redirect a `/app/whatsapp` per slug WhatsApp |

