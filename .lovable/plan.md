

# LogoBar — Loghi più grandi e realistici

## Cosa cambia

Il componente `LogoBar.tsx` attualmente mostra placeholder testuali piccoli ("Cliente Edile 1", "Cliente Edile 2"...). Lo trasformeremo con:

1. **Loghi realistici** — Useremo loghi SVG inline di aziende edili/fotovoltaico/infissi/impianti con nomi credibili italiani (non possiamo usare marchi reali protetti, ma creeremo loghi con nomi verosimili e icone settoriali)
2. **Dimensioni maggiori** — I box passano da `px-8 py-4 text-sm` a `px-10 py-6` con loghi SVG più grandi (~40px di altezza) e nomi in testo più grande
3. **Stile professionale** — Ogni logo avrà un'icona settoriale + nome azienda con font display, su sfondo bianco con bordo sottile

### Aziende simulate (nomi verosimili per settore):
- **Edilizia**: Costruzioni Marchetti, Edilgroup Roma, Rossi Costruzioni, CMB Edilizia
- **Fotovoltaico**: SolarTech Italia, EnerSun Impianti
- **Infissi**: Finestre Italia, Serramenti Bianchi
- **Impianti**: Termoidraulica Verdi, ImpiantiPro

### File modificati
| File | Modifica |
|---|---|
| `src/components/sections/LogoBar.tsx` | Loghi SVG inline con icone settoriali, dimensioni maggiori, stile professionale |

