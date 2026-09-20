/* =========================================================================
   I TUOI LUOGHI
   -------------------------------------------------------------------------
   Questo è l'UNICO file da modificare per aggiungere una foto.

   Per ogni foto aggiungi un blocco { ... } dentro l'elenco qui sotto.
   Campi:
     photos  : elenco di foto del luogo (le scorri con swipe),     (obbligatorio*)
               es. ["photos/milano-1.jpg", "photos/milano-2.jpg"]
     photo   : una singola foto, se ne hai una sola                (*in alternativa)
     coords  : [latitudine, longitudine] in gradi decimali        (opzionale)
               es. Milano = [45.4642, 9.1900]
     people  : elenco di persone, es. ["Roberto", "Anna"]         (opzionale)
     where   : nome del luogo, es. "Duomo, Milano"                (opzionale)
     date    : data/testo libero, es. "Giugno 2025"               (opzionale)
     alt     : descrizione per l'accessibilità                    (opzionale)

   * Usa "photos" (array) per piu' foto per luogo, oppure "photo" per una sola.

   Le foto più recenti in cima. Ricordati la virgola tra un blocco e l'altro.

   Come trovare le coordinate: apri Google Maps, clic destro sul punto ->
   compaiono lat e lng da copiare. Oppure sono già nei dati EXIF della foto.
   ========================================================================= */

window.PLACES = [
  {
    photo: "photos/image_1338.jpg",
    coords: [38.985732, 1.210292],
    people: ["Roberto", "Barbara", "Rebbecca", "Giulia"],
    where: "sa Conillera, Sant Josep de sa Talaia",
    date: "31 agosto 2026"
  }
];
