

# Ristrutturare la pagina /tariffe con pricing completo

## Panoramica

Riscrivere completamente `src/pages/Tariffe.tsx` per implementare le 7 sezioni richieste. La pagina attuale ha ~560 righe con calcolatore ROI e piani senza prezzi. La nuova versione avrà prezzi espliciti, toggle moduli/pacchetti, tabella comparativa, FAQ e nuovo calcolatore.

**Non** creare una nuova route `/pricing` — integriamo tutto nella pagina `/tariffe` esistente.

## Struttura delle 7 sezioni

### Sezione 1: Hero Pricing
- Headline e sottotitolo come da brief
- Badge con "Nessun vincolo · Disdici quando vuoi · Setup in 48 ore"
- Toggle `useState<"pacchetti" | "moduli">("pacchetti")` per switchare tra le due viste pricing

### Sezione 2: Pricing Cards — Pacchetti Completi (default visibile)
- 4 card: Essenziale (€297), Crescita (€497, "Più Popolare" con bordo primario), Dominio (€997), Enterprise (Su Misura)
- Layout: griglia `md:grid-cols-2 lg:grid-cols-4`, stack su mobile
- CTA "Prenota una Demo" → link a `#cta-finale`

### Sezione 3: Pricing Cards — Moduli Singoli (visibile con toggle)
- 5 card: Agente Vocale (€147), Render AI (€67), Preventivatore (€47), Rapportini (€37), WhatsApp AI (€47)
- Layout: `md:grid-cols-3 lg:grid-cols-5` o `grid-cols-2 lg:grid-cols-3` + row
- Nota "Consiglio" con link che switcha il toggle a pacchetti
- Icone Lucide: `Phone`, `Image`, `FileText`, `ClipboardList`, `MessageCircle`

### Sezione 4: Tabella Comparativa
- Tabella responsive con colonne: Feature, Essenziale, Crescita (evidenziata), Dominio, Enterprise
- Su mobile: scroll orizzontale con prima colonna sticky
- Check verdi (✓) e trattini grigi (—)

### Sezione 5: Calcolatore ROI (adattato dal brief)
- 3 slider: lead/mese (50-500, default 150), chiamate perse/giorno (2-20, default 5), valore commessa (€2.000-€25.000, default €8.000)
- Output: costo dipendente €2.500 fisso, costo Edil Genius consigliato, risparmio annuo, opportunità recuperate
- CTA grande

### Sezione 6: Social Proof + FAQ
- Barra numeri: 33+ aziende, €42M+ fatturato, 6 anni, 24/7
- FAQ accordion con le 7 domande dal brief, usando `Accordion` di shadcn

### Sezione 7: CTA Finale
- Banner scuro con headline, sottotitolo, CTA grande bianco, nota sotto

## Dettagli tecnici

- **File da modificare**: `src/pages/Tariffe.tsx` (riscrittura completa)
- **SEO**: title "Prezzi e Tariffe — Edil Genius | AI per Imprese Edili", description aggiornata
- **Componenti usati**: `Slider`, `Card`, `Button`, `Badge`, `Accordion`, `Table`, `Switch` (per toggle), icone Lucide
- **Animazioni**: mantenere `framer-motion` con `useInView` come pattern esistente
- **Toggle**: transizione smooth con `AnimatePresence` tra le due viste pricing
- **Navbar/Footer**: mantiene Navbar e Footer esistenti

