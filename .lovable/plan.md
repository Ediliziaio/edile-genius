

# Social Share + Reading Progress + forwardRef Fix

## 1. Pulsanti di condivisione social su BlogPost

Aggiungere 3 pulsanti (LinkedIn, WhatsApp, X/Twitter) dopo i tag e prima dell'hero image in `BlogPost.tsx`. Usano URL nativi di sharing (nessuna dipendenza esterna):

- LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=...`
- WhatsApp: `https://wa.me/?text=...`
- X: `https://twitter.com/intent/tweet?url=...&text=...`

I pulsanti si ripetono anche in fondo all'articolo (dopo le FAQ, prima del CTA) per catturare chi ha finito di leggere.

Icone: Lucide non ha icone social native — useremo SVG inline leggeri per LinkedIn, WhatsApp e X (Twitter).

## 2. Reading Progress Bar

Importare `ScrollProgress` in `BlogPost.tsx` e renderizzarlo subito dopo `<Navbar />`. Il componente esiste già, basta posizionarlo correttamente. Aggiustare `top` da `112px` a `68px` (altezza navbar) nel componente `ScrollProgress.tsx`.

## 3. Warning forwardRef

I warning derivano da framer-motion v12 che ha deprecato `forwardRef` sui `motion.*` components. Non sono bug dell'app — sono warning interni della libreria. Non richiedono intervento e spariranno con futuri aggiornamenti di framer-motion.

## File da modificare

| File | Modifica |
|------|----------|
| `src/pages/BlogPost.tsx` | Aggiungere import ScrollProgress, pulsanti social share (top + bottom), componente ScrollProgress dopo Navbar |
| `src/components/custom/ScrollProgress.tsx` | Cambiare `top-[112px]` → `top-[68px]` per allineare alla navbar |

