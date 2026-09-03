      (function () {
        "use strict";
        if (!window.document || document.getElementById("tk3dLayer")) return;
        var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        var ACC = {
          home: "#e7b965",
          "section-logo": "#d8a08c",
          "section-pdf": "#a8b4d4",
          "section-stills-boards": "#a9c4a2",
          "section-adlinks": "#d4a86a",
          "section-yt-helper": "#d49e9e"
        };
        var body = document.body;
        var aurora = null;
        var mo = null;
        var observersBound = false;

        function currentTool() {
          var app = document.getElementById("view-app");
          if (app && !app.classList.contains("active")) return "home";
          var sec = document.querySelector(".tool-section.active");
          return (sec && ACC[sec.id]) ? sec.id : "home";
        }

        function applyTool() {
          var tool = currentTool();
          body.setAttribute("data-tool", tool);
          body.style.setProperty("--tk3d-acc", ACC[tool] || ACC.home);
        }

        function resetTilt(el) {
          if (!el) return;
          el.style.setProperty("--tk-rx", "0deg");
          el.style.setProperty("--tk-ry", "0deg");
        }

        function bindTilt() {
          var lastEl = null;
          document.addEventListener("pointermove", function (e) {
            var t = (e.target && e.target.closest) ? e.target.closest(".home-card, .logo-card-item, .pdf-stack-wrapper") : null;
            if (t !== lastEl) {
              if (lastEl) resetTilt(lastEl);
              lastEl = t;
            }
            if (!t) return;
            var r = t.getBoundingClientRect();
            if (!r.width || !r.height) return;
            var px = (e.clientX - r.left) / r.width - 0.5;
            var py = (e.clientY - r.top) / r.height - 0.5;
            t.style.setProperty("--tk-rx", (py * -6).toFixed(2) + "deg");
            t.style.setProperty("--tk-ry", (px * 8).toFixed(2) + "deg");
          }, { passive: true });
          document.addEventListener("pointerout", function (e) {
            if (lastEl && (!e.relatedTarget || !lastEl.contains(e.relatedTarget))) {
              resetTilt(lastEl);
              lastEl = null;
            }
          }, { passive: true });
          observersBound = true;
        }

        function init() {
          body.classList.add("tk3d");
          aurora = document.createElement("div");
          aurora.className = "tk3d-aurora";
          aurora.id = "tk3dLayer";
          body.appendChild(aurora);
          applyTool();
          if (window.MutationObserver) {
            mo = new MutationObserver(applyTool);
            mo.observe(body, {
              attributes: true,
              attributeFilter: ["class"],
              subtree: true,
              childList: true
            });
          }
          document.addEventListener("visibilitychange", function () {
            if (!document.hidden) applyTool();
          });
          if (!reduce) bindTilt();
        }

        try {
          init();
        } catch (err) {
          try {
            if (window.console && console.warn) console.warn("TK3D skin disabled:", err);
            body.classList.remove("tk3d");
            if (aurora && aurora.parentNode) aurora.parentNode.removeChild(aurora);
            if (mo) mo.disconnect();
          } catch (_) { /* keep original app fully working */ }
        }
      })();
