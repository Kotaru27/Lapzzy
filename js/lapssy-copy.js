/* =====================================================================
   lapssy-copy.js — LAZZY brand copy v2. THE ONLY place UI strings live.
   Deadpan-lazy. Cause-first on errors. No logic here, ever.
   ===================================================================== */

const LAPSSY_COPY = {
  brand: {
    name: "LAZZY",
    tagline: "Professional Way for Lazyness",
    homeHeadline: "Oh. You again.",
    homeSub: "Fine. Pick a chore.",
  },

  toolDescriptions: {
    "section-logo": "Upload a logo. We'll pretend it was hard.",
    "section-pdf-convert": "PDFs in. Pictures out. Try to contain yourself.",
    "section-pdf-split": "One image becomes several. Applause optional.",
    "section-stills-video": "We watch the whole video so you don't have to.",
    "section-stills-story": "Boxes for your pictures. Direction not included.",
    "section-adlinks-gen": "URLs, but with paperwork.",
    "section-adlinks-downloader": "It fetches. You loaf.",
    "section-yt-helper": "Copy. Paste. Feel accomplished.",
  },

  states: {
    emptyHeading: "Empty. Like our ambition.",
    emptySupport: "Fill it with something. Or don't.",
    dropHeading: "Drop your problem here.",
    dropSupport: "That's the whole interaction.",
    successHeading: "Done.",
    successSupport: "We were never even stressed.",
    errorHeading: "Well. That didn't work.",
  },

  /* Rotating processing copy — rotate every ~3s, not rapidly. */
  processingPool: [
    "Doing the thing…",
    "Barely trying, still winning…",
    "This is basically cardio for us.",
    "Working hard at looking idle…",
    "Convincing the pixels…",
    "Almost done. Probably.",
  ],
  working: "Doing the thing…",

  errorTemplate: {
    structure: ["cause", "action", "personality"],
    personality: "Well. That didn't work.",
  },
};

/* Apply-in-place helper (presentation-only). No tool logic. */
(function applyLapssyCopy() {
  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  ready(function () {
    var C = LAPSSY_COPY;

    /* Wordmark lockup: L A P̶ Z Z Y */
    function buildLockup() {
      var brand = document.querySelector(".brand-title");
      if (!brand) return;
      var lockup = document.createElement("span");
      lockup.className = "lazzy-lockup";
      lockup.setAttribute("aria-label", C.brand.name);
      lockup.innerHTML =
        "LA" +
        '<span class="lazzy-strike" aria-hidden="true">P</span>' +
        '<span class="lazzy-z" aria-hidden="true">ZZ</span>' +
        "Y";
      brand.textContent = "";
      brand.appendChild(lockup);
      brand.title = C.brand.tagline;
    }

    function buildHome() {
      var homeGrid = document.getElementById("homeContent");
      if (!homeGrid || document.getElementById("lazzyHomeHead")) return;
      var head = document.createElement("div");
      head.id = "lazzyHomeHead";
      var h1 = document.createElement("h1");
      h1.textContent = C.brand.homeHeadline;
      var sub = document.createElement("p");
      sub.textContent = C.brand.homeSub;
      sub.className = "lazzy-home-tagline";
      head.appendChild(h1);
      head.appendChild(sub);
      homeGrid.insertBefore(head, homeGrid.firstChild);
    }

    var title = document.querySelector("title");
    if (title) title.textContent = C.brand.name + " — " + C.brand.tagline;
    buildLockup();
    buildHome();
  });
})();
