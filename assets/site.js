/* Site behaviour: topographic contours, optional CV and photo, copy buttons, publication filters. */
(function () {
  "use strict";

  /* ---------- Topographic contours (marching squares over seeded value noise) ---------- */
  function makeNoise(seed) {
    var p = [];
    var s = seed >>> 0;
    function rnd() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    for (var i = 0; i < 256; i++) p.push(rnd());
    function hash(x, y) { return p[(x * 57 + y * 131 + ((x * y) & 255)) & 255]; }
    function smooth(t) { return t * t * (3 - 2 * t); }
    return function (x, y) {
      var xi = Math.floor(x), yi = Math.floor(y);
      var xf = x - xi, yf = y - yi;
      var a = hash(xi & 255, yi & 255), b = hash((xi + 1) & 255, yi & 255);
      var c = hash(xi & 255, (yi + 1) & 255), d = hash((xi + 1) & 255, (yi + 1) & 255);
      var u = smooth(xf), v = smooth(yf);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }

  function drawContours(canvas) {
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var styles = getComputedStyle(document.documentElement);
    var minor = styles.getPropertyValue("--contour").trim() || "rgba(10,100,105,0.16)";
    var major = styles.getPropertyValue("--contour-index").trim() || "rgba(10,100,105,0.34)";

    var noise = makeNoise(parseInt(canvas.getAttribute("data-seed") || "11", 10));
    var cell = 7;
    var cols = Math.ceil(w / cell) + 1;
    var rows = Math.ceil(h / cell) + 1;
    var field = new Float32Array(cols * rows);
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var x = i * cell / 260, y = j * cell / 260;
        var v = noise(x, y) * 0.55 + noise(x * 2.1 + 7, y * 2.1 + 3) * 0.3 + noise(x * 4.3 + 1, y * 4.3 + 9) * 0.15;
        /* a gentle ridge rising to the right, like the Ghats inland of the coast */
        v += (i / cols) * 0.55;
        field[j * cols + i] = v;
      }
    }

    var levels = 22;
    var lo = 0.15, hi = 1.45;
    for (var k = 1; k < levels; k++) {
      var t = lo + (hi - lo) * k / levels;
      var isIndex = k % 5 === 0;
      ctx.beginPath();
      ctx.strokeStyle = isIndex ? major : minor;
      ctx.lineWidth = isIndex ? 1.5 : 0.9;
      for (var r = 0; r < rows - 1; r++) {
        for (var q = 0; q < cols - 1; q++) {
          var a = field[r * cols + q], b = field[r * cols + q + 1];
          var c = field[(r + 1) * cols + q + 1], d = field[(r + 1) * cols + q];
          var code = (a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (d > t ? 1 : 0);
          if (code === 0 || code === 15) continue;
          var x0 = q * cell, y0 = r * cell;
          var top = [x0 + cell * (t - a) / (b - a), y0];
          var right = [x0 + cell, y0 + cell * (t - b) / (c - b)];
          var bottom = [x0 + cell * (t - d) / (c - d), y0 + cell];
          var left = [x0, y0 + cell * (t - a) / (d - a)];
          var segs;
          switch (code) {
            case 1: case 14: segs = [[left, bottom]]; break;
            case 2: case 13: segs = [[bottom, right]]; break;
            case 3: case 12: segs = [[left, right]]; break;
            case 4: case 11: segs = [[top, right]]; break;
            case 5: segs = [[left, top], [bottom, right]]; break;
            case 6: case 9: segs = [[top, bottom]]; break;
            case 7: case 8: segs = [[left, top]]; break;
            case 10: segs = [[left, bottom], [top, right]]; break;
          }
          for (var s = 0; s < segs.length; s++) {
            ctx.moveTo(segs[s][0][0], segs[s][0][1]);
            ctx.lineTo(segs[s][1][0], segs[s][1][1]);
          }
        }
      }
      ctx.stroke();
    }

    /* fade the lines behind the text column */
    ctx.globalCompositeOperation = "destination-in";
    var g = ctx.createLinearGradient(0, 0, w, 0);
    var fade = canvas.getAttribute("data-fade") || "0.35";
    g.addColorStop(0, "rgba(0,0,0," + fade + ")");
    g.addColorStop(0.45, "rgba(0,0,0," + fade + ")");
    g.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
  }

  function drawAll() {
    var list = document.querySelectorAll("canvas.contours");
    for (var i = 0; i < list.length; i++) {
      try { drawContours(list[i]); } catch (e) { /* decorative only */ }
    }
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawAll, 150);
  });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", drawAll);
  }
  if (window.MutationObserver) {
    new MutationObserver(drawAll).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  /* ---------- Optional files: cv.pdf and photo.jpg in the site's main folder ---------- */
  function showCvLinks() {
    var targets = document.querySelectorAll("[data-cv]");
    var fallbacks = document.querySelectorAll("[data-cv-missing]");
    if (!targets.length && !fallbacks.length) return;
    if (!window.fetch || location.protocol === "file:") return;
    fetch("cv.pdf", { method: "HEAD", cache: "no-store" }).then(function (res) {
      var type = res.headers.get("content-type") || "";
      if (res.ok && type.indexOf("html") === -1) {
        for (var i = 0; i < targets.length; i++) targets[i].hidden = false;
        for (var j = 0; j < fallbacks.length; j++) fallbacks[j].hidden = true;
      }
    }).catch(function () { /* no CV uploaded yet */ });
  }

  function showPhoto() {
    var frame = document.querySelector("[data-photo]");
    if (!frame) return;
    var img = new Image();
    img.alt = frame.getAttribute("data-photo-alt") || "";
    img.onload = function () {
      frame.textContent = "";
      frame.appendChild(img);
    };
    img.src = frame.getAttribute("data-photo");
  }

  /* ---------- Copy buttons ---------- */
  function wireCopy() {
    var buttons = document.querySelectorAll("[data-copy], [data-copy-decode]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function (ev) {
        var btn = ev.currentTarget;
        var text = btn.getAttribute("data-copy");
        if (btn.hasAttribute("data-copy-decode")) {
          var source = document.getElementById(btn.getAttribute("aria-controls"));
          text = (source ? source.textContent : "")
            .replace(/\[dot\]/g, ".").replace(/\[at\]/g, "@").replace(/\[hyphen\]/g, "-").replace(/\s+/g, "");
        }
        function done(label) {
          var original = btn.getAttribute("data-label") || btn.textContent;
          btn.setAttribute("data-label", original);
          btn.textContent = label;
          setTimeout(function () { btn.textContent = original; }, 1800);
        }
        function fallback() {
          var target = document.getElementById(btn.getAttribute("aria-controls"));
          if (target && window.getSelection) {
            var range = document.createRange();
            range.selectNodeContents(target);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            done("Selected");
          }
        }
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { done("Copied"); }, fallback);
          } else { fallback(); }
        } catch (e) { fallback(); }
      });
    }
  }

  /* ---------- Publication filters ---------- */
  function wireFilters() {
    var bar = document.querySelector("[data-filters]");
    if (!bar) return;
    var buttons = bar.querySelectorAll("button[data-filter]");
    var items = document.querySelectorAll(".pub[data-type]");
    var groups = document.querySelectorAll(".year-group");
    var status = document.querySelector("[data-filter-status]");
    function apply(type) {
      var shown = 0;
      for (var i = 0; i < items.length; i++) {
        var match = type === "all" || items[i].getAttribute("data-type") === type;
        items[i].hidden = !match;
        if (match) shown++;
      }
      for (var g = 0; g < groups.length; g++) {
        groups[g].hidden = !groups[g].querySelector(".pub:not([hidden])");
      }
      for (var b = 0; b < buttons.length; b++) {
        buttons[b].setAttribute("aria-pressed", buttons[b].getAttribute("data-filter") === type ? "true" : "false");
      }
      if (status) status.textContent = "Showing " + shown + " of " + items.length;
    }
    for (var k = 0; k < buttons.length; k++) {
      buttons[k].addEventListener("click", function (ev) { apply(ev.currentTarget.getAttribute("data-filter")); });
    }
    apply("all");
  }

  /* ---------- Profile logos: hide text labels once the icon library has drawn the logos ---------- */
  function markIcons() {
    if (document.querySelector(".social svg")) {
      document.documentElement.classList.add("icons-ready");
      return true;
    }
    return false;
  }
  function watchIcons() {
    if (markIcons()) return;
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (markIcons() || tries > 40) clearInterval(timer);
    }, 150);
  }

  function init() {
    watchIcons();
    drawAll();
    showCvLinks();
    showPhoto();
    wireCopy();
    wireFilters();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);
})();
