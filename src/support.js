/* PNG Asset Lab - support layer: diagnostics, storage, DOM helpers and Acode integration.
   Concatenated into the bundle by scripts/build.js (shares scope with core/packs/ui/main). */

/* ---------- Diagnostics ---------- */
var Diag = {
  dev: false,
  stage: "boot",
  entries: [],
  setStage: function (s) { Diag.stage = s; Diag.log("debug", "stage: " + s); },
  log: function (level, msg, err) {
    var line = new Date().toISOString().slice(11, 23) + " [" + level + "] [" + Diag.stage + "] " + msg;
    if (err) line += " :: " + (err && err.name ? err.name + ": " : "") + (err && err.message ? err.message : String(err));
    Diag.entries.push(line);
    if (Diag.entries.length > 200) Diag.entries.shift();
    try {
      if (level === "error") console.error("[PNGAssetLab]", line, err && err.stack ? err.stack : "");
      else if (level === "warn") console.warn("[PNGAssetLab]", line);
      else if (Diag.dev) console.log("[PNGAssetLab]", line);
    } catch (e) { /* console unavailable */ }
  },
  text: function () { return Diag.entries.join("\n"); }
};

/* ---------- Storage (verified at runtime, never assumed) ---------- */
var Store = {
  ok: false,
  probe: function () {
    try {
      var k = "pal:probe";
      window.localStorage.setItem(k, "1");
      Store.ok = window.localStorage.getItem(k) === "1";
      window.localStorage.removeItem(k);
    } catch (e) { Store.ok = false; Diag.log("warn", "localStorage unavailable; data will be session-only", e); }
    return Store.ok;
  },
  get: function (key, fallback) {
    if (!Store.ok) return fallback;
    try { var v = window.localStorage.getItem("pal:" + key); return v == null ? fallback : JSON.parse(v); }
    catch (e) { Diag.log("warn", "Store.get failed for " + key, e); return fallback; }
  },
  set: function (key, value) {
    if (!Store.ok) return false;
    try { window.localStorage.setItem("pal:" + key, JSON.stringify(value)); return true; }
    catch (e) { Diag.log("warn", "Store.set failed for " + key + " (quota?)", e); return false; }
  },
  remove: function (key) { if (!Store.ok) return; try { window.localStorage.removeItem("pal:" + key); } catch (e) { /* ignore */ } },
  clearAll: function () {
    if (!Store.ok) return;
    try {
      var del = [], i;
      for (i = 0; i < window.localStorage.length; i++) { var k = window.localStorage.key(i); if (k && k.indexOf("pal:") === 0) del.push(k); }
      del.forEach(function (k) { window.localStorage.removeItem(k); });
    } catch (e) { Diag.log("warn", "Store.clearAll failed", e); }
  }
};

/* ---------- DOM + data helpers (all dynamic text goes through textContent / setAttribute) ---------- */
var SVG_NS = "http://www.w3.org/2000/svg";
function h(tag, attrs, children) {
  var el = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    var v = attrs[k];
    if (v === false || v == null) return;
    if (k === "text") el.textContent = v;
    else if (k === "class") el.className = v;
    else el.setAttribute(k, v === true ? "" : v);
  });
  (children || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return el;
}
function icon(name, cls) {
  var wrap = document.createElement("span");
  wrap.className = "pal-ico" + (cls ? " " + cls : "");
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = ICONS[name] || ""; // ICONS are build-time constants from assets/icons, never user data
  return wrap;
}
function bytesToBase64(bytes) {
  var s = "", chunk = 0x8000;
  for (var i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(s);
}
function dataUrlToBytes(url) {
  var m = /^data:image\/png;base64,([A-Za-z0-9+\/]+={0,2})$/.exec(url);
  if (!m) throw new Error("Not a PNG data URI.");
  var bin = atob(m[1]), out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function formatBytes(n) { return n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(2) + " MB"; }
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
function canvasToPngBytes(canvas) {
  return new Promise(function (resolve, reject) {
    try {
      canvas.toBlob(function (blob) {
        if (!blob) return reject(new Error("The browser could not encode this canvas as PNG."));
        var fr = new FileReader();
        fr.onload = function () { resolve(new Uint8Array(fr.result)); };
        fr.onerror = function () { reject(fr.error || new Error("Could not read encoded PNG.")); };
        fr.readAsArrayBuffer(blob);
      }, "image/png");
    } catch (e) { reject(e); }
  });
}
function decodePngBytes(bytes) {
  return new Promise(function (resolve, reject) {
    var url = URL.createObjectURL(new Blob([bytes], { type: "image/png" })), img = new Image();
    img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("The image data is corrupt or cannot be decoded.")); };
    img.src = url;
  });
}

/* ---------- Acode integration (documented APIs only; each call guarded) ---------- */
var AcodeIO = {
  has: function () { return typeof window !== "undefined" && !!window.acode; },
  mod: function (name) { try { return window.acode.require(name); } catch (e) { return null; } },
  exportDir: null,

  /* File browser -> {url,name}. Rejects with Error("cancelled") when the user backs out. */
  pickFile: function (info) {
    var fb = AcodeIO.mod("fileBrowser");
    if (!fb) return Promise.reject(new Error("The Acode file browser is not available. Use the system picker instead."));
    return Promise.resolve(fb("file", info || "Select a PNG image")).then(function (r) {
      if (!r || !r.url) throw new Error("cancelled");
      return { url: r.url, name: r.name || String(r.url).split("/").pop() };
    }, function () { throw new Error("cancelled"); });
  },
  pickFolder: function (info) {
    var fb = AcodeIO.mod("fileBrowser");
    if (!fb) return Promise.reject(new Error("The Acode file browser is not available."));
    return Promise.resolve(fb("folder", info || "Choose export folder")).then(function (r) {
      if (!r || !r.url) throw new Error("cancelled");
      return r.url;
    }, function () { throw new Error("cancelled"); });
  },
  readFile: function (url) {
    var fsMod = AcodeIO.mod("fsOperation") || AcodeIO.mod("fs");
    if (!fsMod) return Promise.reject(new Error("Acode file system API is not available."));
    return Promise.resolve(fsMod(url)).then(function (f) { return f.readFile(); }).then(function (data) {
      if (data instanceof ArrayBuffer) return new Uint8Array(data);
      if (data && data.buffer instanceof ArrayBuffer) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      throw new Error("Acode returned text instead of binary data for this file.");
    });
  },
  joinUrl: function (dir, name) {
    var U = AcodeIO.mod("url");
    try { if (U && typeof U.join === "function") return U.join(dir, name); } catch (e) { /* fall through */ }
    return dir.replace(/\/+$/, "") + "/" + name;
  },
  exists: function (dir, name) {
    var fsMod = AcodeIO.mod("fsOperation") || AcodeIO.mod("fs");
    if (!fsMod) return Promise.resolve(false);
    return Promise.resolve(fsMod(AcodeIO.joinUrl(dir, name))).then(function (f) { return f.exists(); }).then(Boolean, function () { return false; });
  },
  /* Writes one file into dir. Tries createFile(ArrayBuffer); falls back to createFile('') + writeFile(ArrayBuffer). Verifies afterwards. */
  writeBinary: function (dir, name, bytes) {
    var fsMod = AcodeIO.mod("fsOperation") || AcodeIO.mod("fs");
    if (!fsMod) return Promise.reject(new Error("Acode file system API is not available."));
    var buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return Promise.resolve(fsMod(dir)).then(function (d) {
      return Promise.resolve(d.createFile(name, buf)).catch(function (e1) {
        Diag.log("warn", "createFile(ArrayBuffer) failed, trying createFile('') + writeFile", e1);
        return Promise.resolve(d.createFile(name, "")).then(function (url) { return Promise.resolve(fsMod(url)).then(function (f) { return f.writeFile(buf); }); });
      });
    }).then(function () { return AcodeIO.exists(dir, name); }).then(function (ok) {
      if (!ok) throw new Error("Write finished but " + name + " was not found afterwards.");
      return true;
    });
  },
  writeText: function (dir, name, text) { return AcodeIO.writeBinary(dir, name, Core.utf8(text)); },
  copyText: function (text) {
    function legacy() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacy(); });
    }
    return Promise.resolve(legacy());
  },
  /* Browser fallback used only when Acode's fs is unavailable (e.g. desktop test harness). */
  browserDownload: function (name, bytes, mime) {
    var url = URL.createObjectURL(new Blob([bytes], { type: mime || "application/octet-stream" }));
    var a = document.createElement("a"); a.href = url; a.download = name; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 2000);
  }
};
