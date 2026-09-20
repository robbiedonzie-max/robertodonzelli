// places.js — genera la griglia a partire da window.PLACES (definito in data/places.js).
// Non serve modificare questo file per aggiungere foto: cambia solo data/places.js.
//
// Ogni luogo puo' avere PIU' foto: usa il campo "photos" (array). Sulla miniatura
// le scorri con swipe/trackpad; il clic apre la lightbox e le sfogli tutte.

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

  // Normalizza: accetta sia "photo" (singola) sia "photos" (array).
  function photosOf(p) {
    if (Array.isArray(p.photos) && p.photos.length) return p.photos;
    if (p.photo) return [p.photo];
    return [];
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

  function makeImg(src, alt) {
    var img = el("img");
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = alt || "";
    img.src = src;
    img.addEventListener("load", function () { img.classList.add("is-loaded"); });
    img.addEventListener("error", function () { img.classList.add("is-loaded"); img.style.opacity = "0"; });
    return img;
  }

  // --- Costruzione di una singola scheda (con carosello swipe) ---
  function buildPlace(p, placeIndex) {
    var imgs = photosOf(p);
    var fig = el("figure", "place");
    var label = p.where || peopleText(p.people) || "foto";

    var carousel = el("div", "carousel");

    var strip = el("div", "carousel__strip");
    strip.setAttribute("role", "group");
    strip.setAttribute("aria-label", label + " — " + imgs.length + (imgs.length === 1 ? " foto" : " foto, scorri"));

    imgs.forEach(function (src, i) {
      var slide = el("button", "carousel__slide");
      slide.type = "button";
      slide.setAttribute("aria-label", "Ingrandisci " + label + " (" + (i + 1) + " di " + imgs.length + ")");
      slide.appendChild(makeImg(src, p.alt || label));
      slide.addEventListener("click", function () { openLightbox(imgs, i, p); });
      strip.appendChild(slide);
    });
    carousel.appendChild(strip);

    // Contatore + puntini solo se piu' di una foto
    if (imgs.length > 1) {
      var counter = el("span", "carousel__counter", "1 / " + imgs.length);
      carousel.appendChild(counter);

      var dots = el("div", "carousel__dots");
      var dotEls = imgs.map(function (_, i) {
        var d = el("button", "carousel__dot" + (i === 0 ? " is-active" : ""));
        d.type = "button";
        d.setAttribute("aria-label", "Vai alla foto " + (i + 1));
        d.addEventListener("click", function () {
          strip.scrollTo({ left: i * strip.clientWidth, behavior: "smooth" });
        });
        dots.appendChild(d);
        return d;
      });
      carousel.appendChild(dots);

      var raf = null;
      strip.addEventListener("scroll", function () {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var idx = Math.round(strip.scrollLeft / strip.clientWidth);
          idx = Math.max(0, Math.min(imgs.length - 1, idx));
          counter.textContent = (idx + 1) + " / " + imgs.length;
          dotEls.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
        });
      });
    }

    fig.appendChild(carousel);

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

  // --- Lightbox con navigazione tra le foto del luogo ---
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lightbox-img");
  var lbCap = document.getElementById("lightbox-caption");
  var lbClose = lb ? lb.querySelector(".lightbox__close") : null;
  var lbPrev = lb ? lb.querySelector(".lightbox__nav--prev") : null;
  var lbNext = lb ? lb.querySelector(".lightbox__nav--next") : null;

  var lbGroup = [];
  var lbIndex = 0;
  var lbPlace = null;

  function renderLightbox() {
    if (!lb || !lbGroup.length) return;
    lbImg.src = lbGroup[lbIndex];
    lbImg.alt = (lbPlace && (lbPlace.alt || lbPlace.where)) || "";

    lbCap.innerHTML = "";
    var coordsStr = formatCoords(lbPlace && lbPlace.coords);
    if (coordsStr) {
      var a = document.createElement("a");
      a.href = mapUrl(lbPlace.coords);
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = coordsStr;
      lbCap.appendChild(a);
    }
    var extra = [peopleText(lbPlace && lbPlace.people), lbPlace && lbPlace.where, lbPlace && lbPlace.date]
      .filter(Boolean).join("  ·  ");
    if (extra) {
      if (coordsStr) lbCap.appendChild(document.createTextNode("  —  "));
      lbCap.appendChild(document.createTextNode(extra));
    }
    if (lbGroup.length > 1) {
      lbCap.appendChild(document.createTextNode("   [" + (lbIndex + 1) + "/" + lbGroup.length + "]"));
    }

    var multi = lbGroup.length > 1;
    if (lbPrev) lbPrev.style.display = multi ? "" : "none";
    if (lbNext) lbNext.style.display = multi ? "" : "none";
  }

  function openLightbox(group, index, place) {
    if (!lb) return;
    lbGroup = group.slice();
    lbIndex = index || 0;
    lbPlace = place;
    renderLightbox();
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function step(delta) {
    if (!lbGroup.length) return;
    lbIndex = (lbIndex + delta + lbGroup.length) % lbGroup.length;
    renderLightbox();
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lbPrev) lbPrev.addEventListener("click", function () { step(-1); });
  if (lbNext) lbNext.addEventListener("click", function () { step(1); });
  if (lb) lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (!lb || !lb.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });

  // --- Render ---
  if (grid) {
    if (places.length === 0) {
      grid.appendChild(el("p", "lede", "Ancora nessuna foto. Aggiungine una in data/places.js."));
    } else {
      var frag = document.createDocumentFragment();
      places.forEach(function (p, i) { frag.appendChild(buildPlace(p, i)); });
      grid.appendChild(frag);
    }
  }
})();
