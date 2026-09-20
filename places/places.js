// places.js — genera la griglia leggendo i luoghi da data/places.json.
// I dati sono gestiti dal pannello admin (/places/admin) oppure a mano nel JSON.

(function () {
  "use strict";

  var grid = document.getElementById("grid");
  var countEl = document.getElementById("count");
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // --- Normalizzazione dati ---
  function photosOf(p) {
    var list = [];
    if (Array.isArray(p.photos)) {
      p.photos.forEach(function (x) {
        if (typeof x === "string") list.push(x);
        else if (x && x.src) list.push(x.src); // tollera {src: "..."}
      });
    }
    if (!list.length && p.photo) list.push(p.photo);
    return list;
  }

  function coordsOf(p) {
    if (Array.isArray(p.coords) && p.coords.length >= 2) return [Number(p.coords[0]), Number(p.coords[1])];
    if (p.lat != null && p.lng != null) return [Number(p.lat), Number(p.lng)];
    return null;
  }

  function formatCoords(c) {
    if (!c) return "";
    var lat = c[0], lng = c[1];
    if (isNaN(lat) || isNaN(lng)) return "";
    var ns = lat >= 0 ? "N" : "S", ew = lng >= 0 ? "E" : "W";
    return Math.abs(lat).toFixed(4) + "° " + ns + ", " + Math.abs(lng).toFixed(4) + "° " + ew;
  }

  function mapUrl(c) {
    return "https://www.openstreetmap.org/?mlat=" + c[0] + "&mlon=" + c[1] + "#map=13/" + c[0] + "/" + c[1];
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
    img.loading = "lazy"; img.decoding = "async"; img.alt = alt || ""; img.src = src;
    img.addEventListener("load", function () { img.classList.add("is-loaded"); });
    img.addEventListener("error", function () { img.classList.add("is-loaded"); img.style.opacity = "0"; });
    return img;
  }

  // --- Scheda con carosello ---
  function buildPlace(p) {
    var imgs = photosOf(p);
    var coords = coordsOf(p);
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
      slide.addEventListener("click", function () { openLightbox(imgs, i, p, coords); });
      strip.appendChild(slide);
    });
    carousel.appendChild(strip);

    if (imgs.length > 1) {
      var counter = el("span", "carousel__counter", "1 / " + imgs.length);
      carousel.appendChild(counter);
      var dots = el("div", "carousel__dots");
      var dotEls = imgs.map(function (_, i) {
        var d = el("button", "carousel__dot" + (i === 0 ? " is-active" : ""));
        d.type = "button"; d.setAttribute("aria-label", "Vai alla foto " + (i + 1));
        d.addEventListener("click", function () { strip.scrollTo({ left: i * strip.clientWidth, behavior: "smooth" }); });
        dots.appendChild(d); return d;
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
    var coordsStr = formatCoords(coords);
    if (coordsStr) {
      var a = el("a", "place__coords", coordsStr);
      a.href = mapUrl(coords); a.target = "_blank"; a.rel = "noopener";
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
  var lbPrev = lb ? lb.querySelector(".lightbox__nav--prev") : null;
  var lbNext = lb ? lb.querySelector(".lightbox__nav--next") : null;
  var lbGroup = [], lbIndex = 0, lbPlace = null, lbCoords = null;

  function renderLightbox() {
    if (!lb || !lbGroup.length) return;
    lbImg.src = lbGroup[lbIndex];
    lbImg.alt = (lbPlace && (lbPlace.alt || lbPlace.where)) || "";
    lbCap.innerHTML = "";
    var coordsStr = formatCoords(lbCoords);
    if (coordsStr) {
      var a = document.createElement("a");
      a.href = mapUrl(lbCoords); a.target = "_blank"; a.rel = "noopener"; a.textContent = coordsStr;
      lbCap.appendChild(a);
    }
    var extra = [peopleText(lbPlace && lbPlace.people), lbPlace && lbPlace.where, lbPlace && lbPlace.date]
      .filter(Boolean).join("  ·  ");
    if (extra) {
      if (coordsStr) lbCap.appendChild(document.createTextNode("  —  "));
      lbCap.appendChild(document.createTextNode(extra));
    }
    if (lbGroup.length > 1) lbCap.appendChild(document.createTextNode("   [" + (lbIndex + 1) + "/" + lbGroup.length + "]"));
    var multi = lbGroup.length > 1;
    if (lbPrev) lbPrev.style.display = multi ? "" : "none";
    if (lbNext) lbNext.style.display = multi ? "" : "none";
  }
  function openLightbox(group, index, place, coords) {
    if (!lb) return;
    lbGroup = group.slice(); lbIndex = index || 0; lbPlace = place; lbCoords = coords;
    renderLightbox();
    lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function step(delta) { if (!lbGroup.length) return; lbIndex = (lbIndex + delta + lbGroup.length) % lbGroup.length; renderLightbox(); }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); document.body.style.overflow = "";
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

  // --- Caricamento dati ---
  function render(places) {
    if (countEl) countEl.textContent = places.length + (places.length === 1 ? " luogo" : " luoghi");
    if (!grid) return;
    grid.innerHTML = "";
    if (!places.length) {
      grid.appendChild(el("p", "lede", "Ancora nessuna foto."));
      return;
    }
    var frag = document.createDocumentFragment();
    places.forEach(function (p) { frag.appendChild(buildPlace(p)); });
    grid.appendChild(frag);
  }

  fetch("data/places.json", { cache: "no-cache" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var places = Array.isArray(data) ? data : (data && Array.isArray(data.luoghi) ? data.luoghi : []);
      render(places);
    })
    .catch(function () {
      if (grid) { grid.innerHTML = ""; grid.appendChild(el("p", "lede", "Impossibile caricare i luoghi.")); }
    });
})();
