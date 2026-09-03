// =====================================================================
// engine.js — PURE PROCESSING LOGIC (no DOM reads/writes)
// Phase 3: functions extracted verbatim from Tools.* methods.
// Original call sites now delegate here; behavior is unchanged.
// Loaded FIRST, before core.js/ui.js/tools.
// =====================================================================

const Engine = {
  /* ================================================================
     AD LINK DOWNLOADER — filename derivation
     Source: Tools.AdDownloader (app.js v1, generateDashboard section)
     ================================================================ */
  AdDownloader: {
    ignoredExts: [
      ".com", ".org", ".net", ".co", ".io", ".de", ".uk", ".us",
      ".info", ".biz", ".html", ".htm", ".php", ".asp", ".aspx",
      ".jsp",
    ],
    mediaExts: /\.(mp4|mov|avi|mkv|webm|flv|wmv|mp3|wav|ogg|m4a|aac|flac|jpg|jpeg|png|gif|webp|svg|bmp)\b/i,
    imageTypes: [
      "print", "ooh", "out of home", "outdoor", "billboard", "poster",
      "img", "image", "picture", "photo", "static", "display", "banner",
      "pic", "jpeg", "jpg", "png", "gif", "webp", "creative", "visual"
    ],
    audioTypes: [
      "radio", "audio", "podcast", "sound", "voice", "music", "spot"
    ],
    videoTypes: [
      "tv", "television", "video", "cinema", "pre-roll", "preroll",
      "mid-roll", "midroll", "post-roll", "postroll", "bumper",
      "in-stream", "instream", "ott", "ctv", "connected tv",
      "social video", "reels", "tiktok", "shorts", "story", "stories"
    ],

    extractExtension(displayText, linkString) {
      let extMatch =
        displayText.match(this.mediaExts) || linkString.match(this.mediaExts);
      if (!extMatch) {
        extMatch = displayText.match(/\.([a-zA-Z0-9]{2,4})$/i);
        if (!extMatch) {
          try {
            let urlObj = new URL(linkString);
            extMatch = urlObj.pathname.match(/\.([a-zA-Z0-9]{2,4})$/i);
          } catch (e) {
            extMatch = linkString.match(/\.([a-zA-Z0-9]{2,4})$/i);
          }
        }
      }
      let ext = extMatch ? extMatch[0].toLowerCase() : "";
      if (this.ignoredExts.includes(ext)) {
        ext = "";
      }
      return ext;
    },

    extFromAdType(adType) {
      let typeLower = adType.toLowerCase().trim();
      let ext = "";
      let matched = false;
      for (const t of this.imageTypes) {
        if (typeLower === t || typeLower.includes(" " + t + " ") || typeLower.startsWith(t + " ") || typeLower.endsWith(" " + t)) {
          ext = ".jpg";
          matched = true;
          break;
        }
      }
      if (!matched) {
        for (const t of this.audioTypes) {
          if (typeLower === t || typeLower.includes(" " + t + " ") || typeLower.startsWith(t + " ") || typeLower.endsWith(" " + t)) {
            ext = ".mp3";
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        for (const t of this.videoTypes) {
          if (typeLower === t || typeLower.includes(" " + t + " ") || typeLower.startsWith(t + " ") || typeLower.endsWith(" " + t)) {
            ext = ".mp4";
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        ext = ".mp4";
      }
      return ext;
    },

    deriveFinalNameParts(adNo, adType, displayText, linkString) {
      let ext = this.extractExtension(displayText, linkString);
      let clean = displayText
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ß/g, "ss");
      if (ext) {
        if (clean.toLowerCase().endsWith(ext)) {
          clean = clean.substring(0, clean.length - ext.length);
        }
      } else {
        ext = this.extFromAdType(adType);
      }
      clean = clean
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
      let typeNumberMatch = adType.match(/\d+/);
      let typeNumber = typeNumberMatch ? typeNumberMatch[0] : "";
      let typeBase = adType.replace(/\d+/g, "").trim();
      let typeBaseClean = typeBase
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
      if (typeNumber) {
        let regex = new RegExp(typeBaseClean, "i");
        clean = clean.replace(regex, typeBaseClean + typeNumber);
      }
      return {
        finalName: `AD${adNo}_${clean}${ext}`,
        clean: clean,
        ext: ext,
      };
    },

    deriveFinalName(adNo, adType, displayText, linkString) {
      return this.deriveFinalNameParts(adNo, adType, displayText, linkString)
        .finalName;
    },
  },

  /* ================================================================
     AD LINK GEN — output snippet builder
     Source: Tools.AdLinkGen.generate (app.js v1)
     ================================================================ */
  AdLinkGen: {
    base: {
      aldi: "https://aldimediaeu.blob.core.windows.net/aldimediaeu/",
      s3: "https://s3media-ml-eu.surveycenter.com/",
    },
    normFolder(v) {
      return (
        v
        .trim()
        .replace(/\s+/g, "/")
        .replace(/\/+/g, "/")
        .replace(/^\/|\/$/g, "") + "/"
      );
    },
    buildOutputs(server, folder, names, modeNew) {
      let ads = [],
        story = [];
      names.forEach((name) => {
        const ext = name.split(".").pop().toLowerCase();
        const url = this.base[server] + folder + name;
        if (ext === "jpg" || ext === "png") {
          ads.push(
            `<img src="${url}" class="zoomImage" style="max-width:80%">`,
          );
          story.push(
            `<img src="${url}" class="zoomImage" style="max-height:280px">`,
          );
        } else if (ext === "mp4") {
          let outUrl = url;
          if (modeNew) {
            outUrl = outUrl.replace(/^https:/, "").replace(/\.mp4$/i, "");
          }
          ads.push(outUrl);
          story.push(
            `<img src="${this.base[server] + folder + name.replace(".mp4", ".jpg")}" class="zoomImage" style="max-height:280px">`,
          );
        } else if (ext === "mp3") {
          ads.push(url);
          story.push(name);
        }
      });
      return { ads, story };
    },
  },

  /* ================================================================
     LOGO — brand↔logo fuzzy matching (normalized Levenshtein)
     Source: Tools.Logo.executeGenerateLinks (app.js v1)
     ================================================================ */
  Logo: {
    norm(s) {
      return s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    },
    levenshtein(a, b) {
      const matrix = Array(a.length + 1)
        .fill()
        .map(() => Array(b.length + 1).fill(0));
      for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
      for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          if (a[i - 1] === b[j - 1])
            matrix[i][j] = matrix[i - 1][j - 1];
          else
            matrix[i][j] =
              Math.min(
                matrix[i - 1][j - 1],
                matrix[i][j - 1],
                matrix[i - 1][j],
              ) + 1;
        }
      }
      return matrix[a.length][b.length];
    },
    pairScore(brandNorm, logoNorm) {
      if (brandNorm === logoNorm) return 1;
      if (logoNorm.includes(brandNorm) || brandNorm.includes(logoNorm))
        return (
          0.8 +
          (Math.min(logoNorm.length, brandNorm.length) /
            Math.max(logoNorm.length, brandNorm.length)) *
            0.1
        );
      const dist = this.levenshtein(brandNorm, logoNorm);
      const maxLen = Math.max(brandNorm.length, logoNorm.length);
      return maxLen === 0 ? 0 : 1 - dist / maxLen;
    },
    /* brands: string[], logos: {fname}[] -> map brandIdx -> logo object|null */
    matchBrandsToLogos(brands, logos) {
      let pairs = [];
      for (let i = 0; i < brands.length; i++) {
        for (let j = 0; j < logos.length; j++) {
          pairs.push({
            brandIdx: i,
            logoIdx: j,
            score: this.pairScore(
              this.norm(brands[i]),
              this.norm(logos[j].fname || ""),
            ),
          });
        }
      }
      pairs.sort((a, b) => b.score - a.score);
      let usedBrands = new Set();
      let usedLogos = new Set();
      let brandToLogo = {};
      for (const pair of pairs) {
        if (
          !usedBrands.has(pair.brandIdx) &&
          !usedLogos.has(pair.logoIdx)
        ) {
          brandToLogo[pair.brandIdx] = logos[pair.logoIdx];
          usedBrands.add(pair.brandIdx);
          usedLogos.add(pair.logoIdx);
        }
      }
      for (let i = 0; i < brands.length; i++) {
        if (!usedBrands.has(i)) {
          let fallback = null;
          for (let j = 0; j < logos.length; j++) {
            if (!usedLogos.has(j)) {
              fallback = logos[j];
              usedLogos.add(j);
              break;
            }
          }
          brandToLogo[i] = fallback;
        }
      }
      return brandToLogo;
    },
  },

  /* ================================================================
     YOUTUBE HELPER — URL parsing + command generation
     Source: Tools.YouTubeHelper (app.js v1) — already pure; moved here
     verbatim. formatDuration kept in YouTubeHelperUI-facing object
     below for compatibility.
     ================================================================ */
  YouTube: {
    parseUrl(url) {
      const patterns = {
        video: [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([^&\n?#]+)/,
          /youtube\.com\/live\/([^&\n?#]+)/,
        ],
        playlist: [
          /youtube\.com\/playlist\?list=([^&\n#]+)/,
          /youtube\.com\/watch\?.*[&?]list=([^&\n#]+)/,
        ],
        channel: [/youtube\.com\/(?:c\/|channel\/|user\/|@)([^&\n?#\/]+)/],
      };
      for (const [type, regexes] of Object.entries(patterns)) {
        for (const re of regexes) {
          const match = url.match(re);
          if (match) return { type, id: match[1], originalUrl: url };
        }
      }
      return null;
    },
    generateCommands(parsed, options = {}) {
      const {
        format = "mp4",
        quality = "best",
        embedSubs = false,
        metadata = true,
        thumbnail = false,
        outputPath = "",
      } = options;

      const base = "yt-dlp";

      const qualityPresets = {
        best: "bv*[height<=1080]+ba/b[height<=1080]",
        "1080p": "bv*[height<=1080]+ba/b[height<=1080]",
        "720p": "bv*[height<=720]+ba/b[height<=720]",
        "480p": "bv*[height<=480]+ba/b[height<=480]",
        audio: "bestaudio/b",
      };

      const qualityStr = qualityPresets[quality] || qualityPresets.best;

      const safePath = outputPath
        .trim()
        .replace(/\\+$/, "")
        .replace(/"/g, '\\"');
      const outPathArg = safePath ? `-P "${safePath}" ` : "";

      const commonFlags = [
        `--extractor-args "youtube:player_client=web_embedded"`,
        `--merge-output-format ${format}`,
        embedSubs ? "--embed-subs" : "",
        metadata ? "--embed-metadata" : "",
        thumbnail ? "--embed-thumbnail" : "",
        "--no-playlist",
        "--restrict-filenames",
        "-o",
        `"%(title)s.%(ext)s"`,
        "-f",
        `"${qualityStr}"`,
      ]
        .filter(Boolean)
        .join(" ");

      const baseCmd = `${base} ${outPathArg}`;

      return {
        video: `${baseCmd}${commonFlags} "${parsed.originalUrl}"`,
        audio: `${base} ${outPathArg}--extractor-args "youtube:player_client=web_embedded" -x --audio-format mp3 --restrict-filenames -o "%(title)s.%(ext)s" "${parsed.originalUrl}"`,
        fixCache: `${base} --rm-cache-dir`,
      };
    },
    formatDuration(seconds) {
      if (!seconds) return null;
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
    },
  },
};
