

# Mostrare il visual "Dashboard Card" su tutti i dispositivi

## Problema
Il blocco visuale a destra (card "Dipendenti Sostituiti" + floating pills + waveform) ha la classe `hidden lg:block`, quindi è invisibile su mobile e tablet.

## Soluzione

### `src/components/sections/Hero.tsx`

1. **Rimuovere `hidden lg:block`** dal wrapper del visual, rendendolo sempre visibile
2. **Adattare il layout** per mobile: sotto il testo (già gestito dal grid `lg:grid-cols-[55%_45%]` che su mobile diventa 1 colonna)
3. **Ridimensionare su mobile**: padding e font più compatti, floating pills riposizionati per non uscire dal viewport
4. **Floating pills**: su mobile usare posizioni meno aggressive (rimuovere `-right-4`, `-left-8` su small screens con classi responsive tipo `right-0 sm:-right-4`)
5. **Blob blur**: ridurre dimensione su mobile per evitare overflow

Modifiche concentrate in un solo file, puramente CSS/classi Tailwind responsive.

