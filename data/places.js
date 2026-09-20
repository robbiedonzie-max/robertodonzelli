/* =========================================================================
   I TUOI LUOGHI
   -------------------------------------------------------------------------
   Questo è l'UNICO file da modificare per aggiungere una foto.

   Per ogni foto aggiungi un blocco { ... } dentro l'elenco qui sotto.
   Campi:
     photo   : percorso dell'immagine, es. "photos/milano.jpg"   (obbligatorio)
     coords  : [latitudine, longitudine] in gradi decimali        (opzionale)
               es. Milano = [45.4642, 9.1900]
     people  : elenco di persone, es. ["Roberto", "Anna"]         (opzionale)
     where   : nome del luogo, es. "Duomo, Milano"                (opzionale)
     date    : data/testo libero, es. "Giugno 2025"               (opzionale)
     alt     : descrizione per l'accessibilità                    (opzionale)

   Le foto più recenti in cima. Ricordati la virgola tra un blocco e l'altro.

   Come trovare le coordinate: apri Google Maps, clic destro sul punto ->
   compaiono lat e lng da copiare. Oppure sono già nei dati EXIF della foto.
   ========================================================================= */

window.PLACES = [
  {
    photo: "photos/placeholder-1.svg",
    coords: [45.4641, 9.1919],
    people: ["Roberto"],
    where: "Duomo, Milano",
    date: "Esempio — sostituisci con la tua foto"
  },
  {
    photo: "photos/placeholder-2.svg",
    coords: [43.7696, 11.2558],
    people: ["Roberto", "Amici"],
    where: "Ponte Vecchio, Firenze",
    date: "Esempio"
  },
  {
    photo: "photos/placeholder-3.svg",
    coords: [40.8518, 14.2681],
    people: ["Roberto"],
    where: "Lungomare, Napoli",
    date: "Esempio"
  }
];
