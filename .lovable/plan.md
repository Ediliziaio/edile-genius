

# Doccia e Vasca sempre configurabili

## Modifiche

### 1. UI — `src/pages/app/RenderBagnoNew.tsx`
- **Riga 777**: Rimuovere `{sostituzione.doccia && (` — mostrare sempre il pannello Doccia
- **Riga 827**: Rimuovere `{sostituzione.vasca && (` — mostrare sempre il pannello Vasca
- Aggiornare i titoli quando `sostituzione.doccia/vasca` è false: "🚿 Doccia (personalizza stile)" e "🛁 Vasca (personalizza stile)"
- Stessa logica già applicata per WC & Bidet

### 2. Edge Function — `supabase/functions/generate-bathroom-render/index.ts`

**Block B (riga 369-378)**: Aggiungere logica `UPGRADE TYPE` per doccia e vasca configurati senza toggle:
```
else if (el.key === "doccia" && (configDoccia.tipo || configDoccia.box)) {
  toChange.push(`🔄 UPGRADE TYPE: SHOWER`);
} else if (el.key === "vasca" && (configVasca.tipo || configVasca.azione === "sostituisci" || configVasca.azione === "rimuovi")) {
  toChange.push(`🔄 UPGRADE TYPE: BATHTUB`);
}
```

**Block E (riga 454)**: Rimuovere il check `!cfg.sostituzione?.doccia` dalla condizione di skip — generare sempre le specifiche se l'utente ha configurato tipo/box/piatto

**Block F (riga 491)**: Rimuovere il check `!cfg.sostituzione?.vasca` dalla condizione di skip — generare sempre le specifiche se l'utente ha configurato tipo/forma/materiale

### 3. Redeploy Edge Function

