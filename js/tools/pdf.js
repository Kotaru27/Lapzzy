Tools.Pdf = {
          collection: {},
          currentId: null,
          abortCtrl: null,
          els: {
            dropZone: document.getElementById("pdfDropZone"),
            input: document.getElementById("pdfInput"),
            stacks: document.getElementById("pdfStacksContainer"),
            empty: document.getElementById("pdfEmptyState"),
            format: document.getElementById("pdfFormat"),
            clearBtn: document.getElementById("clearPdfBtn"),
            cancelBtn: document.getElementById("cancelPdfBtn"),
            progress: document.getElementById("pdfProgress"),
            status: document.getElementById("pdfStatusText"),
            percent: document.getElementById("pdfStatusPercent"),
            bar: document.getElementById("pdfProgressBar"),
            overlay: document.getElementById("pdfDetailOverlay"),
            title: document.getElementById("pdfOverlayTitle"),
            count: document.getElementById("pdfOverlayCount"),
            grid: document.getElementById("pdfOverlayGrid"),
            selectAll: document.getElementById("pdfSelectAll"),
            dlSelected: document.getElementById("pdfDownloadSelected"),
          },
          init() {
            Core.Utils.createDropZone(this.els.dropZone, (f) =>
              this.handleFiles(f),
            );
            this.els.input.onchange = (e) => {
              this.handleFiles([...e.target.files]);
              this.els.input.value = "";
            };
            this.els.clearBtn.onclick = () => {
              const savedFiles = this._sourceFiles || [];
              UI.confirm({
                title: "Clear all PDFs?",
                message: "This removes every loaded PDF and its converted pages. You can undo this action.",
                okLabel: "Clear",
                cancelLabel: "Cancel",
              }).then((ok) => {
                if (!ok) return;
                const items = Array.from(this.els.stacks.children).filter(
                  (el) => !el.id.includes("Empty"),
                );
                window.applyThanosSnap(items).then(() => {
                  this.destroy();
                  if (savedFiles.length > 0) {
                    UI.undoToast("PDFs cleared", () => {
                      this._sourceFiles = savedFiles;
                      this.handleFiles(savedFiles);
                    });
                  }
                });
              });
            };
            this.els.cancelBtn.onclick = () => {
              if (this.abortCtrl) this.abortCtrl.abort();
            };
            this.els.selectAll.onchange = (e) =>
              this.toggleAll(e.target.checked);
            this.els.dlSelected.onclick = () => this.downloadSelected();
            document.addEventListener("keydown", (e) => {
              if (
                !this.currentId ||
                !this.els.overlay.classList.contains("active")
              )
                return;
              if (e.ctrlKey && e.key === "a") {
                e.preventDefault();
                this.els.selectAll.click();
              }
              if (e.ctrlKey && e.key === "s") {
                e.preventDefault();
                this.downloadSelected();
              }
            });
          },
          destroy() {
            this.collection = {};
            this.els.stacks.innerHTML = "";
            this.els.stacks.appendChild(this.els.empty);
            UI.toggleEmptyState(this.els.stacks, true);
            Core.BlobRegistry.revokeAll();
          },
          async handleFiles(files) {
            const pdfFiles = files.filter((f) => f.type === "application/pdf");
            this._sourceFiles = pdfFiles.slice();
            if (pdfFiles.length === 0)
              return UI.showError("No valid PDFs found. Upload PDF files only.");
            UI.toggleEmptyState(this.els.stacks, false);
            this.els.progress.classList.add("active");
            this.els.cancelBtn.style.display = "inline-flex";
            this.abortCtrl = new AbortController();
            const signal = this.abortCtrl.signal;
            try {
              for (const file of pdfFiles) {
                if (signal.aborted) break;
                await this.processSinglePdf(
                  file,
                  this.els.format.value,
                  signal,
                );
              }
            } catch (e) {
              if (e.name !== "AbortError") UI.showError(e.message);
            } finally {
              this.els.progress.classList.remove("active");
              this.els.cancelBtn.style.display = "none";
              this.abortCtrl = null;
            }
          },
          async processSinglePdf(file, format, signal) {
            const pdfId = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            this.els.status.innerText = `Loading ${file.name}...`;
            this.els.bar.style.width = "0%";
            try {
              const arrayBuffer = await file.arrayBuffer();
              const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
              const stack = document.createElement("div");
              stack.className = "pdf-stack-wrapper";
              stack.innerHTML = `<div class="processing-pulse" style="width:100%; height:200px; background:var(--bg-input); display:flex; align-items:center; justify-content:center; color:var(--text-muted);">Processing...</div><div class="stack-meta"><div class="stack-title">${file.name}</div><div class="stack-count">0/${pdf.numPages}</div></div>`;
              stack.onclick = () => this.openDetail(pdfId);
              this.els.stacks.prepend(stack);
              this.collection[pdfId] = {
                name: file.name,
                total: pdf.numPages,
                pages: [],
                format: format,
              };
              for (let i = 1; i <= pdf.numPages; i++) {
                if (signal.aborted)
                  throw new DOMException("Aborted", "AbortError");
                await new Promise((resolve) => setTimeout(resolve, 0));
                this.els.status.innerText = `Rendering ${file.name} (Page ${i}/${pdf.numPages})`;
                const pct = Math.round((i / pdf.numPages) * 100) + "%";
                this.els.percent.innerText = pct;
                this.els.bar.style.width = pct;
                stack.querySelector(".stack-count").innerText =
                  `${i}/${pdf.numPages}`;
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({
                  canvasContext: canvas.getContext("2d"),
                  viewport,
                }).promise;
                if (i === 1) {
                  stack.querySelector("div").replaceWith(
                    Object.assign(new Image(), {
                      src: canvas.toDataURL(format, 0.5),
                    }),
                  );
                }
                const blob = await new Promise((r) =>
                  canvas.toBlob(r, format, 0.9),
                );
                const url = Core.BlobRegistry.create(blob);
                this.collection[pdfId].pages.push({
                  num: i,
                  blob,
                  url,
                  checked: true,
                });
              }
              stack.querySelector(".stack-count").innerText =
                `${pdf.numPages} Pages`;
            } catch (err) {
              if (err.name !== "AbortError") {
                console.error(err);
                UI.showError(`Failed to process ${file.name}: ${err.message}`);
              }
            }
          },
          closeDetail() {
            this.els.overlay.classList.remove("active");
            this.currentId = null;
          },
          toggleAll(val) {
            if (!this.currentId) return;
            this.collection[this.currentId].pages.forEach(
              (p) => (p.checked = val),
            );
            this.els.grid
              .querySelectorAll(".detail-check")
              .forEach((c) => (c.checked = val));
          },
          downloadSingle(url, name) {
            const a = document.createElement("a");
            a.href = url;
            a.download = name;
            a.click();
          },
          async downloadSelected() {
            if (!this.currentId) return;
            const data = this.collection[this.currentId];
            const selected = data.pages.filter((p) => p.checked);
            if (selected.length === 0)
              return UI.showError("No pages selected. Tick at least one page first.");
            this.els.dlSelected.innerText = "Almost done. Probably.";
            const zip = new JSZip();
            const ext = data.format.split("/")[1] === "jpeg" ? "jpg" : "png";
            selected.forEach((p) => zip.file(`${p.num}.${ext}`, p.blob));
            const content = await zip.generateAsync({ type: "blob" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = `${data.name}_images.zip`;
            a.click();
            this.els.dlSelected.innerText = "Bag the picks (Ctrl+S)";
          },
        };

Tools.Split = {
          items: [],
          els: {
            drop: document.getElementById("splitDropZone"),
            input: document.getElementById("splitInput"),
            grid: document.getElementById("splitGrid"),
            processBtn: document.getElementById("processSplitBtn"),
            dlBtn: document.getElementById("downloadSplitBtn"),
            clearBtn: document.getElementById("clearSplitBtn"),
            mode: document.getElementById("splitMode"),
            rows: document.getElementById("splitRows"),
            cols: document.getElementById("splitCols"),
          },
          init() {
            Core.Utils.createDropZone(this.els.drop, (f) =>
              this.handleFiles(f),
            );
            this.els.input.onchange = (e) => {
              this.handleFiles([...e.target.files]);
              this.els.input.value = "";
            };
            this.els.processBtn.onclick = () => this.process();
            this.els.dlBtn.onclick = () => this.download();
            this.els.clearBtn.onclick = () => {
              const savedFiles = this.items.map((i) => i.file).filter(Boolean);
              UI.confirm({
                title: "Reset splitter?",
                message: "This removes the loaded image and resets split settings. You can undo this action.",
                okLabel: "Reset",
                cancelLabel: "Cancel",
              }).then((ok) => {
                if (!ok) return;
                const items = Array.from(this.els.grid.children).filter(
                  (el) => !el.id.includes("Empty"),
                );
                window.applyThanosSnap(items).then(() => {
                  this.destroy();
                  if (savedFiles.length > 0) {
                    UI.undoToast("Splitter reset", () => {
                      this.handleFiles(savedFiles);
                    });
                  }
                });
              });
            };
            [this.els.mode, this.els.rows, this.els.cols].forEach((el) =>
              el.addEventListener("input", () => this.updateGridLines()),
            );
          },
          destroy() {
            this.items.forEach((i) => URL.revokeObjectURL(i.url));
            this.items = [];
            this.render();
          },
          handleFiles(files) {
            const valid = files.filter((f) => f.type.startsWith("image/"));
            if (!valid.length) return;
            valid.forEach((file) =>
              this.items.push({
                file,
                img: null,
                url: Core.BlobRegistry.create(file),
                checked: true,
                splitBlobs: [],
              }),
            );
            this.render();
            this.els.processBtn.disabled = false;
          },
          updateGridLines() {
            const mode = this.els.mode.value,
              rIn = parseInt(this.els.rows.value) || 1,
              cIn = parseInt(this.els.cols.value) || 1;
            let rows = mode === "horz" || mode === "grid" ? rIn : 1;
            let cols = mode === "vert" || mode === "grid" ? cIn : 1;
            document
              .querySelectorAll(".split-preview-overlay")
              .forEach((el) => {
                el.style.setProperty("--rows", rows);
                el.style.setProperty("--cols", cols);
                el.innerHTML = "";
                for (let i = 0; i < rows * cols; i++) {
                  el.appendChild(document.createElement("div")).className =
                    "split-cell";
                }
              });
          },
          render() {
            this.els.grid.innerHTML = "";
            if (this.items.length === 0) {
              this.els.grid.innerHTML =
                '<div class="empty-state-msg" id="splitEmpty"><i data-lucide="scissors" style="width:50px; height:50px; opacity:0.5;"></i><p>No images</p></div>';
              this.els.processBtn.disabled = true;
              this.els.dlBtn.disabled = true;
              lucide.createIcons({ root: this.els.grid });
              return;
            }
            this.items.forEach((item) => {
              const card = document.createElement("div");
              card.className = "logo-card-item";
              card.innerHTML = `<div class="preview-box"><img src="${item.url}"><div class="split-preview-overlay"></div></div><div class="card-controls"><div style="font-size:0.8rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600;">${item.file.name}</div><label style="display:flex; gap:8px; align-items:center; font-size:0.9rem;"><input type="checkbox" class="split-check toggle-switch small" ${item.checked ? "checked" : ""}> Split</label><div class="split-status" style="font-size:0.75rem; color:var(--text-muted);">${item.splitBlobs.length > 0 ? "Done" : "Ready"}</div></div>`;
              this.els.grid.appendChild(card);
              item.card = card;
              card.querySelector(".split-check").onchange = (e) =>
                (item.checked = e.target.checked);
            });
            this.updateGridLines();
          },
          async process() {
            this.els.processBtn.innerText = "Barely trying, still winning…";
            await new Promise((r) => setTimeout(r, 100));
            const mode = this.els.mode.value;
            const rInput = parseInt(this.els.rows.value) || 1;
            const cInput = parseInt(this.els.cols.value) || 1;
            let rows = 1,
              cols = 1;
            if (mode === "grid") {
              rows = rInput;
              cols = cInput;
            } else if (mode === "vert") {
              cols = cInput;
            } else if (mode === "horz") {
              rows = rInput;
            }
            for (const item of this.items) {
              if (!item.checked) continue;
              if (!item.img) {
                item.img = new Image();
                item.img.src = item.url;
                await new Promise((r) => (item.img.onload = r));
              }
              item.splitBlobs = [];
              const pW = item.img.naturalWidth / cols;
              const pH = item.img.naturalHeight / rows;
              for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                  const cvs = document.createElement("canvas");
                  cvs.width = pW;
                  cvs.height = pH;
                  cvs
                    .getContext("2d")
                    .drawImage(item.img, c * pW, r * pH, pW, pH, 0, 0, pW, pH);
                  item.splitBlobs.push({
                    blob: await new Promise((res) =>
                      cvs.toBlob(res, item.file.type),
                    ),
                  });
                }
              }
              item.card.querySelector(".split-status").innerText =
                `Done (${rows * cols})`;
            }
            this.els.processBtn.innerText = "Process";
            this.els.dlBtn.disabled = false;
          },
          async download() {
            this.els.dlBtn.innerText = "Almost done. Probably.";
            const zip = new JSZip();
            let count = 1;
            this.items.forEach((item) => {
              const ext = item.file.name.split(".").pop();
              if (item.checked && item.splitBlobs.length > 0)
                item.splitBlobs.forEach((b) => {
                  zip.file(`${count}.${ext}`, b.blob);
                  count++;
                });
              else {
                zip.file(`${count}.${ext}`, item.file);
                count++;
              }
            });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(
              await zip.generateAsync({ type: "blob" }),
            );
            a.download = "split_images.zip";
            a.click();
            this.els.dlBtn.innerText = "Bag the pieces";
          },
        };
