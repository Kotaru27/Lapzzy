      const GuideEngine = {
        active: false,
        tooltip: null,
        targetEl: null,
        banner: null,
        init() {
          const tooltip = document.createElement("div");
          tooltip.className = "guide-tooltip";
          tooltip.id = "guideTooltipReal";
          tooltip.style.cssText =
            "position:fixed; background:var(--bg-panel); color:var(--text-main); border:1px solid var(--border); padding:12px 18px; border-radius:6px; font-size:0.9rem; z-index:10000; pointer-events:none; opacity:0; transition:opacity 0.2s, transform 0.2s; transform:translateY(10px); box-shadow:var(--shadow-block); max-width:280px; line-height:1.4;";
          document.body.appendChild(tooltip);
          this.tooltip = tooltip;

          const banner = document.createElement("div");
          banner.id = "guideBanner";
          banner.style.cssText =
            "position:fixed; top:0; left:0; width:100%; height:40px; background:var(--bg-panel); color:var(--text-main); border-bottom:1px solid var(--border); z-index:9999; display:none; align-items:center; justify-content:center; gap:20px; box-shadow:var(--shadow-block); font-size:0.85rem; font-weight:500;";
          banner.innerHTML = `
                    <span style="color:var(--accent); display:flex; align-items:center; gap:8px;">
                        <i data-lucide="help-circle" style="width:16px;height:16px;"></i> Interactive Guide Mode
                    </span>
                    <span style="color:var(--text-muted); font-weight:normal;">Hover over any highlighted element below to read instructions.</span>
                    <button class="liquid-btn active-mode" style="height:26px; border-radius:15px; font-size:0.75rem; padding:0 12px; margin-left:20px;" onclick="GuideEngine.close()">Exit Guide</button>
                `;
          document.body.appendChild(banner);
          this.banner = banner;

          const injectLucide = () => {
            if (window.lucide) {
              window.lucide.createIcons({ root: banner });
            } else {
              setTimeout(injectLucide, 100);
            }
          };
          injectLucide();

          document.addEventListener("mousemove", (e) => {
            if (!this.active) return;

            this.tooltip.style.left = e.clientX + 15 + "px";
            const tooltipRect = this.tooltip.getBoundingClientRect();
            const topPos = e.clientY + 15;
            if (topPos + tooltipRect.height > window.innerHeight) {
              this.tooltip.style.top =
                e.clientY - tooltipRect.height - 15 + "px";
            } else {
              this.tooltip.style.top = topPos + "px";
            }

            if (e.clientY < 40) {
              if (this.targetEl) {
                this.targetEl.classList.remove("guide-highlight");
                this.targetEl = null;
              }
              this.tooltip.style.opacity = "0";
              this.tooltip.style.transform = "translateY(10px)";
              return;
            }

            const el = document.elementFromPoint(e.clientX, e.clientY);
            const guideEl = el ? el.closest("[data-guide]") : null;
            if (guideEl !== this.targetEl) {
              if (this.targetEl)
                this.targetEl.classList.remove("guide-highlight");
              this.targetEl = guideEl;
              if (this.targetEl) {
                this.targetEl.classList.add("guide-highlight");
                this.tooltip.textContent =
                  this.targetEl.getAttribute("data-guide");
                this.tooltip.style.opacity = "1";
                this.tooltip.style.transform = "translateY(0)";
              } else {
                this.tooltip.style.opacity = "0";
                this.tooltip.style.transform = "translateY(10px)";
              }
            }
          });

          const blockEvent = (e) => {
            if (this.active) {
              if (e.target.closest("#guideBanner")) return;
              if (e.target.closest(".guide-modal-overlay")) return;

              if (e.type === "keydown" && e.key === "Escape") {
                this.close();
                e.preventDefault();
                e.stopPropagation();
                return;
              }

              const isInteractive = e.target.closest(
                "button, input, textarea, select, label, canvas, [onclick]",
              );

              if (
                e.type === "click" ||
                e.type === "keydown" ||
                e.type === "keypress" ||
                ((e.type === "mousedown" ||
                  e.type === "pointerdown" ||
                  e.type === "touchstart") &&
                  isInteractive)
              ) {
                e.preventDefault();
                e.stopPropagation();
              }
            }
          };
          [
            "click",
            "mousedown",
            "pointerdown",
            "touchstart",
            "keydown",
            "keypress",
          ].forEach((evt) => {
            document.addEventListener(evt, blockEvent, true);
          });
        },
        open(triggerBtn) {
          if (!this.tooltip) this.init();
          this.active = true;
          this.banner.style.display = "flex";

          const section = triggerBtn.closest(".tool-section");
          if (section) {
            const guided = section.querySelectorAll("[data-guide]");
            guided.forEach((el) => el.classList.add("guide-available"));
          }
        },
        openOverlayGuide(overlayEl) {
          if (!this.tooltip) this.init();
          this.active = true;
          this.banner.style.display = "flex";

          if (overlayEl) {
            const guided = overlayEl.querySelectorAll("[data-guide]");
            guided.forEach((el) => el.classList.add("guide-available"));
          }
        },
        close() {
          this.active = false;
          this.banner.style.display = "none";
          if (this.targetEl) {
            this.targetEl.classList.remove("guide-highlight");
            this.targetEl = null;
          }
          this.tooltip.style.opacity = "0";
          this.tooltip.style.transform = "translateY(10px)";

          document.querySelectorAll(".guide-available").forEach((el) => {
            el.classList.remove("guide-available");
          });
        },
      };

      const Core = {
        AdaptiveRenderer: {
          getResampledImage(source, targetW, targetH, fitMode) {
            const srcW =
              source.naturalWidth || source.videoWidth || source.width;
            const srcH =
              source.naturalHeight || source.videoHeight || source.height;
            let dx = 0,
              dy = 0,
              dw = targetW,
              dh = targetH;
            let sx = 0,
              sy = 0,
              sw = srcW,
              sh = srcH;
            const iR = srcW / srcH,
              cR = targetW / targetH;
            if (fitMode === "contain") {
              if (iR > cR) {
                dw = targetW;
                dh = dw / iR;
                dy = (targetH - dh) / 2;
              } else {
                dh = targetH;
                dw = dh * iR;
                dx = (targetW - dw) / 2;
              }
            } else {
              if (iR > cR) {
                sh = srcH;
                sw = sh * cR;
                sx = (srcW - sw) / 2;
              } else {
                sw = srcW;
                sh = sw / cR;
                sy = (srcH - sh) / 2;
              }
            }
            const c = document.createElement("canvas");
            c.width = targetW;
            c.height = targetH;
            const ctx = c.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            if (sw > dw * 2 || sh > dh * 2) {
              let curW = sw,
                curH = sh;
              let curC = document.createElement("canvas");
              curC.width = curW;
              curC.height = curH;
              let curCtx = curC.getContext("2d");
              curCtx.imageSmoothingEnabled = true;
              curCtx.imageSmoothingQuality = "high";
              curCtx.drawImage(source, sx, sy, sw, sh, 0, 0, curW, curH);
              while (curW > dw * 2 && curH > dh * 2) {
                const nextW = Math.floor(curW / 2),
                  nextH = Math.floor(curH / 2);
                const nextC = document.createElement("canvas");
                nextC.width = nextW;
                nextC.height = nextH;
                const nextCtx = nextC.getContext("2d");
                nextCtx.imageSmoothingEnabled = true;
                nextCtx.imageSmoothingQuality = "high";
                nextCtx.drawImage(curC, 0, 0, nextW, nextH);
                curC = nextC;
                curW = nextW;
                curH = nextH;
              }
              ctx.drawImage(curC, 0, 0, curW, curH, dx, dy, dw, dh);
            } else {
              ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
            }
            return c;
          },
          renderBoard(images, options) {
            const count = images.length;
            if (count === 0) return null;
            let cols = options.cols || 0,
              rows = options.rows || 0;
            if (cols <= 0) {
              if (count === 4) {
                cols = 2;
                rows = 2;
              } else if (count === 9) {
                cols = 3;
                rows = 3;
              } else if (count === 16) {
                cols = 4;
                rows = 4;
              } else {
                cols = Math.ceil(Math.sqrt(count));
                rows = Math.ceil(count / cols);
              }
            } else if (rows <= 0) {
              rows = Math.ceil(count / cols);
            }
            
            let maxSrcW = 0,
              maxSrcH = 0,
              aspectRatios = [];
              
            let orientation = "square";
            images.forEach((item) => {
              const source = item.img || item;
              const w =
                source.naturalWidth || source.videoWidth || source.width;
              const h =
                source.naturalHeight || source.videoHeight || source.height;
              if (w > maxSrcW) maxSrcW = w;
              if (h > maxSrcH) maxSrcH = h;
              if (h > 0) aspectRatios.push(w / h);
            });
            aspectRatios.sort((a, b) => a - b);
            const medianAspect =
              aspectRatios[Math.floor(aspectRatios.length / 2)] || 1;
              
            if (medianAspect > 1.1) orientation = "landscape";
            else if (medianAspect < 0.9) orientation = "portrait";
            
            const gap = options.gap || 0;
            const outerMargin = 0;
            
            // 1. Create an Adaptive Resolution Planner.
            const planner = {
              exportWidth: 0,
              exportHeight: 0,
              tileWidth: 0,
              tileHeight: 0
            };
            
            if (options.autoWidth) {
              // Viewport-constrained layout model (Document Layout Engine)
              const maxLongEdge = 1800; // Configurable maximum long edge
              const minReadableTileW = 280; // Absolute minimum width for text readability
              
              // Calculate tile dimensions assuming we fit the entire storyboard inside maxLongEdge
              let tileW_widthConstrained = cols > 0 ? (maxLongEdge - outerMargin * 2 - gap * (cols - 1)) / cols : maxLongEdge;
              let tileW_heightConstrained = rows > 0 ? (maxLongEdge - outerMargin * 2 - gap * (rows - 1)) / (rows / medianAspect) : maxLongEdge;
              
              // Scale the entire storyboard to fit inside this bounding box while preserving aspect ratio
              let tileW = Math.min(tileW_widthConstrained, tileW_heightConstrained);
              
              // When multiple resolutions satisfy readability, always choose the smallest one.
              // This prevents unnecessarily upscaling low-resolution source images to fill the max viewport.
              if (maxSrcW > 0 && maxSrcW < tileW) {
                tileW = maxSrcW;
              }
              
              // Only exceed the maximum long edge if the planner can prove that readability would otherwise fail.
              if (tileW < minReadableTileW) {
                console.warn(`Adaptive Planner: Layout density too high. Bypassing max viewport to maintain minimum readability of ${minReadableTileW}px.`);
                tileW = minReadableTileW;
              }
              
              planner.tileWidth = tileW;
              planner.tileHeight = planner.tileWidth / medianAspect;
              
              planner.exportWidth = planner.tileWidth * cols + gap * (cols - 1) + outerMargin * 2;
              planner.exportHeight = planner.tileHeight * rows + gap * (rows - 1) + outerMargin * 2;
            } else {
              planner.exportWidth = options.targetWidth || 1920;
              planner.tileWidth = (planner.exportWidth - outerMargin * 2 - gap * (cols - 1)) / cols;
              planner.tileHeight = planner.tileWidth / medianAspect;
              planner.exportHeight = planner.tileHeight * rows + gap * (rows - 1) + outerMargin * 2;
            }
            
            const MAX_DIM = 8192;
            if (planner.exportWidth > MAX_DIM || planner.exportHeight > MAX_DIM) {
              const scale = Math.min(MAX_DIM / planner.exportWidth, MAX_DIM / planner.exportHeight);
              planner.exportWidth *= scale;
              planner.exportHeight *= scale;
              planner.tileWidth *= scale;
              planner.tileHeight *= scale;
            }
            
            planner.exportWidth = Math.round(planner.exportWidth);
            planner.exportHeight = Math.round(planner.exportHeight);
            planner.tileWidth = Math.round(planner.tileWidth);
            planner.tileHeight = Math.round(planner.tileHeight);
            
            console.log(
              `Adaptive Planner\nRows: ${rows}\nColumns: ${cols}\nImages: ${count}\nMedian Resolution: ${Math.round(maxSrcW)}x${Math.round(maxSrcH)}\nTile Size: ${planner.tileWidth}x${planner.tileHeight}\nExport Width: ${planner.exportWidth}\nExport Height: ${planner.exportHeight}\nFinal JPEG Size: ${planner.exportWidth}x${planner.exportHeight}`
            );
            
            const compCanvas = document.createElement("canvas");
            compCanvas.width = planner.exportWidth;
            compCanvas.height = planner.exportHeight;
            const ctx = compCanvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.fillStyle = options.bgColor || "#ffffff";
            ctx.fillRect(0, 0, planner.exportWidth, planner.exportHeight);
            
            for (let r = 0; r < rows; r++) {
              const rem = count - r * cols;
              const countInRow = Math.min(cols, rem);
              if (countInRow <= 0) break;
              const shiftX = ((cols - countInRow) * (planner.tileWidth + gap)) / 2;
              for (let c = 0; c < countInRow; c++) {
                const item = images[r * cols + c];
                const source = item.img || item;
                const x = Math.round(
                  outerMargin + c * (planner.tileWidth + gap) + shiftX,
                );
                const y = Math.round(outerMargin + r * (planner.tileHeight + gap));
                const tileCanvas = this.getResampledImage(
                  source,
                  planner.tileWidth,
                  planner.tileHeight,
                  options.fitMode || "cover",
                );
                ctx.drawImage(tileCanvas, x, y);
              }
            }
            return compCanvas;
          },
        },
        BlobRegistry: {
          urls: [],
          create(blob) {
            const url = URL.createObjectURL(blob);
            this.urls.push(url);
            return url;
          },
          revokeAll() {
            this.urls.forEach((url) => URL.revokeObjectURL(url));
            this.urls = [];
          },
        },
        AppState: {
          save(key, value) {
            try {
              localStorage.setItem("cts_" + key, value);
            } catch (e) {}
          },
          load(key) {
            try {
              return localStorage.getItem("cts_" + key);
            } catch (e) {
              return null;
            }
          },
          restoreInputs() {
            document.querySelectorAll(".persist-val").forEach((el) => {
              const saved = this.load(el.id);
              if (saved !== null) {
                el.value = saved;
              }
              el.addEventListener("change", () => this.save(el.id, el.value));
            });
            // Clear legacy local storage for dimensions
            localStorage.removeItem("exportWidth");
            localStorage.removeItem("exportHeight");
            document.querySelectorAll(".persist-chk").forEach((el) => {
              const saved = this.load(el.id);
              if (saved !== null) el.checked = saved === "true";
              el.addEventListener("change", () => this.save(el.id, el.checked));
            });
          },
        },
        Presets: {
          /* Control IDs captured per tool section. type: 'val' (input value)
             or 'chk' (checkbox checked). Only these are snapshotted/applied. */
          sections: {
            "section-logo": [
              { id: "globalFontFamily", type: "val" },
              { id: "fontSizeInput", type: "val" },
              { id: "fontColorPicker", type: "val" },
              { id: "boldToggle", type: "chk" },
              { id: "syncFilenameToggle", type: "chk" },
              { id: "globalPadding", type: "val" },
              { id: "globalImgPos", type: "val" },
              { id: "exportWidth", type: "val" },
              { id: "exportHeight", type: "val" },
              { id: "exportFormat", type: "val" },
            ],
            "section-pdf": [
              { id: "pdfFormat", type: "val" },
              { id: "splitMode", type: "val" },
              { id: "splitRows", type: "val" },
              { id: "splitCols", type: "val" },
            ],
            "section-stills-boards": [
              { id: "storyCols", type: "val" },
              { id: "storyFitMode", type: "val" },
              { id: "storyBgColor", type: "val" },
            ],
            "section-adlinks": [],
            "section-yt-helper": [],
          },
          storageKey(section) {
            return "cts_preset_" + section;
          },
          controlsFor(section) {
            return this.sections[section] || [];
          },
          list(section) {
            try {
              const raw = localStorage.getItem(this.storageKey(section));
              const arr = raw ? JSON.parse(raw) : [];
              return Array.isArray(arr) ? arr : [];
            } catch (e) {
              return [];
            }
          },
          save(section, name) {
            const title = (name || "").trim();
            if (!title || !section) return { ok: false, error: "Enter a preset name." };
            const controls = this.controlsFor(section);
            if (controls.length === 0)
              return { ok: false, error: "This tool has no saved settings yet." };
            const data = {};
            controls.forEach((c) => {
              const el = document.getElementById(c.id);
              if (!el) return;
              data[c.id] = c.type === "chk" ? (el.checked ? "1" : "0") : el.value;
            });
            const all = this.list(section).filter((p) => p.name !== title);
            all.push({ name: title, values: data });
            try {
              localStorage.setItem(this.storageKey(section), JSON.stringify(all));
            } catch (e) {
              return { ok: false, error: "Could not save preset." };
            }
            return { ok: true };
          },
          del(section, name) {
            const all = this.list(section).filter((p) => p.name !== name);
            try {
              localStorage.setItem(this.storageKey(section), JSON.stringify(all));
            } catch (e) {}
            return true;
          },
          apply(section, name) {
            const p = this.list(section).find((x) => x.name === name);
            if (!p || !p.values) return false;
            const controls = this.controlsFor(section);
            controls.forEach((c) => {
              const el = document.getElementById(c.id);
              if (!el || !(c.id in p.values)) return;
              if (c.type === "chk") {
                el.checked = p.values[c.id] === "1";
              } else {
                el.value = p.values[c.id];
              }
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            });
            return true;
          },
        },
        Utils: {
          sanitize(s) {
            return (s || "").replace(/\s+/g, "_").replace(/[\\\/:*?"<>|]/g, "");
          },
          debounce(func, wait) {
            let timeout;
            return function (...args) {
              clearTimeout(timeout);
              timeout = setTimeout(() => func.apply(this, args), wait);
            };
          },
          createDropZone(el, onFiles) {
            if (!el) return;
            el.ondragover = (e) => {
              e.preventDefault();
              el.classList.add("drag-over");
            };
            el.ondragleave = () => el.classList.remove("drag-over");
            el.ondrop = (e) => {
              e.preventDefault();
              el.classList.remove("drag-over");
              onFiles([...e.dataTransfer.files]);
            };
          },
        },
      };
