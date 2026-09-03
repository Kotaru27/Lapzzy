      const YouTubeHelper = {
        parseUrl(url) {
          return Engine.YouTube.parseUrl(url);
        },
        async fetchMetadata(id, type = "video") {
          const endpoints = {
            video: [
              `https://noembed.com/embed?url=https://youtube.com/watch?v=${id}`,
              `https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${id}&format=json`,
            ],
            playlist: [
              `https://yewtu.be/api/v1/playlists/${id}`,
            ],
            channel: [
              `https://noembed.com/embed?url=https://youtube.com/channel/${id}`,
            ],
          };
          
          const urls = endpoints[type] || endpoints.video;
          
          for (const endpoint of urls) {
            try {
              const res = await fetch(endpoint);
              if (!res.ok) continue;
              const data = await res.json();
              return {
                title: data.title || data.name || "Unknown",
                author: data.author_name || data.uploader || "Unknown",
                authorUrl: data.author_url || data.uploader_url || "",
                thumbnail:
                  data.thumbnail_url ||
                  data.thumbnail ||
                  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
                duration: data.duration
                  ? this.formatDuration(data.duration)
                  : null,
                type,
                id,
              };
            } catch (e) {
              continue;
            }
          }
          
          return {
            title: "Unknown",
            author: "Unknown",
            type,
            id,
            thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            error: "Failed to fetch metadata from all endpoints",
          };
        },
        generateCommands(parsed, options = {}) {
          return Engine.YouTube.generateCommands(parsed, options);
        },
        formatDuration(seconds) {
          return Engine.YouTube.formatDuration(seconds);
        },
      };

      const YouTubeHelperUI = {
        handlePaste(e) {
          const html = e.clipboardData.getData("text/html");
          if (html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const links = Array.from(doc.querySelectorAll("a"))
              .map((a) => a.href)
              .filter(
                (href) =>
                  href.includes("youtube.com") || href.includes("youtu.be"),
              );
            if (links.length > 0) {
              e.preventDefault();
              const target = e.target;
              const insertText = links.join("\n") + "\n";
              const start = target.selectionStart;
              const end = target.selectionEnd;
              target.value =
                target.value.substring(0, start) +
                insertText +
                target.value.substring(end);
              target.selectionStart = target.selectionEnd =
                start + insertText.length;
            }
          }
        },
        async analyze() {
          const urlText = document.getElementById("ytUrlInput").value.trim();
          const resultEl = document.getElementById("ytResult");
          const metadataPanel = document.getElementById("ytMetadataPanel");
          if (!urlText) return UI.showError("No URLs entered. Paste at least one YouTube link first.");
          const urls = urlText.split(/\s+/).filter(Boolean);

          resultEl.style.display = "block";
          resultEl.innerHTML =
            '<div style="padding:15px; text-align:center; color:var(--text-muted);"><span class="processing-pulse">Analyzing...</span></div>';

          try {
            let htmlContent = "";
            metadataPanel.style.display = "block";

            for (const url of urls) {
              const parsed = YouTubeHelper.parseUrl(url);
              if (!parsed) {
                htmlContent += `<div class="glass-panel" style="padding:15px; border:1px solid rgba(255,255,255,0.08); margin-bottom:10px; color:var(--danger);">Invalid YouTube URL: ${url}</div>`;
                continue;
              }
              const meta = await YouTubeHelper.fetchMetadata(
                parsed.id,
                parsed.type,
              );
              const cmds = YouTubeHelper.generateCommands(parsed, {
                outputPath: "~/Downloads",
                quality: "best",
                format: "mp4",
              });

              htmlContent += `<div class="glass-panel" style="padding:15px; border:1px solid rgba(255,255,255,0.08); margin-bottom:10px;">
                            <div style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap;">
                                <img src="${meta.thumbnail}" style="width:120px; height:68px; object-fit:cover; border-radius:6px; flex-shrink:0;" onerror="this.style.display='none'">
                                <div style="flex:1; min-width:0;">
                                    <h4 style="margin:0 0 6px; font-size:0.95rem; word-break:break-word;">${meta.title}</h4>
                                    <div style="font-size:0.8rem; color:var(--text-muted); display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                                        <span><i data-lucide="user" style="width:12px;height:12px;"></i> ${meta.author}</span>
                                        ${meta.duration ? `<span><i data-lucide="clock" style="width:12px;height:12px;"></i> ${meta.duration}</span>` : ""}
                                        <span style="text-transform:capitalize;">${parsed.type}</span>
                                    </div>
                                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                        <button class="liquid-btn copy-cmd-btn" data-cmd="${cmds.video.replace(/"/g, "&quot;")}" onclick="YouTubeHelperUI.copySpecificCommand(this)" style="padding:6px 12px; font-size:0.8rem;"><i data-lucide="copy" style="width:14px;height:14px;margin-right:6px;"></i> Copy Video Command</button>
                                        <button class="liquid-btn copy-cmd-btn" data-cmd="${cmds.audio.replace(/"/g, "&quot;")}" onclick="YouTubeHelperUI.copySpecificCommand(this)" style="padding:6px 12px; font-size:0.8rem;"><i data-lucide="music" style="width:14px;height:14px;margin-right:6px;"></i> Copy Audio Command</button>
                                    </div>
                                </div>
                            </div>
                        </div>`;
            }

            document.getElementById("ytMetadataContent").innerHTML =
              htmlContent;
            resultEl.style.display = "none";
            window.lucide.createIcons({
              root: document.getElementById("ytMetadataContent"),
            });
          } catch (e) {
            resultEl.innerHTML = `<div style="padding:15px; color:var(--danger);">Error: ${e.message}</div>`;
          }
        },
        copySpecificCommand(btn) {
          const text = btn.getAttribute("data-cmd");
          if (text) {
            if (navigator.clipboard && window.isSecureContext) {
              navigator.clipboard
                .writeText(text)
                .then(() => {
                  UI.showSuccess(btn, "Got it.");
                })
                .catch(() => {
                  this.copyToClipboardFallback(text);
                  UI.showSuccess(btn, "Got it.");
                });
            } else {
              this.copyToClipboardFallback(text);
              UI.showSuccess(btn, "Got it.");
            }
          }
        },
        copyToClipboardFallback(text) {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.top = "-9999px";
          textArea.style.left = "-9999px";
          textArea.style.width = "2em";
          textArea.style.height = "2em";
          textArea.style.padding = "0";
          textArea.style.border = "none";
          textArea.style.outline = "none";
          textArea.style.boxShadow = "none";
          textArea.style.background = "transparent";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand("copy");
          } catch (err) {}
          document.body.removeChild(textArea);
        },
      };
