# Places — robertodonzelli.it/places

Pagina fotografica minimale nello stile di [pengzhe.ng/places](https://pengzhe.ng/places):
una griglia di miniature e, sotto ogni scatto, **coordinate** e **persone**.
Ogni luogo può avere **più foto**: le scorri con lo swipe sulla miniatura e le
sfogli tutte nella lightbox con le frecce (o i tasti ← →).

È un sito **statico** (solo HTML/CSS/JS, nessun build, nessuna dipendenza).
Funziona ovunque e anche aprendo `index.html` con doppio clic.

## Struttura

```
index.html          la pagina
styles.css          stile (con tema chiaro/scuro automatico)
places.js           motore che genera la griglia (non serve toccarlo)
data/places.js      >>> QUI aggiungi le tue foto <<<
photos/             le immagini
```

## Aggiungere una foto

1. Metti l'immagine nella cartella `photos/` (es. `photos/milano.jpg`).
   Consiglio: lato lungo ~1200px, JPEG, così la pagina resta leggera.
2. Apri `data/places.js` e aggiungi un blocco all'inizio dell'elenco.

   Con **più foto** per lo stesso luogo (le scorri con lo swipe):

   ```js
   {
     photos: [
       "photos/milano-1.jpg",
       "photos/milano-2.jpg",
       "photos/milano-3.jpg"
     ],
     coords: [45.4642, 9.1900],        // [latitudine, longitudine]
     people: ["Roberto", "Anna"],
     where: "Duomo, Milano",
     date: "Giugno 2025"
   },
   ```

   Con **una sola foto**, in alternativa, usa `photo`:

   ```js
   { photo: "photos/napoli.jpg", coords: [40.8518, 14.2681], where: "Napoli" },
   ```

   Serve `photos` (o `photo`); gli altri campi sono facoltativi.
   Ricordati la virgola tra un blocco e l'altro.

### Trovare le coordinate
- **Google Maps**: clic destro sul punto → compaiono `lat, lng` da copiare.
- Oppure sono già nei dati **EXIF** della foto (se il GPS era attivo).

Le coordinate mostrate in pagina sono cliccabili e aprono OpenStreetMap.

## Pubblicare sotto `/places`

Il modo dipende dal tuo hosting. Tre opzioni comuni:

- **Hosting tradizionale (cPanel/FTP)**: carica tutto il contenuto di questa
  cartella dentro una sottocartella `places/` nella root del sito. Diventa
  `https://robertodonzelli.it/places/`.
- **Netlify / Vercel / Cloudflare Pages**: collega questo repository; è già
  pronto (nessun comando di build). Poi mappa il dominio.
- **GitHub Pages**: attiva Pages sul repository. Per servirlo esattamente su
  `/places`, tieni i file in una sottocartella `places/` oppure usa un
  sottodominio `places.robertodonzelli.it`.

> Nota: le foto segnaposto (`photos/placeholder-*.svg`) e le voci d'esempio in
> `data/places.js` servono solo a far vedere subito il layout. Sostituiscile
> con le tue foto e cancella gli esempi.
