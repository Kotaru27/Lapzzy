      const UI = {
        /* LAPSSY tool accents — muted family hues. Identity kept, neon gone. Data-only change. */
        ToolColors: {
          home:             { accent: "#e7b965", soft: "rgba(231, 185, 101, 0.12)", glow: "rgba(231, 185, 101, 0.15)" },
          "section-logo":   { accent: "#d8a08c", soft: "rgba(216, 160, 140, 0.12)", glow: "rgba(216, 160, 140, 0.15)" },
          "section-pdf":    { accent: "#a8b4d4", soft: "rgba(168, 180, 212, 0.12)", glow: "rgba(168, 180, 212, 0.15)" },
          "section-stills-boards": { accent: "#a9c4a2", soft: "rgba(169, 196, 162, 0.12)", glow: "rgba(169, 196, 162, 0.15)" },
          "section-adlinks":{ accent: "#d4a86a", soft: "rgba(212, 168, 106, 0.12)", glow: "rgba(212, 168, 106, 0.15)" },
          "section-yt-helper": { accent: "#d49e9e", soft: "rgba(212, 158, 158, 0.12)", glow: "rgba(212, 158, 158, 0.15)" },
        },
        els: {
          sidebar: document.getElementById("mainSidebar"),
          viewApp: document.getElementById("view-app"),
          viewHome: document.getElementById("view-home"),
          lightbox: document.getElementById("lightbox"),
          lightboxImg: document.getElementById("lightboxImg"),
          toast: document.getElementById("errorToast"),
        },
        switchViews(fn) {
          const token = (this._switchToken = (this._switchToken || 0) + 1);
          [this.els.viewApp, this.els.viewHome].forEach((el) =>
            el && el.classList.add("leaving")
          );
          setTimeout(() => {
            if (token !== this._switchToken) return;
            fn();
            [this.els.viewApp, this.els.viewHome].forEach(
              (el) => el && el.classList.remove("leaving"),
            );
          }, 160);
        },
        _showHome() {
          document.body.classList.remove("tool-active");
          this.els.sidebar.classList.remove("visible");
          this.els.viewApp.classList.remove("active");
          this.els.viewHome.classList.remove("hidden");
          this.updateNav("nav-home");
          this.applyTheme("home");
          document.querySelectorAll(".home-card").forEach((card) => {
            const m = (card.getAttribute("onclick") || "").match(/openTool\('([^']+)'\)/);
            const c = m && this.ToolColors[m[1]];
            if (c) {
              const tint = this.accentTint(c.accent);
              card.style.setProperty("--accent", c.accent);
              card.style.setProperty("--accent-soft", tint.soft);
              card.style.setProperty("--accent-glow", tint.glow);
            }
          });
          Core.AppState.save("activeTool", "home");
          Object.values(Tools).forEach((tool) => {
            if (tool.destroy) tool.destroy();
          });
          if (window.HomeTypewriters) {
            window.HomeTypewriters.forEach((tw) => tw.type());
            document.getElementById("homeContent").style.pointerEvents = "all";
            document.querySelectorAll(".home-item").forEach((item) => {
              item.style.transition =
                "color 0.4s ease, text-shadow 0.4s ease, transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), filter 0.4s ease";
            });
          }
        },
        showHome() {
          const core = () => this._showHome();
          if (this.els.viewApp.classList.contains("active")) this.switchViews(core);
          else core();
        },
        _openTool(id, mode) {
          document.body.classList.add("tool-active");
          this.els.sidebar.classList.add("visible");
          this.els.viewHome.classList.add("hidden");
          document
            .querySelectorAll(".tool-section")
            .forEach((e) => e.classList.remove("active"));
          document.getElementById(id).classList.add("active");
          this.els.viewApp.classList.add("active");
          const navMap = {
            "section-logo": "nav-logo",
            "section-yt-helper": "nav-yt-helper",
          };
          const singleMode = {
            "section-pdf": (m) => (m === "split" ? "split" : "convert"),
            "section-stills-boards": (m) => (m === "story" ? "story" : "video"),
            "section-adlinks": (m) =>
              m === "downloader" ? "downloader" : "gen",
          };
          const navByMode = {
            "section-pdf": { convert: "nav-pdf-image", split: "nav-pdf-split" },
            "section-stills-boards": { video: "nav-stills", story: "nav-story" },
            "section-adlinks": { gen: "nav-adlinks-gen", downloader: "nav-adlinks-dl" },
          };
          const tabRows = {
            "section-pdf": "tabRowPdf",
            "section-stills-boards": "tabRowStills",
            "section-adlinks": "tabRowAdlinks",
          };
          const headerByMode = {
            "section-pdf": { convert: "PDF to Image", split: "Image Splitter" },
            "section-stills-boards": { video: "Video Stills", story: "Storyboard" },
            "section-adlinks": { gen: "Link Gen", downloader: "Ad Link Downloader" },
          };
          let navId = navMap[id];
          const resolver = singleMode[id];
          if (resolver) {
            const resolved = resolver(mode);
            const row = tabRows[id] && document.getElementById(tabRows[id]);
            if (row) row.style.display = "none";
            if (id === "section-pdf") this.switchPdfTab(resolved);
            else if (id === "section-stills-boards") this.switchStillsTab(resolved);
            else if (id === "section-adlinks") this.switchAdlinksTab(resolved);
            navId = navByMode[id][resolved];
            const h2 = document.querySelector("#" + id + " .tool-header h2");
            if (h2) h2.textContent = headerByMode[id][resolved];
          }
          this.updateNav(navId);
          this.applyTheme(id);
          Core.AppState.save("activeTool", id);
        },
        openTool(id, mode) {
          const core = () => this._openTool(id, mode);
          if (this.els.viewApp.classList.contains("active")) this.switchViews(core);
          else core();
        },
        switchPdfTab(tabId) {
          const convertTab = document.getElementById("pdfTabConvert");
          const splitTab = document.getElementById("pdfTabSplit");
          const convertContent = document.getElementById(
            "pdfTabContentConvert",
          );
          const splitContent = document.getElementById("pdfTabContentSplit");
          if (tabId === "convert") {
            convertTab.classList.add("active-mode");
            convertTab.style.background = "";
            convertTab.style.border = "";
            splitTab.classList.remove("active-mode");
            splitTab.style.background = "transparent";
            splitTab.style.border = "1px solid transparent";
            convertContent.style.display = "block";
            splitContent.style.display = "none";
            this.syncTabAria(convertTab, splitTab, convertContent, splitContent);
          } else if (tabId === "split") {
            splitTab.classList.add("active-mode");
            splitTab.style.background = "";
            splitTab.style.border = "";
            convertTab.classList.remove("active-mode");
            convertTab.style.background = "transparent";
            convertTab.style.border = "1px solid transparent";
            splitContent.style.display = "block";
            convertContent.style.display = "none";
            this.syncTabAria(splitTab, convertTab, splitContent, convertContent);
          }
        },
        switchStillsTab(tabId) {
          const storyTab = document.getElementById("stillsTabStory");
          const videoTab = document.getElementById("stillsTabVideo");
          const storyContent = document.getElementById("stillsTabContentStory");
          const videoContent = document.getElementById("stillsTabContentVideo");
          if (tabId === "story") {
            storyTab.classList.add("active-mode");
            storyTab.style.background = "";
            storyTab.style.border = "";
            videoTab.classList.remove("active-mode");
            videoTab.style.background = "transparent";
            videoTab.style.border = "1px solid transparent";
            storyContent.style.display = "block";
            videoContent.style.display = "none";
            this.syncTabAria(storyTab, videoTab, storyContent, videoContent);
          } else if (tabId === "video") {
            videoTab.classList.add("active-mode");
            videoTab.style.background = "";
            videoTab.style.border = "";
            storyTab.classList.remove("active-mode");
            storyTab.style.background = "transparent";
            storyTab.style.border = "1px solid transparent";
            videoContent.style.display = "block";
            storyContent.style.display = "none";
            this.syncTabAria(videoTab, storyTab, videoContent, storyContent);
          }
        },
        switchAdlinksTab(tabId) {
          const genTab = document.getElementById("adlinksTabGen");
          const dlTab = document.getElementById("adlinksTabDownloader");
          const genContent = document.getElementById("adlinksTabContentGen");
          const dlContent = document.getElementById(
            "adlinksTabContentDownloader",
          );
          if (tabId === "gen") {
            genTab.classList.add("active-mode");
            genTab.style.background = "";
            genTab.style.border = "";
            dlTab.classList.remove("active-mode");
            dlTab.style.background = "transparent";
            dlTab.style.border = "1px solid transparent";
            genContent.style.display = "block";
            dlContent.style.display = "none";
            this.syncTabAria(genTab, dlTab, genContent, dlContent);
          } else if (tabId === "downloader") {
            dlTab.classList.add("active-mode");
            dlTab.style.background = "";
            dlTab.style.border = "";
            genTab.classList.remove("active-mode");
            genTab.style.background = "transparent";
            genTab.style.border = "1px solid transparent";
            dlContent.style.display = "block";
            genContent.style.display = "none";
            this.syncTabAria(dlTab, genTab, dlContent, genContent);
          }
        },
        syncTabAria(activeTab, inactiveTab, activePanel, inactivePanel) {
          if (activeTab) activeTab.setAttribute("aria-selected", "true");
          if (inactiveTab) {
            inactiveTab.setAttribute("aria-selected", "false");
            inactiveTab.setAttribute("tabindex", "-1");
          }
          if (activePanel) activePanel.setAttribute("aria-hidden", "false");
          if (inactivePanel) inactivePanel.setAttribute("aria-hidden", "true");
        },
        updateNav(id) {
          document
            .querySelectorAll(".nav-item")
            .forEach((e) => e.classList.remove("active"));
          if (id) { const el = document.getElementById(id); if (el) el.classList.add("active"); }
        },
        accentTint(accentHex) {
          const isLight = document.body.classList.contains("light-mode");
          // LAPSSY: tints stay whisper-quiet in both themes. Data-only change.
          const softA = isLight ? 0.18 : 0.12;
          const glowA = isLight ? 0.2 : 0.16;
          const p =
            accentHex.length === 4
              ? accentHex.slice(1).split("").map((x) => x + x)
              : accentHex.slice(1).match(/.{2}/g);
          const r = parseInt(p[0], 16),
            g = parseInt(p[1], 16),
            b = parseInt(p[2], 16);
          return {
            soft: `rgba(${r}, ${g}, ${b}, ${softA})`,
            glow: `rgba(${r}, ${g}, ${b}, ${glowA})`,
          };
        },
        applyTheme(toolId) {
          const c = this.ToolColors[toolId] || this.ToolColors["home"];
          const tint = this.accentTint(c.accent);
          // Apply on <body> too: body.light-mode declares --accent directly on
          // the body element, which would otherwise shadow the inherited value
          // set on <html> and force every tool to the light-mode purple.
          const targets = [document.documentElement, document.body];
          targets.forEach((t) => {
            if (!t) return;
            const s = t.style;
            s.setProperty("--accent", c.accent);
            s.setProperty("--accent-hover", c.accent);
            s.setProperty("--accent-soft", tint.soft);
            s.setProperty("--accent-glow", tint.glow);
          });
        },
        toggleEmptyState(container, isEmpty) {
          if (container)
            container.querySelector(".empty-state-msg").style.display = isEmpty
              ? "flex"
              : "none";
        },
        showSuccess(btn, text = "Done") {
          const old = btn.innerText;
          btn.innerText = text;
          btn.style.borderColor = "var(--success)";
          setTimeout(() => {
            btn.innerText = old;
            btn.style.borderColor = "var(--border)";
          }, 1500);
        },
        showError(msg) {
          this.els.toast.innerText = msg;
          this.els.toast.classList.add("visible");
          setTimeout(() => this.els.toast.classList.remove("visible"), 4000);
        },
        /* In-app confirmation dialog (replaces native confirm()).
           Returns a Promise<boolean>. options: { title, message, okLabel, cancelLabel } */
        confirm(options) {
          const o = options || {};
          const overlay = document.getElementById("confirmOverlay");
          const title = document.getElementById("confirmTitle");
          const body = document.getElementById("confirmBody");
          const okBtn = document.getElementById("confirmOkBtn");
          const cancelBtn = document.getElementById("confirmCancelBtn");
          if (!overlay) return Promise.resolve(true);
          title.textContent = o.title || "Absolutely sure?";
          body.textContent = o.message || "No take-backs, though.";
          if (o.okLabel) okBtn.textContent = o.okLabel;
          if (o.cancelLabel) cancelBtn.textContent = o.cancelLabel;
          if (window.lucide) window.lucide.createIcons({ root: overlay });

          return new Promise((resolve) => {
            let settled = false;
            let lastFocus = document.activeElement;
            const done = (val) => {
              if (settled) return;
              settled = true;
              overlay.hidden = true;
              document.removeEventListener("keydown", onKey, true);
              overlay.removeEventListener("click", onOverlayBg);
              okBtn.removeEventListener("click", onOk);
              cancelBtn.removeEventListener("click", onCancel);
              resolve(val);
              if (lastFocus && lastFocus.focus) lastFocus.focus();
            };
            const onOk = () => done(true);
            const onCancel = () => done(false);
            const onKey = (e) => {
              if (e.key === "Escape") { e.preventDefault(); done(false); }
              else if (e.key === "Enter") { e.preventDefault(); done(true); }
            };
            const onOverlayBg = (e) => {
              if (e.target === overlay) done(false);
            };
            overlay.addEventListener("click", onOverlayBg);
            okBtn.addEventListener("click", onOk);
            cancelBtn.addEventListener("click", onCancel);
            document.addEventListener("keydown", onKey, true);
            overlay.hidden = false;
            cancelBtn.focus();
          });
        },
        /* Undo toast: shows a message with an Undo button that triggers callback. */
        undoToast(message, onUndo) {
          const toast = document.getElementById("undoToast");
          const msg = document.getElementById("undoToastMsg");
          const btn = document.getElementById("undoToastBtn");
          if (!toast) return;
          if (this._undoTimer) clearTimeout(this._undoTimer);
          msg.textContent = message;
          btn.onclick = () => {
            toast.hidden = true;
            if (typeof onUndo === "function") onUndo();
          };
          toast.hidden = false;
          this._undoTimer = setTimeout(() => { toast.hidden = true; }, 7000);
        },
        activeToolId() {
          return Core.AppState.load("activeTool") || "home";
        },
        toolDisplayName(section) {
          const map = {
            home: "Home",
            "section-logo": "Logo Workspace",
            "section-pdf": "PDF Tools",
            "section-stills-boards": "Stills & Boards",
            "section-adlinks": "Ad Links & Downloader",
            "section-yt-helper": "Video Downloads",
          };
          return map[section] || "He Tool";
        },
        openPresets() {
          const overlay = document.getElementById("presetsOverlay");
          if (!overlay) return;
          const section = this.activeToolId();
          if (!Core.Presets.controlsFor(section) ||
              Core.Presets.controlsFor(section).length === 0) {
            this.showError("No reusable settings for the current view yet.");
            return;
          }
          this._presetReturnFocus = document.activeElement;
          const nameInput = document.getElementById("presetsNameInput");
          if (nameInput) nameInput.value = "";
          document.getElementById("presetsSub").textContent =
            "Settings kept for " + this.toolDisplayName(section) + ".";
          this.renderPresets(section);
          overlay.hidden = false;
          document.getElementById("presetsCloseBtn").focus();
          if (window.lucide) window.lucide.createIcons({ root: overlay });
        },
        closePresets() {
          const overlay = document.getElementById("presetsOverlay");
          if (!overlay) return;
          overlay.hidden = true;
          if (this._presetReturnFocus && this._presetReturnFocus.focus) {
            const target = this._presetReturnFocus;
            this._presetReturnFocus = null;
            target.focus();
          }
        },
        renderPresets(section) {
          const list = document.getElementById("presetsList");
          const empty = document.getElementById("presetsEmpty");
          const items = Core.Presets.list(section);
          list.innerHTML = "";
          if (items.length === 0) {
            if (empty) empty.style.display = "block";
            return;
          }
          if (empty) empty.style.display = "none";
          items.forEach((p) => {
            const row = document.createElement("div");
            row.className = "preset-item";
            const name = document.createElement("span");
            name.className = "preset-item-name";
            name.textContent = p.name;
            name.title = p.name;
            const actions = document.createElement("div");
            actions.className = "preset-item-actions";
            const applyBtn = document.createElement("button");
            applyBtn.type = "button";
            applyBtn.className = "preset-btn apply";
            applyBtn.textContent = "Use it";
            applyBtn.addEventListener("click", () => {
              Core.Presets.apply(section, p.name);
              this.closePresets();
              this.showSuccess(applyBtn, "Applied");
            });
            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "preset-btn";
            delBtn.textContent = "Delete";
            delBtn.addEventListener("click", () => {
              Core.Presets.del(section, p.name);
              this.renderPresets(section);
            });
            actions.appendChild(applyBtn);
            actions.appendChild(delBtn);
            row.appendChild(name);
            row.appendChild(actions);
            list.appendChild(row);
          });
        },
        savePreset() {
          const section = this.activeToolId();
          const nameInput = document.getElementById("presetsNameInput");
          const name = nameInput ? nameInput.value.trim() : "";
          if (!name) { this.showError("Enter a preset name."); if (nameInput) nameInput.focus(); return; }
          const res = Core.Presets.save(section, name);
          if (!res.ok) { this.showError(res.error || "Could not save preset."); return; }
          this.renderPresets(section);
          if (nameInput) nameInput.value = "";
          const ok = document.getElementById("presetsSaveBtn");
          this.showSuccess(ok, "Kept.");
        },
        openUpdatesOverlay() {
          document.getElementById("dontShowUpdatesOverlay").checked =
            Core.AppState.load("hideUpdatesOverlay") === "true";
          document.getElementById("updatesOverlay").classList.add("active");
          const btn = document.getElementById("whatsNewBtn");
          if (btn) btn.classList.remove("whats-new-highlight");
          Core.AppState.save(
            "lastSeenUpdateVersion",
            window.CURRENT_APP_VERSION || "v1",
          );
        },
        closeUpdatesOverlay() {
          const checked = document.getElementById(
            "dontShowUpdatesOverlay",
          ).checked;
          Core.AppState.save("hideUpdatesOverlay", checked);
          document.getElementById("updatesOverlay").classList.remove("active");
        },
        openKeywordGuide() {
          const overlay = document.getElementById("keywordGuideOverlay");
          const list = document.getElementById("keywordGuideList");
          const tools = [
            {
              id: "section-logo",
              keyword: "logo",
              title: "Logo Workspace",
              desc: "Resize & Brand Images",
              icon: "image",
            },
            {
              id: "section-pdf",
              tab: "convert",
              keyword: "pdf",
              title: "pdf to image",
              desc: "Split & Convert PDFs",
              icon: "file-text",
            },
            {
              id: "section-pdf",
              tab: "split",
              keyword: "image",
              title: "image splitter",
              desc: "Slice images into grid files",
              icon: "crop",
            },
            {
              id: "section-stills-boards",
              tab: "video",
              keyword: "stills",
              title: "video stills",
              desc: "Process Video Frames",
              icon: "film",
            },
            {
              id: "section-stills-boards",
              tab: "story",
              keyword: "story",
              title: "storyboards",
              desc: "Create custom layout boards",
              icon: "clapperboard",
            },
            {
              id: "section-adlinks",
              tab: "gen",
              keyword: "link",
              title: "link gen",
              desc: "Generate campaign tracking shortlinks",
              icon: "link-2",
            },
            {
              id: "section-adlinks",
              tab: "downloader",
              keyword: "downloader",
              title: "ad link downloader",
              desc: "Bulk download sheets media assets",
              icon: "download",
            },
            {
              id: "section-yt-helper",
              keyword: "yt",
              title: "Video Downloads",
              desc: "Extract YouTube Visuals",
              icon: "play-square",
            },
          ];

          // Keep the introductory text if it exists
          const p = list.querySelector("p");
          list.innerHTML = "";
          if (p) list.appendChild(p);

          const grid = document.createElement("div");
          grid.style.display = "grid";
          grid.style.gridTemplateColumns = "1fr";
          grid.style.gap = "10px";

          tools.forEach((t) => {
            const item = document.createElement("div");
            item.style.display = "flex";
            item.style.alignItems = "center";
            item.style.padding = "12px";
            item.style.border = "2px solid var(--border)";
            item.style.background = "var(--bg-panel)";

            item.innerHTML = `
                        <div style="flex:1;">
                            <div style="font-weight:bold; font-size:1.1rem; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                                <i data-lucide="${t.icon}" style="width:16px; height:16px;"></i> ${t.title}
                            </div>
                            <div style="font-size:0.8rem; color:var(--text-muted);">${t.desc}</div>
                        </div>
                        <div style="background:var(--bg-input); padding:6px 12px; font-family:'Inter', sans-serif; font-size:0.7rem; border:1px solid var(--border);">
                            ${t.keyword}
                        </div>
                    `;
            grid.appendChild(item);
          });

          list.appendChild(grid);

          if (window.lucide) window.lucide.createIcons({ root: grid });

          document.getElementById("dontShowKeywordGuide").checked =
            Core.AppState.load("hideKeywordGuide") === "true";

          overlay.classList.add("active");
        },
        closeKeywordGuide() {
          const overlay = document.getElementById("keywordGuideOverlay");
          const checked = document.getElementById(
            "dontShowKeywordGuide",
          ).checked;
          Core.AppState.save("hideKeywordGuide", checked);
          overlay.classList.remove("active");
        },
        openLightbox(src) {
          this.els.lightboxImg.src = src;
          this.els.lightbox.classList.add("active");
        },
        closeLightbox() {
          this.els.lightbox.classList.remove("active");
        },
        openCommandPalette() {
          document
            .getElementById("commandPaletteOverlay")
            .classList.add("active");
          document.getElementById("commandPaletteInput").focus();
          document.getElementById("commandPaletteInput").value = "";
          this.filterCommandPalette("");
        },
        closeCommandPalette() {
          document
            .getElementById("commandPaletteOverlay")
            .classList.remove("active");
        },
        filterCommandPalette(term) {
          const query = term.toLowerCase();
          const items = document.querySelectorAll(
            "#commandPaletteList .cmd-item",
          );
          let firstVisible = null;
          items.forEach((item) => {
            item.classList.remove("selected");
            if (item.innerText.toLowerCase().includes(query)) {
              item.style.display = "flex";
              if (!firstVisible) firstVisible = item;
            } else {
              item.style.display = "none";
            }
          });
          if (firstVisible) firstVisible.classList.add("selected");
        },
        handlePaletteKeyDown(e) {
          const overlay = document.getElementById("commandPaletteOverlay");
          if (!overlay.classList.contains("active")) return;

          const items = Array.from(
            document.querySelectorAll("#commandPaletteList .cmd-item"),
          ).filter((i) => i.style.display !== "none");
          if (items.length === 0) return;

          let selectedIdx = items.findIndex((i) =>
            i.classList.contains("selected"),
          );

          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (selectedIdx >= 0)
              items[selectedIdx].classList.remove("selected");
            selectedIdx = (selectedIdx + 1) % items.length;
            items[selectedIdx].classList.add("selected");
            items[selectedIdx].scrollIntoView({ block: "nearest" });
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (selectedIdx >= 0)
              items[selectedIdx].classList.remove("selected");
            selectedIdx = (selectedIdx - 1 + items.length) % items.length;
            items[selectedIdx].classList.add("selected");
            items[selectedIdx].scrollIntoView({ block: "nearest" });
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIdx >= 0) items[selectedIdx].click();
          } else if (e.key === "Escape") {
            e.preventDefault();
            this.closeCommandPalette();
          }
        },
        initTheme() {
          const savedTheme = Core.AppState.load("theme") || "dark";
          if (savedTheme === "light") {
            document.body.classList.add("light-mode");
          } else {
            document.body.classList.remove("light-mode");
          }
          this.updateThemeButton();
          const activeTool = Core.AppState.load("activeTool") || "home";
          this.applyTheme(activeTool);
        },
        toggleTheme() {
          const isLight = document.body.classList.toggle("light-mode");
          Core.AppState.save("theme", isLight ? "light" : "dark");
          this.updateThemeButton();
          const activeTool = Core.AppState.load("activeTool") || "home";
          this.applyTheme(activeTool);

          // Play retro audio
          if (window.RetroAudio) {
            window.RetroAudio.playSuccess();
          }
        },
        updateThemeButton() {
          const btn = document.getElementById("themeToggleBtn");
          if (btn && !btn.querySelector(".toggle-track")) {
            btn.innerHTML = `
                        <i data-lucide="moon" id="themeMoonIcon" style="width:14px; height:14px;"></i>
                        <span class="toggle-track">
                            <span class="toggle-thumb"></span>
                        </span>
                        <i data-lucide="sun" id="themeSunIcon" style="width:14px; height:14px;"></i>
                    `;

            if (window.lucide) {
              window.lucide.createIcons({ root: btn });
            }
          }
        },
      };
