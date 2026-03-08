

# Fix: Pagina bianca su `/app/agents/new/render-infissi`

## Problema
In `AgentTemplateWizard.tsx` (linea 120-122), quando lo slug e `render-infissi`, il componente chiama `navigate("/app/render/new")` **durante il render** (non in un `useEffect`). Questo e un anti-pattern React che causa la schermata bianca.

## Soluzione
Sostituire la chiamata `navigate()` sincrona con un `useEffect` che esegue il redirect correttamente dopo il mount del componente. In questo modo React completa il render prima di navigare.

## File da modificare

**`src/pages/app/AgentTemplateWizard.tsx`**
- Aggiungere `useEffect` per gestire il redirect dei render agents
- Rimuovere il blocco `if (agentType === "render") { navigate(...); return null; }` dal corpo del render
- Mostrare un loader durante il redirect

