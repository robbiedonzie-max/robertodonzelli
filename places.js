// places.js — genera la griglia a partire da window.PLACES (definito in data/places.js).
// Non serve modificare questo file per aggiungere foto: cambia solo data/places.js.

(function () {
  "use strict";

  var places = Array.isArray(window.PLACES) ? window.PLACES.slice() : [];
  var grid = document.getElementById("grid");
  var countEl = document.getElementById("count");
  var yearEl = document.getElementById("year");

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  if (countEl) {
    countEl.textContent = places.length + (places.length === 1 ? " luogo" : " luoghi");
  }

  // --- Formattazione coordinate: [lat, lng] -> "45.4642° N, 9.1900° E" ---
  function formatCoords(coords) {
    if (!Array.isArray(coords) || coords.length < 2) return "";
    var lat = Number(coords[0]);
    var lng = Number(coords[1]);
    if (isNaN(lat) || isNaN(lng)) return "";
    var ns = lat >= 0 ? "N" : "S";
    var ew = lng >= 0 ? "E" : "W";
    return Math.abs(lat).toFixed(4) + "° " + ns + ", " +
           Math.abs(lng).toFixed(4) + "° " + ew;
  }

  function mapUrl(coords) {
    return "https://www.openstreetmap.org/?mlat=" + coords[0] +
           "&mlon=" + coords[1] + "#map=13/" + coords[0] + "/" + coords[1];
  }

  function peopleText(people) {
    if (!people) return "";
    if (Array.isArray(people)) return people.join(", ");
    return String(people);
  }

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  // --- Costruzione di una singola scheda ---
  function buildPlace(p) {
    var fig = el("figure", "place");

    var btn = el("button", "place__thumb");
    btn.type = "button";
    btn.setAttribute("aria-label", "Ingrandisci: " + (p.where || peopleText(p.people) || "foto"));

    var img = el("img");
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = p.alt || p.where || peopleText(p.people) || "";
    img.src = p.photo;
    img.addEventListener("load", function () { img.classList.add("is-loaded"); });
    // se manca l'immagine, la mostriamo comunque come area vuota (nessun crash)
    img.addEventListener("error", function () { img.classList.add("is-loaded"); img.style.opacity = "0"; });
    btn.appendChild(img);

    btn.addEventListener("click", function () { openLightbox(p, img.src); });
    fig.appendChild(btn);

    var meta = el("figcaption", "place__meta");

    var coordsStr = formatCoords(p.coords);
    if (coordsStr) {
      var a = el("a", "place__coords", coordsStr);
      a.href = mapUrl(p.coords);
      a.target = "_blank";
      a.rel = "noopener";
      meta.appendChild(a);
    }

    var ppl = peopleText(p.people);
    if (ppl) meta.appendChild(el("div", "place__people", ppl));
    if (p.where) meta.appendChild(el("div", "place__where", p.where));
    if (p.date) meta.appendChild(el("div", "place__date", p.date));

    fig.appendChild(meta);
    return fig;
  }

  // --- Lightbox ---
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lightbox-img");
  var lbCap = document.getElementById("lightbox-caption");
  var lbClose = lb ? lb.querySelector(".lightbox__close") : null;

  function openLightbox(p, src) {
    if (!lb) return;
    lbImg.src = src;
    lbImg.alt = p.alt || p.where || "";
    lbCap.innerHTML = "";
    var coordsStr = formatCoords(p.coords);
    if (coordsStr) {
      var a = document.createElement("a");
      a.href = mapUrl(p.coords);
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = coordsStr;
      lbCap.appendChild(a);
    }
    var extra = [peopleText(p.people), p.where, p.date].filter(Boolean).join("  ·  ");
    if (extra) {
      if (coordsStr) lbCap.appendChild(document.createTextNode("  —  "));
      lbCap.appendChild(document.createTextNode(extra));
    }
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lb) lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
  });

  // --- Render ---
  if (grid) {
    if (places.length === 0) {
      var empty = el("p", "lede", "Ancora nessuna foto. Aggiungine una in data/places.js.");
      grid.appendChild(empty);
    } else {
      var frag = document.createDocumentFragment();
      places.forEach(function (p) { frag.appendChild(buildPlace(p)); });
      grid.appendChild(frag);
    }
  }
})();
