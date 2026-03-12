

# Render Infissi v3 — Aggiornamento Prompt e UI (v3.0.0-r2)

## Situazione attuale

Il sistema v3 e' gia' implementato con sostituzione selettiva, cassonetti, tapparelle e cerniere. Il documento caricato (v2) contiene **testi prompt piu' dettagliati** e **piccole differenze UI**. Le strutture dati e la logica sono identiche.

## Differenze individuate

### 1. `promptBuilder.ts` — Testi dizionari piu' dettagliati

I dizionari `MATERIAL_PHYSICS`, `APERTURA_DESCRIPTION`, `CASSONETTO_MATERIAL_DESC`, `TAPPARELLA_DESC`, `CERNIERA_DESC` nel documento hanno descrizioni significativamente piu' lunghe e tecniche rispetto all'implementazione attuale. Esempio:

- Attuale `battente_2_ante`: ~40 parole
- Documento: ~80 parole con dettagli su gasket, espagnolette bolt, rebate

Stessa cosa per i blocchi E (hinge placement rule piu' dettagliato), G (espagnolette, strikeplate, corner connectors), H (side flanges, shadow casting), I (stati tapparella piu' descrittivi), J/K/L (piu' vincoli specifici).

### 2. `generate-render/index.ts` — Stessi dizionari inline piu' dettagliati

I dizionari inline nella edge function sono versioni abbreviate. Vanno allineati con i testi completi del documento.

### 3. `RenderNew.tsx` — Layout UI leggermente diverso

- Documento usa **toggle full-width** (w-full flex con checkbox) per la selezione sostituzione, attuale usa **grid-cols-3**
- Documento usa `border-l-2 border-primary/20 pl-4` per sezioni cassonetto/tapparella, attuale usa `border-t pt-4`
- Documento ha `StructuralChangeBox` dentro la sezione infissi (dopo l'header), attuale lo ha gia' li'

### 4. `analyze-window-photo/index.ts` — Prompt analisi piu' strutturato

Il documento specifica un prompt JSON con valori enum espliciti e descrizioni piu' precise per ogni campo. L'implementazione attuale usa gia' questi campi ma con un formato leggermente diverso.

## Piano di implementazione

| File | Modifica |
|------|----------|
| `src/modules/render/lib/promptBuilder.ts` | Aggiornare i 5 dizionari con testi completi dal documento + aggiornare blocchi E, G, H, I, J, K, L |
| `supabase/functions/generate-render/index.ts` | Allineare dizionari inline con versioni complete |
| `src/pages/app/RenderNew.tsx` | Cambiare layout sostituzione da grid-cols-3 a toggle full-width con checkbox + border-l-2 per sotto-sezioni |
| `supabase/functions/analyze-window-photo/index.ts` | Aggiornare prompt JSON con formato strutturato dal documento |

## Impatto

Nessuna modifica strutturale a tipi, interfacce o logica. Solo aggiornamento di testi prompt per maggiore accuratezza nei render e piccoli aggiustamenti UI.

