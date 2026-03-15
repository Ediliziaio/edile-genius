
# Modifica testo Hero sezione

## Obiettivo
Aggiornare il badge e il paragrafo principale della sezione Hero con il nuovo copy fornito dall'utente.

## Modifiche

### `src/components/sections/Hero.tsx`

**1. Badge (riga 24)**
- Cambiare: `La 1ª Agenzia di Licenziamento AI per l'Edilizia Italiana`
- In: `La 1ª Azienda di Licenziamento AI per l'Edilizia Italiana`

**2. Paragrafo descrittivo (righe 38-42)**
- Sostituire il singolo `<motion.p>` con un `<motion.div>` contenente la struttura multi-paragrafo:
  - Primo paragrafo: "Mentre la tua impresa edile paga stipendi fissi a figure improduttive..."
  - Secondo paragrafo: "Edilizia.io è l'unica azienda che entra nella tua impresa..."
  - Terzo blocco (3 sotto-paragrafi evidenziati):
    - "Segretarie che filtrano male i lead..."
    - "Sostituiti. Con agenti che costano 10 volte meno..." (in evidenza, font-semibold)
    - "24 ore su 24. 365 giorni all'anno..."

**Struttura HTML:**
- Wrapper: `<motion.div variants={item} className="space-y-4 ...">`
- Paragrafi interni: `<p>` con spaziatura tramite `space-y-4` sul wrapper e `space-y-2` per il blocco finale
- Stili mantenuti: `text-base sm:text-lg text-neutral-500 max-w-[540px] leading-relaxed`
- Enfasi aggiuntiva: `font-semibold text-neutral-900` per il paragrafo "Sostituiti"

## File da modificare
- `src/components/sections/Hero.tsx`
