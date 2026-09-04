/* =====================================================================
   lapssy-copy.js — LAPSSY brand copy + workspace shell (presentation).
   THE ONLY place UI strings live. No tool/business logic here, ever.
   ===================================================================== */

const LAPSSY_COPY = {
  brand: {
    name: "LAPSSY",
    tagline: "Professional way for laziness.",
    homeHeadline: "Oh. You again.",
    homeSub: "Fine. Pick a chore.",
    logoSrc: "Lapssy logo.png",
  },

  /* Per-tool identity: tagline for the tool strip (spec §2). */
  toolIdentity: {
    "section-logo":        { title: "LOGO RESIZER",     tagline: "Fine. I'll resize it." },
    "section-pdf-convert": { title: "PDF → IMAGE",      tagline: "PDF goes in. Pictures come out. Somehow." },
    "section-pdf-split":   { title: "IMAGE SPLITTER",   tagline: "I'll make the cuts." },
    "section-stills-video":{ title: "VIDEO → STILLS",   tagline: "Frame by frame. Don't rush me." },
    "section-stills-story":{ title: "STORYBOARDS",      tagline: "Organising creative chaos. Reluctantly." },
    "section-adlinks-gen":  { title: "AD LINKS",         tagline: "Links. So many links." },
    "section-adlinks-dl":   { title: "AD DOWNLOADER",    tagline: "Downloading. You can watch." },
    "section-yt-helper":    { title: "VIDEO DOWNLOADS",  tagline: "Paste it. I'll figure it out." },
  },

  /* Footer status messages by state (spec §12). */
  status: {
    idle: "I'm ready. Technically.",
    working: "Still working.",
    success: "Done. Can I go now?",
    error: "Well. That didn't work.",
  },

  toolDescriptions: {
    "section-logo": "Because resizing the same logo 47 times is apparently a job.",
    "section-pdf-convert": "PDF goes in. Images come out. Don't overthink it.",
    "section-pdf-split": "One image. Now several images. You're welcome.",
    "section-stills-video": "Find the good frame without pausing 600 times.",
    "section-stills-story": "Put things in boxes. Call it creative direction.",
    "section-adlinks-gen": "Because URLs apparently need paperwork.",
    "section-adlinks-downloader": "Go get the thing.",
    "section-yt-helper": "Point at a video. Get the commands. That's it.",
  },

  states: {
    emptyHeading: "Nothing here yet.",
    emptySupport: "Which means absolutely nothing can go wrong.",
    dropHeading: "Drop your problem here.",
    dropSupport: "We'll deal with it.",
    successHeading: "Done.",
    successSupport: "That wasn't your problem anymore.",
    errorHeading: "Well. That didn't work.",
  },

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

/* =====================================================================
   LAPSSY WORKSPACE SHELL (presentation-only)
   - Header: master logo + wordmark + nav + global actions styling hooks
   - Tool identity strip: injected above each tool workspace
   - Contextual status bar: fixed footer with state messages
   - Reads existing app state only (activeTool); never writes it.
   ===================================================================== */
(function applyLapssyShell() {
  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function activeKey() {
    try {
      var t = localStorage.getItem("cts_activeTool") || "home";
      var mode = "gen";
      // infer sub-mode from visible tab content
      if (document.getElementById("pdfTabContentSplit") && document.getElementById("pdfTabContentSplit").style.display !== "none") mode = "split";
      if (t === "section-pdf") return "section-pdf-" + (mode === "split" ? "split" : "convert");
      if (t === "section-stills-boards") {
        var st = document.getElementById("stillsTabContentStory");
        var sv = document.getElementById("stillsTabContentVideo");
        if (st && st.style.display !== "none") return "section-stills-story";
        if (sv && sv.style.display !== "none") return "section-stills-video";
        return "section-stills-video";
      }
      if (t === "section-adlinks") {
        var dl = document.getElementById("adlinksTabContentDownloader");
        if (dl && dl.style.display !== "none") return "section-adlinks-dl";
        return "section-adlinks-gen";
      }
      if (LAPSSY_COPY.toolIdentity[t + "-convert"]) return t + "-convert";
      if (LAPSSY_COPY.toolIdentity[t]) return t;
      return null;
    } catch (e) { return null; }
  }

  function buildLockup(brand) {
    var lockup = document.createElement("span");
    lockup.className = "lazzy-lockup";
    lockup.setAttribute("aria-label", LAPSSY_COPY.brand.name);
    lockup.innerHTML =
      "LA" +
      '<span class="lazzy-strike" aria-hidden="true">P</span>' +
      '<span class="lazzy-z" aria-hidden="true">ZZ</span>' +
      "Y";
    brand.textContent = "";
    brand.appendChild(lockup);
    brand.title = LAPSSY_COPY.brand.tagline;
  }

  /* Header: swap box icon for master mascot */
  function brandHeader() {
    var brand = document.querySelector(".brand-title");
    if (!brand) return;
    buildLockup(brand);
    var mascot = document.createElement("img");
    mascot.src = "Lapssy logo.png";
    mascot.alt = "";
    mascot.className = "lapssy-masthead";
    mascot.draggable = false;
    brand.insertBefore(mascot, brand.firstChild);
  }

  /* Tool identity strips: one per tool-section, sits between header and workspace */
  function identityStrips() {
    var sections = document.querySelectorAll(".tool-section");
    sections.forEach(function (sec) {
      if (sec.querySelector(":scope > .lapssy-strip")) return;
      var strip = document.createElement("div");
      strip.className = "lapssy-strip";
      strip.innerHTML =
        '<img class="lapssy-strip-mascot" src="Lapssy logo.png" alt="" draggable="false">' +
        '<div class="lapssy-strip-text">' +
        '<span class="lapssy-strip-title"></span>' +
        '<span class="lapssy-strip-tag"></span>' +
        "</div>" +
        '<div class="lapssy-strip-meta"></div>';
      // insert after the tool header
      var hdr = sec.querySelector(".tool-header");
      if (hdr && hdr.nextSibling) sec.insertBefore(strip, hdr.nextSibling);
      else sec.insertBefore(strip, sec.firstChild);
    });
    refreshStrips();
  }

  /* Update strips + section h2s for the active tool (observes tab switches too) */
  function refreshStrips() {
    var key = activeKey();
    var sections = document.querySelectorAll(".tool-section");
    sections.forEach(function (sec) {
      var strip = sec.querySelector(":scope > .lapssy-strip");
      if (!strip) return;
      // which sub-key applies to this section?
      var id = sec.id;
      var myKey = null;
      if (id === "section-pdf") myKey = (key === "section-pdf-split") ? "section-pdf-split" : "section-pdf-convert";
      else if (id === "section-stills-boards") myKey = (key === "section-stills-story") ? "section-stills-story" : "section-stills-video";
      else if (id === "section-adlinks") myKey = (key === "section-adlinks-dl") ? "section-adlinks-dl" : "section-adlinks-gen";
      else if (LAPSSY_COPY.toolIdentity[id]) myKey = id;
      var info = myKey ? LAPSSY_COPY.toolIdentity[myKey] : null;
      if (info) {
        strip.querySelector(".lapssy-strip-title").textContent = info.title;
        strip.querySelector(".lapssy-strip-tag").textContent = info.tagline;
      }
      // live count in strip meta
      var count = countForSection(id);
      var meta = strip.querySelector(".lapssy-strip-meta");
      if (meta) meta.textContent = count;
    });
    // sync tool-header h2 text with identity title (active tool)
    if (key) {
      var secId = key.split("-")[0] === "section" ? key : null;
    }
    updateStatusBar();
  }

  function countForSection(id) {
    try {
      switch (id) {
        case "section-logo":
          var g = document.getElementById("logoGrid");
          return g ? (g.querySelectorAll(".logo-card-item").length + " LOGOS") : "";
        case "section-pdf":
          var ps = document.getElementById("pdfStacksContainer");
          if (ps) {
            var pdfs = ps.querySelectorAll(".pdf-stack-wrapper").length;
            var sp = document.getElementById("splitGrid");
            var imgs = sp ? sp.querySelectorAll(".logo-card-item").length : 0;
            return (pdfs + imgs) + " LOADED";
          }
          return "";
        case "section-stills-boards":
          var ssv = document.getElementById("stillsStacksContainer");
          var sv = ssv ? ssv.querySelectorAll(".pdf-stack-wrapper").length : 0;
          var story = window.Tools && Tools.Story && Tools.Story.active ? Tools.Story.active.images.length : 0;
          return (sv + story) + " ASSETS";
        case "section-adlinks":
          var n = window.Tools && Tools.AdDownloader && Tools.AdDownloader.allNames ? Tools.AdDownloader.allNames.length : 0;
          return n ? (n + " ADS") : "";
        case "section-yt-helper":
          var c = document.getElementById("ytMetadataContent");
          return c ? (c.querySelectorAll(".glass-panel").length + " VIDEOS") : "";
      }
    } catch (e) {}
    return "";
  }

  /* Contextual status bar (footer) */
  function buildStatusBar() {
    if (document.getElementById("lapssyStatusBar")) return;
    var bar = document.createElement("div");
    bar.id = "lapssyStatusBar";
    bar.innerHTML =
      '<span class="lapssy-status-left" id="lapssyStatusLeft">I\'m ready. Technically.</span>' +
      '<span class="lapssy-status-right"><img src="Lapssy logo.png" alt="" class="lapssy-status-mascot" draggable="false"><span id="lapssyStatusMsg"></span></span>';
    document.body.appendChild(bar);
  }

  function updateStatusBar() {
    var bar = document.getElementById("lapssyStatusBar");
    if (!bar) return;
    var left = document.getElementById("lapssyStatusLeft");
    var msg = document.getElementById("lapssyStatusMsg");
    // state inference (read-only)
    var state = "idle";
    try {
      var prog = document.querySelector(".progress-container.active");
      if (prog) state = "working";
      var busyBtn = Array.prototype.slice.call(document.querySelectorAll(".liquid-btn")).some(function (b) {
        return /winning|thing/i.test(b.textContent || "") && !b.disabled;
      });
      if (!prog && busyBtn) state = "working";
      var toast = document.getElementById("errorToast");
      if (toast && toast.classList.contains("visible")) state = state === "working" ? "working" : "idle";
    } catch (e) {}
    var text = LAPSSY_COPY.status[state] || LAPSSY_COPY.status.idle;
    if (msg) msg.textContent = text;
    // left: counts summary
    if (left) {
      var key = activeKey();
      if (key) {
        var secId = key.startsWith("section") ? key.replace(/-(convert|split|video|story|gen|dl)$/, "") : null;
        left.textContent = countForSection(secId) || LAPSSY_COPY.status.idle;
      } else {
        left.textContent = "8 tools. One of them is working. It's not me.";
      }
    }
  }

  /* Public status API for tools (they may call window.LapssyStatus.set) —
     presentation only, keeps old UI.showError/showSuccess behavior intact */
  window.LapssyStatus = {
    set: function (text, ms) {
      var msg = document.getElementById("lapssyStatusMsg");
      if (!msg) return;
      msg.textContent = text;
      if (ms) setTimeout(function () { updateStatusBar(); }, ms);
    },
    refresh: updateStatusBar,
  };

  var stripTimer = null;
  function observeTabSwitches() {
    // Debounced: strip/count updates mutate the DOM themselves — never
    // let the observer feed itself. 150ms coalesce, guarded by a flag.
    if (!window.MutationObserver) return;
    var updating = false;
    var mo = new MutationObserver(function () {
      if (updating) return;
      updating = true;
      if (stripTimer) clearTimeout(stripTimer);
      stripTimer = setTimeout(function () {
        updating = false;
        try { refreshStrips(); } catch (e) {}
      }, 150);
    });
    var root = document.getElementById("view-app") || document.body;
    mo.observe(root, { attributes: true, attributeFilter: ["class", "style"], subtree: true, childList: true });
    // lazy count refresh — cheap, doesn't mutate strips
    setInterval(function () { try { updateStatusBar(); } catch (e) {} }, 2000);
  }

  /* Home head: mascot + headline (v2.3 continuity) */
  function buildHome() {
    var homeGrid = document.getElementById("homeContent");
    if (!homeGrid || document.getElementById("lazzyHomeHead")) return;
    var head = document.createElement("div");
    head.id = "lazzyHomeHead";
    var logo = document.createElement("img");
    logo.src = LAPSSY_COPY.brand.logoSrc;
    logo.alt = LAPSSY_COPY.brand.name;
    logo.className = "lazzy-logo-home";
    head.appendChild(logo);
    var h1 = document.createElement("h1");
    h1.textContent = LAPSSY_COPY.brand.homeHeadline;
    var sub = document.createElement("p");
    sub.textContent = LAPSSY_COPY.brand.homeSub;
    sub.className = "lazzy-home-tagline";
    head.appendChild(h1);
    head.appendChild(sub);
    homeGrid.insertBefore(head, homeGrid.firstChild);
  }

  ready(function () {
    buildHome();
    brandHeader();
    identityStrips();
    buildStatusBar();
    observeTabSwitches();
    refreshStrips();
  });
})();
