

# Fix: KEEP → modernizza ma non cambiare tipo di elemento

## Problema
Attualmente il Block B dice `🚫 KEEP EXACTLY` per gli elementi non selezionati, il che impedisce all'AI di migliorarli esteticamente. L'utente vuole che gli elementi non selezionati vengano **modernizzati/armonizzati** con il nuovo stile, ma **senza cambiare il tipo di sanitario** (es. un bidet deve restare un bidet, non diventare una vasca).

## Soluzione
Modificare il Block B in `supabase/functions/generate-bathroom-render/index.ts` per introdurre una terza categoria:

- `✅ REPLACE` — elementi selezionati dall'utente per la sostituzione completa
- `🔄 MODERNIZE (keep type)` — elementi non selezionati: possono essere aggiornati esteticamente (stile, colore, finitura più moderna) ma il **tipo di oggetto deve restare identico** (WC resta WC, bidet resta bidet, vasca resta vasca)

### Modifica concreta (Block B, righe 366-379)

```
for (const el of elements) {
  if (s[el.key]) toChange.push(`✅ REPLACE: ${el.label} — full replacement per user specification`);
  else toModernize.push(`🔄 MODERNIZE (keep type): ${el.label}`);
}
```

Testo aggiornato:
```
ELEMENTS THAT SHOULD BE MODERNIZED BUT KEEP THEIR TYPE:
${toModernize.join("\n")}

CRITICAL RULE: Elements marked "MODERNIZE" may be updated to a cleaner, more modern
version that harmonizes with the new design — but the CATEGORY of object must NOT change.
A toilet must remain a toilet. A bidet must remain a bidet. A bathtub must remain a bathtub.
Do NOT add, remove, or swap fixture types. Only improve their aesthetic appearance.
```

### File
- `supabase/functions/generate-bathroom-render/index.ts` — modifica Block B + redeploy

