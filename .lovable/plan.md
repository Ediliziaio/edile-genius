

# Generazione Loghi AI per LogoBar

## Obiettivo
Generare 10 loghi fake realistici di aziende edili/fotovoltaico/infissi/impianti usando il modello AI di generazione immagini (Nano Banana), e integrarli nella LogoBar al posto delle icone Lucide attuali.

## Implementazione

### 1. Edge Function per generare i loghi
Creare una edge function `generate-logo` che chiama il modello `google/gemini-3.1-flash-image-preview` con prompt specifici per ogni azienda (es. "Minimal professional logo for Italian construction company called Costruzioni Marchetti, white background, clean vector style").

### 2. Salvataggio in Supabase Storage
Salvare i loghi generati in un bucket `logos` su Supabase Storage, così da non doverli rigenerare.

### 3. Aggiornamento LogoBar.tsx
Sostituire le icone Lucide con tag `<img>` che puntano ai loghi generati in Storage.

### Aziende per cui generare loghi:
| Nome | Settore |
|---|---|
| Costruzioni Marchetti | Edilizia |
| SolarTech Italia | Fotovoltaico |
| Finestre Italia | Infissi |
| Termoidraulica Verdi | Impianti |
| Edilgroup Roma | Edilizia |
| EnerSun Impianti | Fotovoltaico |
| Serramenti Bianchi | Infissi |
| CMB Edilizia | Edilizia |
| Rossi Costruzioni | Edilizia |
| ImpiantiPro | Impianti |

### File coinvolti
| File | Modifica |
|---|---|
| `supabase/functions/generate-logo/index.ts` | Nuova edge function per generare loghi via AI |
| `src/components/sections/LogoBar.tsx` | Usare immagini da Storage invece di icone Lucide |

### Approccio alternativo (più semplice)
Generare i loghi una tantum, salvarli come file statici in `src/assets/logos/` e referenziarli direttamente — evitando la complessità di Storage e edge function runtime.

