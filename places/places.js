// places.js — genera la griglia leggendo i luoghi da data/places.json.
// Ogni foto puo' avere una versione chiara e una scura; il tema (chiaro/scuro)
// cambia sfondo e versione mostrata. I dati si gestiscono dal pannello /places/admin.

(function () {
  "use strict";

  var grid = document.getElementById("grid");
  var countEl = document.getElementById("count");
  var yearEl = document.getElementById("year");
  var toggle = document.getElementById("theme-toggle");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // --- Tema ---
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("places-theme", t); } catch (e) {}
    applyTheme(t);
  }

  // --- Normalizzazione percorsi ---
  function resolvePhoto(src) {
    if (!src || /^https?:\/\//i.test(src) || /^data:/i.test(src)) return src || "";
    var s = src.replace(/^\/+/, "");
    if (s.indexOf("places/photos/") === 0) s = s.slice("places/".length);
    return s;
  }

  // Ogni foto -> { light, dark } (con fallback reciproco)
  function toPair(x) {
    if (typeof x === "string") { var s = resolvePhoto(x); return { light: s, dark: s }; }
    if (x && (x.light || x.dark || x.src)) {
      var l = resolvePhoto(x.light || x.src || x.dark);
      var d = resolvePhoto(x.dark || x.src || x.light);
      return { light: l, dark: d };
    }
    return null;
  }
  function photosOf(p) {
    var out = [];
    if (Array.isArray(p.photos)) p.photos.forEach(function (x) { var pair = toPair(x); if (pair && (pair.light || pair.dark)) out.push(pair); });
    if (!out.length && p.photo) { var one = toPair(p.photo); if (one) out.push(one); }
    return out;
  }
  function variantSrc(pair, theme) {
    return theme === "dark" ? (pair.dark || pair.light) : (pair.light || pair.dark);
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
  function mapUrl(c) { return "https://www.openstreetmap.org/?mlat=" + c[0] + "&mlon=" + c[1] + "#map=13/" + c[0] + "/" + c[1]; }
  function peopleText(people) { return !people ? "" : (Array.isArray(people) ? people.join(", ") : String(people)); }

  // --- Data: formattazione e ordinamento ---
  var MESI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
  function formatDate(d) {
    if (!d) return "";
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
    if (m) return parseInt(m[3], 10) + " " + MESI[parseInt(m[2], 10) - 1] + " " + m[1];
    return d; // testo libero: mostrato com'è
  }
  function dateTs(d) {
    if (!d) return -Infinity;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    var it = /(\d{1,2})\s+([a-zàèéìòù]+)\s+(\d{4})/i.exec(d);
    if (it) { var mi = MESI.indexOf(it[2].toLowerCase()); if (mi >= 0) return Date.UTC(+it[3], mi, +it[1]); }
    return -Infinity; // senza data valida → in fondo
  }

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function makeImg(pair, alt) {
    var img = el("img");
    img.loading = "lazy"; img.decoding = "async"; img.alt = alt || "";
    img.dataset.light = pair.light || pair.dark || "";
    img.dataset.dark = pair.dark || pair.light || "";
    img.src = variantSrc(pair, currentTheme());
    img.addEventListener("load", function () { img.classList.add("is-loaded"); });
    img.addEventListener("error", function () { img.classList.add("is-loaded"); img.style.opacity = "0"; });
    return img;
  }

  function buildPlace(p) {
    var pairs = photosOf(p);
    var coords = coordsOf(p);
    var fig = el("figure", "place");
    var label = p.where || peopleText(p.people) || "foto";

    var carousel = el("div", "carousel");
    var strip = el("div", "carousel__strip");
    strip.setAttribute("role", "group");
    strip.setAttribute("aria-label", label + " — " + pairs.length + (pairs.length === 1 ? " foto" : " foto, scorri"));

    pairs.forEach(function (pair, i) {
      var slide = el("button", "carousel__slide");
      slide.type = "button";
      slide.setAttribute("aria-label", "Ingrandisci " + label + " (" + (i + 1) + " di " + pairs.length + ")");
      slide.appendChild(makeImg(pair, p.alt || label));
      slide.addEventListener("click", function () { openLightbox(pairs, i, p, coords); });
      strip.appendChild(slide);
    });
    carousel.appendChild(strip);

    if (pairs.length > 1) {
      var counter = el("span", "carousel__counter", "1 / " + pairs.length);
      carousel.appendChild(counter);
      var dots = el("div", "carousel__dots");
      var dotEls = pairs.map(function (_, i) {
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
          idx = Math.max(0, Math.min(pairs.length - 1, idx));
          counter.textContent = (idx + 1) + " / " + pairs.length;
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
    if (p.date) meta.appendChild(el("div", "place__date", formatDate(p.date)));
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
    lbImg.src = variantSrc(lbGroup[lbIndex], currentTheme());
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

  // --- Cambio tema: aggiorna tutte le immagini alla versione giusta ---
  function applyTheme(theme) {
    var imgs = document.querySelectorAll(".carousel__slide img");
    imgs.forEach(function (img) {
      var want = theme === "dark" ? (img.dataset.dark || img.dataset.light) : (img.dataset.light || img.dataset.dark);
      if (want && img.getAttribute("src") !== want) img.src = want;
    });
    if (lb && lb.classList.contains("is-open") && lbGroup.length) renderLightbox();
  }
  if (toggle) toggle.addEventListener("click", function () { setTheme(currentTheme() === "dark" ? "light" : "dark"); });

  // --- Caricamento dati ---
  function render(places) {
    // Ordina per data, più recente prima (in alto a sinistra)
    places = places.slice().sort(function (a, b) { return dateTs(b.date) - dateTs(a.date); });
    if (countEl) countEl.textContent = places.length + (places.length === 1 ? " luogo" : " luoghi");
    if (!grid) return;
    grid.innerHTML = "";
    if (!places.length) { grid.appendChild(el("p", "lede", "Ancora nessuna foto.")); return; }
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
