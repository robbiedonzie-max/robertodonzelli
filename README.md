# Places — robertodonzelli.it/places

Pagina fotografica minimale nello stile di [pengzhe.ng/places](https://pengzhe.ng/places):
una griglia di miniature e, sotto ogni scatto, **coordinate** e **persone**.
Ogni luogo può avere **più foto**: le scorri con lo swipe sulla miniatura e le
sfogli tutte nella lightbox con le frecce (o i tasti ← →).

È un sito **statico** (solo HTML/CSS/JS, nessun build, nessuna dipendenza).
Funziona ovunque e anche aprendo `places/index.html` con doppio clic.

La pagina vive **solo** su `robertodonzelli.it/places`: tutti i file stanno nella
cartella `places/`, così la root del dominio resta libera per una futura homepage.

## Struttura

```
places/
  index.html        la pagina
  styles.css        stile (con tema chiaro/scuro automatico)
  places.js         motore che genera la griglia (non serve toccarlo)
  data/places.js    >>> QUI aggiungi le tue foto <<<
  photos/           le immagini
vercel.json         configurazione Vercel
```

## Aggiungere una foto

1. Metti l'immagine nella cartella `places/photos/` (es. `places/photos/milano.jpg`).
   Consiglio: lato lungo ~1200px, JPEG, così la pagina resta leggera.
2. Apri `places/data/places.js` e aggiungi un blocco all'inizio dell'elenco.
   I percorsi delle foto sono relativi a `places/`, quindi `"photos/milano.jpg"`.

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

### Vercel (consigliato — come winefoodfan)

Il repo è già pronto per Vercel: nessun build, nessuna dipendenza. La pagina è
servita **solo** su `/places`; la root del dominio resta libera.

1. Vai su [vercel.com/new](https://vercel.com/new) e importa il repository
   `robbiedonzie-max/robertodonzelli`.
2. **Framework Preset: Other**, **Build Command: vuoto**, **Output Directory: vuoto**
   (Vercel serve i file dalla root del repo). Clic su **Deploy**.
3. **Settings → Domains**: aggiungi `robertodonzelli.it` (e `www`), poi imposta
   nel tuo registrar i record DNS che Vercel indica (A / CNAME).
4. La pagina sarà su `https://robertodonzelli.it/places`.
   La root `https://robertodonzelli.it/` non mostra nulla finché non aggiungi
   una homepage (un `index.html` nella root del repo).

Ogni `git push` sul branch principale ripubblica il sito automaticamente.

### Altre opzioni

- **Hosting tradizionale (cPanel/FTP)**: carica la cartella `places/` nella root
  del sito → `https://robertodonzelli.it/places/`.
- **Netlify / Cloudflare Pages**: collega il repository; è già pronto (nessun
  comando di build), poi mappa il dominio.
- **GitHub Pages**: attiva Pages sul repository.

> Nota: le foto segnaposto (`places/photos/placeholder-*.svg`) e le voci
> d'esempio in `places/data/places.js` servono solo a far vedere subito il
> layout. Sostituiscile con le tue foto e cancella gli esempi.
