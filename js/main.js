      window.CURRENT_APP_VERSION = "v1.1";

      // Initialize All Tools
      Object.values(Tools).forEach((tool) => {
        if (tool.init) tool.init();
      });

      UI.initTheme();
      Core.AppState.restoreInputs();
      UI.showHome();

      

      

      // Command Palette Listeners
      document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          const overlay = document.getElementById("commandPaletteOverlay");
          if (overlay.classList.contains("active")) {
            UI.closeCommandPalette();
          } else {
            UI.openCommandPalette();
          }
        } else {
          UI.handlePaletteKeyDown(e);
        }
      });

      document
        .getElementById("commandPaletteInput")
        .addEventListener("input", (e) => {
          UI.filterCommandPalette(e.target.value);
        });

      // Close on overlay click
      document
        .getElementById("commandPaletteOverlay")
        .addEventListener("click", (e) => {
          if (e.target.id === "commandPaletteOverlay") {
            UI.closeCommandPalette();
          }
        });

      // ================= PRESETS PANEL WIRING =================
      document.getElementById("presetsSaveBtn").addEventListener("click", () => UI.savePreset());
      document.getElementById("presetsCloseBtn").addEventListener("click", () => UI.closePresets());
      document.getElementById("presetsOverlay").addEventListener("click", (e) => {
        if (e.target.id === "presetsOverlay") UI.closePresets();
      });
      document.getElementById("presetsNameInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); UI.savePreset(); }
        if (e.key === "Escape") { e.preventDefault(); UI.closePresets(); }
      });
      document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
          e.preventDefault();
          const overlay = document.getElementById("presetsOverlay");
          if (overlay && overlay.hidden) UI.openPresets();
          else UI.closePresets();
        }
        if (e.key === "Escape") {
          const overlay = document.getElementById("presetsOverlay");
          if (overlay && !overlay.hidden) {
            e.preventDefault();
            UI.closePresets();
          }
        }
      });

      // ================= TAB ARROW-KEY NAVIGATION =================
      document.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        const tab = e.target.closest && e.target.closest('[role="tab"]');
        if (!tab) return;
        e.preventDefault();
        const tablist = tab.closest('[role="tablist"]');
        if (!tablist) return;
        const tabs = Array.prototype.slice.call(
          tablist.querySelectorAll('[role="tab"]'),
        );
        const idx = tabs.indexOf(tab);
        if (idx === -1) return;
        const next =
          e.key === "ArrowRight"
            ? tabs[(idx + 1) % tabs.length]
            : tabs[(idx - 1 + tabs.length) % tabs.length];
        if (!next) return;
        next.focus();
        const targetId = next.getAttribute("aria-controls");
        if (targetId && next.onclick) next.onclick();
        else if (targetId) next.click();
      });

      // ================= ORIGIN BUTTON EFFECT (VANILLA JS PORT) =================
      (function () {
        function getCoverDiameter(width, height, x, y) {
          return Math.ceil(
            2 *
              Math.max(
                Math.hypot(x, y),
                Math.hypot(width - x, y),
                Math.hypot(x, height - y),
                Math.hypot(width - x, height - y),
              ),
          );
        }

        function setupOriginButton(btn) {
          if (btn.hasAttribute("data-origin-setup")) return;
          btn.setAttribute("data-origin-setup", "true");
          btn.style.position = "relative";
          btn.style.overflow = "hidden";
          btn.style.zIndex = "1";

          const isLightText = !btn.classList.contains("active-mode");

          btn.style.transition =
            "color 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s, border-color 0.2s";

          let contentWrap = document.createElement("span");
          contentWrap.style.position = "relative";
          contentWrap.style.zIndex = "10";
          contentWrap.style.display = "inline-flex";
          contentWrap.style.alignItems = "center";
          contentWrap.style.justifyContent = "center";
          contentWrap.style.gap = "8px";
          contentWrap.style.pointerEvents = "none";

          while (btn.firstChild) {
            contentWrap.appendChild(btn.firstChild);
          }

          let fillElement = document.createElement("span");
          fillElement.className = "origin-fill";
          fillElement.style.position = "absolute";
          fillElement.style.borderRadius = "50%";

          if (btn.classList.contains("active-mode")) {
            fillElement.style.backgroundColor = "rgba(0, 0, 0, 0.06)";
          } else if (btn.classList.contains("danger-btn")) {
            fillElement.style.backgroundColor = "rgba(226, 114, 107, 0.07)";
          } else {
            fillElement.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
          }

          fillElement.style.pointerEvents = "none";
          fillElement.style.transformOrigin = "center";
          fillElement.style.transform = "translate(-50%, -50%) scale(0)";
          fillElement.style.transition =
            "transform 600ms cubic-bezier(0.3, 0.7, 0.3, 1)";
          fillElement.style.zIndex = "0";
          fillElement.style.left = "50%";
          fillElement.style.top = "50%";
          fillElement.style.width = "0px";
          fillElement.style.height = "0px";

          btn.appendChild(fillElement);
          btn.appendChild(contentWrap);

          btn._originState = {
            hovered: false,
            pressed: false,
            fillElement: fillElement,
            contentWrap: contentWrap,
            originalColor: window.getComputedStyle(btn).color,
          };
        }

        function updateFillState(btn) {
          let state = btn._originState;
          let showFill = !btn.disabled && (state.hovered || state.pressed);

          if (showFill) {
            state.fillElement.style.transform = `translate(-50%, -50%) scale(1)`;
            if (btn.classList.contains("active-mode")) {
              btn.style.color = "";
            } else if (btn.classList.contains("danger-btn")) {
              btn.style.color = "var(--danger)";
            } else {
              btn.style.color = "";
            }
          } else {
            state.fillElement.style.transform = `translate(-50%, -50%) scale(0)`;
            btn.style.color = ""; // reset
          }
        }

        function updateOriginPosition(btn, clientX, clientY) {
          let rect = btn.getBoundingClientRect();
          let x = clientX - rect.left;
          let y = clientY - rect.top;
          if (clientX === undefined) {
            x = rect.width / 2;
            y = rect.height / 2;
          }

          let coverSize = getCoverDiameter(rect.width, rect.height, x, y);
          let state = btn._originState;

          if (state.fillElement.style.transform.includes("scale(0)")) {
            state.fillElement.style.transition = "none";
            state.fillElement.style.left = x + "px";
            state.fillElement.style.top = y + "px";
            state.fillElement.style.width = coverSize + "px";
            state.fillElement.style.height = coverSize + "px";
            void state.fillElement.offsetWidth; // force reflow
            state.fillElement.style.transition =
              "transform 600ms cubic-bezier(0.3, 0.7, 0.3, 1)";
          }
        }

        document.addEventListener("pointerover", (e) => {
          let btn = e.target.closest(".liquid-btn");
          if (!btn || btn.disabled) return;
          setupOriginButton(btn);
          if (!btn._originState) return;

          btn._originState.hovered = true;
          updateOriginPosition(btn, e.clientX, e.clientY);
          updateFillState(btn);
        });

        document.addEventListener("pointerout", (e) => {
          let btn = e.target.closest(".liquid-btn");
          if (!btn || !btn._originState) return;
          if (e.relatedTarget && btn.contains(e.relatedTarget)) return;

          btn._originState.hovered = false;
          btn._originState.pressed = false;
          updateFillState(btn);
        });

        document.addEventListener("pointerdown", (e) => {
          let btn = e.target.closest(".liquid-btn");
          if (!btn || btn.disabled) return;
          setupOriginButton(btn);
          if (!btn._originState) return;

          btn._originState.pressed = true;
          updateOriginPosition(btn, e.clientX, e.clientY);
          updateFillState(btn);
        });

        document.addEventListener("pointerup", (e) => {
          let btn = e.target.closest(".liquid-btn");
          if (!btn || !btn._originState) return;

          btn._originState.pressed = false;
          updateFillState(btn);
        });
      })();

      window.applyThanosSnap = function (elements, duration = 0.6) {
        return new Promise((resolve) => {
          const els = Array.isArray(elements) ? elements : [elements];
          const validEls = els.filter(
            (el) => el && el.dataset.isAnimating !== "true",
          );
          if (validEls.length === 0) {
            resolve();
            return;
          }

          validEls.forEach((el) => {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
          resolve();
        });
      };

      if (window.lucide) {
        lucide.createIcons();
      }
      window.addEventListener("beforeunload", (e) => {
        if (Core.BlobRegistry.urls.length > 0) e.preventDefault();
      });

      /* Dependency resilience guard (additive, non-destructive).
         If a CDN library failed to load, surface a clear notice with a
         retry that remounts the script rather than silently breaking. */
      (function () {
        function initDependencyGuard() {
          var required = [
            { name: "Lucide Icons", global: "lucide", lib: "lucide" },
            { name: "Image Resizer (Pica)", global: "pica", lib: "pica" },
            { name: "JSZip", global: "JSZip", lib: "jszip" },
            { name: "Excel (SheetJS)", global: "XLSX", lib: "xlsx" },
            { name: "PDF.js", global: "pdfjsLib", lib: "pdfjs" },
          ];
          var missing = required.filter(function (r) {
            return !(r.lib === "lucide"
              ? window.lucide
              : r.lib === "pica"
                ? window.pica
                : r.lib === "jszip"
                  ? window.JSZip
                  : r.lib === "xlsx"
                    ? window.XLSX
                    : r.lib === "pdfjs"
                      ? window.pdfjsLib
                      : null);
          });
          if (missing.length === 0) return;
          if (document.getElementById("cts-dep-guard")) return;

          var box = document.createElement("div");
          box.id = "cts-dep-guard";
          box.setAttribute("role", "alert");
          box.style.cssText =
            "position:fixed;bottom:24px;right:24px;left:24px;max-width:560px;margin:0 auto;" +
            "background:var(--bg-panel,#0b0b0f);border:1px solid var(--danger,#ff5c7c);" +
            "border-left:5px solid var(--danger,#ff5c7c);border-radius:12px;padding:18px 20px;" +
            "color:var(--text-main,#ececf3);font:500 .92rem/1.5 Inter,sans-serif;z-index:3000;" +
            "box-shadow:0 24px 60px -12px rgba(0,0,0,.75);display:flex;gap:14px;align-items:flex-start;";

          var text = document.createElement("div");
          text.style.cssText = "flex:1;min-width:0;";
          var head = document.createElement("div");
          head.style.cssText = "font-weight:600;margin-bottom:4px;";
          head.textContent = "A required component did not load";
          var body = document.createElement("div");
          body.style.cssText = "color:var(--text-muted,#9a9ab2);";
          body.textContent =
            "Missing: " + missing.map(function (m) { return m.name; }).join(", ") +
            ". Your connection or a CDN may be unavailable. Retrying may restore full functionality.";

          var actions = document.createElement("div");
          actions.style.cssText = "display:flex;gap:8px;flex-shrink:0;align-items:center;";
          var retry = document.createElement("button");
          retry.type = "button";
          retry.textContent = "Retry";
          retry.style.cssText =
            "background:var(--danger,#ff5c7c);border:none;color:#fff;font-weight:600;" +
            "border-radius:8px;padding:8px 14px;cursor:pointer;font:600 .9rem Inter,sans-serif;";
          retry.addEventListener("click", function () {
            var table = {
              lucide: "https://unpkg.com/lucide@latest",
              pica: "https://cdnjs.cloudflare.com/ajax/libs/pica/9.0.1/pica.min.js",
              jszip: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
              xlsx: "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
              pdfjs: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
            };
            var remaining = required.filter(function (r) { return !(r.lib === "lucide" ? window.lucide : r.lib === "pica" ? window.pica : r.lib === "jszip" ? window.JSZip : r.lib === "xlsx" ? window.XLSX : window.pdfjsLib); });
            remaining.forEach(function (r) {
              var s = document.createElement("script");
              s.src = table[r.lib];
              s.async = true;
              document.head.appendChild(s);
            });
            box.remove();
            setTimeout(initDependencyGuard, 2500);
          });
          var close = document.createElement("button");
          close.type = "button";
          close.setAttribute("aria-label", "Dismiss");
          close.textContent = "Dismiss";
          close.style.cssText =
            "background:transparent;border:1px solid var(--border-strong,#2c2c36);color:var(--text-muted,#9a9ab2);" +
            "border-radius:8px;padding:8px 12px;cursor:pointer;font:600 .9rem Inter,sans-serif;";
          close.addEventListener("click", function () { box.remove(); });

          actions.appendChild(retry);
          actions.appendChild(close);
          text.appendChild(head);
          text.appendChild(body);
          box.appendChild(text);
          box.appendChild(actions);
          document.body.appendChild(box);
        }

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", initDependencyGuard);
        } else {
          initDependencyGuard();
        }
      })();
