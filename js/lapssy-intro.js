/* =====================================================================
   lapssy-intro.js — LAZZY opening bit. Presentation ONLY.
   "The Unhurred Edit" — 8s total, skippable, session-once.

   0.00  overlay up (skip hint fades in at 1.2s)
   0.25 → 1.47  L A P S S Y plop in, one lazier each time
   1.90 → 3.30  hold "LAPSSY" (readable)
   3.30  tagline fades in (450ms)
   3.75 → 5.20  hold tagline
   5.20  strike draws across the P (500ms, drawn left→right)
   5.70 → 6.10  hold struck P
   6.10  both S's droop (500ms)
   6.60  crossfade S → Z (450ms, no instant swap)
   7.05 → 8.00  hold final LA̶PZZY
   8.00  fade out (400ms) — gone by 8.4s. Hard cap 8.5s.

   Reduced-motion: skipped entirely. No logic files touched.
   ===================================================================== */

(function () {
  "use strict";
  var FLAG = "lazzy_intro_seen";

  function reduced() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }
  function seen() {
    try { return sessionStorage.getItem(FLAG) === "1"; } catch (e) { return false; }
  }
  function markSeen() {
    try { sessionStorage.setItem(FLAG, "1"); } catch (e) {}
  }

  function buildOverlay() {
    var ov = document.createElement("div");
    ov.id = "lazzyIntro";
    ov.setAttribute("aria-hidden", "true");
    ov.innerHTML =
      '<div class="lazzy-intro-inner">' +
        '<div class="lazzy-intro-word" id="lazzyWord">' +
          '<span class="lz-ch">L</span>' +
          '<span class="lz-ch">A</span>' +
          '<span class="lz-ch lz-p">P</span>' +
          /* each S carries a hidden Z twin for the crossfade */
          '<span class="lz-pair"><span class="lz-ch lz-s">S</span><span class="lz-ch lz-ztwin" aria-hidden="true">Z</span></span>' +
          '<span class="lz-pair"><span class="lz-ch lz-s2">S</span><span class="lz-ch lz-ztwin2" aria-hidden="true">Z</span></span>' +
          '<span class="lz-ch">Y</span>' +
        "</div>" +
        '<div class="lazzy-intro-tagline" id="lazzyTag">Professional Way for Lazyness</div>' +
        '<div class="lazzy-intro-skip">tap if you&#39;re in a hurry</div>' +
      "</div>";
    document.documentElement.appendChild(ov);
    return ov;
  }

  function run() {
    var ov = buildOverlay();
    var word = ov.querySelector("#lazzyWord");
    var pEl = ov.querySelector(".lz-p");
    var s1 = ov.querySelector(".lz-s");
    var s2 = ov.querySelector(".lz-s2");
    var z1 = ov.querySelector(".lz-ztwin");
    var z2 = ov.querySelector(".lz-ztwin2");
    var skipHint = ov.querySelector(".lazzy-intro-skip");
    var tag = ov.querySelector("#lazzyTag");
    var done = false;
    var timers = [];

    function T(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearAll() { timers.forEach(clearTimeout); timers = []; }

    function finish(immediately) {
      if (done) return;
      done = true;
      clearAll();
      var out = function () {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        markSeen();
      };
      if (immediately) out();
      else {
        ov.classList.add("lazzy-intro-out");
        setTimeout(out, 400);
      }
    }

    ov.addEventListener("click", function () { finish(true); });
    document.addEventListener("keydown", function onKey() {
      finish(true);
      document.removeEventListener("keydown", onKey);
    });

    /* skip hint: shows itself eventually, doesn't insist */
    T(function () { skipHint.classList.add("lz-skip-in"); }, 1200);

    /* Act 1 — letters plop in, each gap lazier than the last */
    var chs = word.querySelectorAll(".lz-ch:not(.lz-ztwin):not(.lz-ztwin2)");
    var gaps = [200, 230, 260, 300, 300]; /* 6 letters, 5 gaps */
    var at = 250;
    for (var i = 0; i < chs.length; i++) {
      (function (el, when) {
        T(function () { el.classList.add("lz-in"); }, when);
      })(chs[i], at);
      if (i < gaps.length) at += gaps[i];
    }
    var plopped = at; /* ~1.47s */

    /* Act 1.5 — hold LAPSSY: readable, 1.4s */
    var tagAt = plopped + 430 + 1400; /* ~3.3s */

    /* Act 2 — tagline, 450ms fade */
    T(function () { tag.classList.add("lz-tag-in"); }, tagAt);

    /* Act 2.5 — hold tagline */
    var strikeAt = tagAt + 450 + 1450; /* ~5.2s */

    /* Act 3.1 — the strike: drawn across the P, 500ms */
    T(function () { pEl.classList.add("lz-struck"); }, strikeAt);
    /* Act 3.2 — hold struck P */
    var droopAt = strikeAt + 500 + 400; /* ~6.1s */

    /* Act 3.3 — the S's give up: droop, 500ms */
    T(function () {
      s1.classList.add("lz-droop");
      s2.classList.add("lz-droop");
    }, droopAt);

    /* Act 3.4 — crossfade S → Z (no instant swap), 450ms */
    T(function () {
      s1.classList.add("lz-fading");
      s2.classList.add("lz-fading");
      z1.classList.add("lz-arriving");
      z2.classList.add("lz-arriving");
    }, droopAt + 500); /* ~6.6s */

    /* Act 4 — hold final LA̶PZZY ~1s, then fade out */
    T(function () { finish(false); }, droopAt + 500 + 450 + 1000); /* ~8.0s */

    /* Hard cap 8.5s */
    T(function () { finish(true); }, 8500);
  }

  function start() {
    if (reduced() || seen()) {
      markSeen();
      return;
    }
    run();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else start();
})();
