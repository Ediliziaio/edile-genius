

# Fix RenderStanzaNew "Cannot read properties of undefined (reading 'pareti')" crash

## Problem
The page `/app/render-stanza/new` crashes with `TypeError: Cannot read properties of undefined (reading 'pareti')`. The error occurs inside a `useState` state updater during a React re-render (likely triggered by Vite HMR). The stack trace shows the crash at a state updater callback being replayed where a nested property of `config` or `analisi` is undefined.

## Root Cause
During HMR (hot module replacement), React re-renders the component but replays queued state updaters from the previous module version. If the `config` state object somehow lost its nested structure (e.g., `config.rivestimento_pareti` became undefined), accessing `.attivo` on it would crash. Similarly, `prefillFromAnalisi` could crash if called with a malformed `analisi` object.

## Fix

### Edit `src/pages/app/RenderStanzaNew.tsx`

1. **Make `toggleIntervento` defensive** — guard against `prev[key]` being undefined:
   ```typescript
   const toggleIntervento = (key: keyof InterventiState, value: boolean) => {
     setInterventiAttivi(prev => ({ ...prev, [key]: value }));
     setConfig(prev => {
       const existing = prev[key as keyof WizardConfig];
       return {
         ...prev,
         [key]: typeof existing === 'object' && existing !== null
           ? { ...existing, attivo: value }
           : { attivo: value },
       };
     });
   };
   ```

2. **Make `updateConfig` defensive** — guard `prev[key]`:
   ```typescript
   const updateConfig = <K extends keyof WizardConfig>(key: K, partial: Partial<WizardConfig[K]>) => {
     setConfig(prev => {
       const existing = prev[key];
       return {
         ...prev,
         [key]: typeof existing === 'object' && existing !== null
           ? { ...existing, ...partial }
           : { ...partial },
       };
     });
   };
   ```

3. **Make `prefillFromAnalisi` defensive** — already uses `?.` but add a null guard on `a`:
   ```typescript
   const prefillFromAnalisi = (a: AnalisiStanza) => {
     if (!a) return;
     setConfig(prev => ({ ... }));
   };
   ```

4. **Make `applyStile` defensive** — guard `mapped` properties:
   ```typescript
   const applyStile = (stile: ...) => {
     const mapped = mapPresetToWizard(stile.config as ..., config);
     setConfig(mapped);
     const nuoviAttivi: InterventiState = {
       verniciatura: mapped.verniciatura?.attivo ?? false,
       pavimento: mapped.pavimento?.attivo ?? false,
       // ... etc with ?. for all fields
     };
   };
   ```

5. **Guard render section for `analisi` access** — add extra null checks for `analisi?.pareti` in JSX (already has `analisi &&` guard, but ensure inner accesses are safe).

## Files
- **Edit**: `src/pages/app/RenderStanzaNew.tsx`

