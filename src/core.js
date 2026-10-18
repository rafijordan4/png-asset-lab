/* PNG Asset Lab - core logic. No DOM, no Acode APIs: usable from Node tests and from the plugin bundle. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PNGLabCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VERSION = "1.0.0";
  var LIMITS = { maxImageSide: 8192, maxPixels: 16e6, maxSprites: 4096, maxFileBytes: 32 * 1024 * 1024 };

  /* ---------- numbers ---------- */
  function isInt(n) { return typeof n === "number" && isFinite(n) && Math.floor(n) === n; }
  function toInt(v, fallback) { var n = parseInt(v, 10); return isFinite(n) ? n : fallback; }
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  function pad(n, width) { var s = String(n); while (s.length < width) s = "0" + s; return s; }

  /* ---------- filenames ---------- */
  var RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  function sanitizeName(name, fallback) {
    var s = String(name == null ? "" : name).normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    s = s.replace(/\.[A-Za-z0-9]{1,5}$/, "");            // strip extension
    s = s.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/_+/g, "_").replace(/^[_-]+|[_-]+$/g, "");
    if (s.length > 60) s = s.slice(0, 60);
    if (!s || RESERVED.test(s)) s = fallback || "sprite";
    return s;
  }
  function isValidFilename(name) {
    return typeof name === "string" && name.length > 0 && name.length <= 120 &&
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) && !/\.\./.test(name) && !RESERVED.test(name.replace(/\.[^.]*$/, ""));
  }
  function digitsFor(count) { return Math.max(2, String(Math.max(1, count)).length); }
  function spriteFileName(base, sprite, count, ext) {
    return sanitizeName(base, "sprite") + "_" + pad(sprite.number, digitsFor(count)) + "." + (ext || "png");
  }
  function cssIdent(name, fallback) {
    var s = String(name == null ? "" : name).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
    if (!s) s = fallback || "sprite";
    if (/^[0-9]/.test(s) || /^-[0-9]/.test(s)) s = "s-" + s;
    return s;
  }

  /* ---------- PNG header ---------- */
  var PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  function isPng(bytes) {
    if (!bytes || bytes.length < 33) return false;
    for (var i = 0; i < 8; i++) if (bytes[i] !== PNG_SIG[i]) return false;
    return bytes[12] === 0x49 && bytes[13] === 0x48 && bytes[14] === 0x44 && bytes[15] === 0x52; // "IHDR"
  }
  function readPngHeader(bytes) {
    if (!isPng(bytes)) return null;
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var colorType = bytes[25];
    return {
      width: dv.getUint32(16), height: dv.getUint32(20), bitDepth: bytes[24], colorType: colorType,
      colorTypeName: ({ 0: "grayscale", 2: "RGB", 3: "indexed", 4: "grayscale+alpha", 6: "RGBA" })[colorType] || "unknown",
      hasAlphaChannel: colorType === 4 || colorType === 6, interlaced: bytes[28] === 1
    };
  }

  /* ---------- grid ---------- */
  function normGrid(p) {
    return {
      marginX: toInt(p.marginX, 0), marginY: toInt(p.marginY, 0),
      spacingX: toInt(p.spacingX, 0), spacingY: toInt(p.spacingY, 0)
    };
  }
  function finishGrid(g, imgW, imgH) {
    var errors = g.errors, warnings = g.warnings;
    if (!isInt(imgW) || !isInt(imgH) || imgW < 1 || imgH < 1) errors.push("Load an image first.");
    if (g.marginX < 0 || g.marginY < 0 || g.spacingX < 0 || g.spacingY < 0) errors.push("Margins and spacing cannot be negative.");
    if (!isInt(g.cols) || g.cols < 1) errors.push("Columns must be at least 1.");
    if (!isInt(g.rows) || g.rows < 1) errors.push("Rows must be at least 1.");
    if (!isInt(g.cellW) || g.cellW < 1) errors.push("Sprite width must be at least 1 px.");
    if (!isInt(g.cellH) || g.cellH < 1) errors.push("Sprite height must be at least 1 px.");
    if (!errors.length) {
      g.usedW = 2 * g.marginX + g.cols * g.cellW + (g.cols - 1) * g.spacingX;
      g.usedH = 2 * g.marginY + g.rows * g.cellH + (g.rows - 1) * g.spacingY;
      if (g.usedW > imgW) errors.push("Grid is " + g.usedW + " px wide but the image is only " + imgW + " px wide.");
      if (g.usedH > imgH) errors.push("Grid is " + g.usedH + " px tall but the image is only " + imgH + " px tall.");
      if (g.cols * g.rows > LIMITS.maxSprites) errors.push("Too many sprites (" + g.cols * g.rows + "). Limit is " + LIMITS.maxSprites + ".");
      if (!errors.length) {
        g.remainderX = imgW - g.usedW; g.remainderY = imgH - g.usedH;
        if (g.remainderX) warnings.push(g.remainderX + " px at the right edge are not covered by the grid.");
        if (g.remainderY) warnings.push(g.remainderY + " px at the bottom edge are not covered by the grid.");
      }
    }
    g.ok = errors.length === 0;
    return g;
  }
  /* mode "cells": user gives columns+rows, sprite size is derived */
  function gridFromCells(imgW, imgH, p) {
    var n = normGrid(p), g = { mode: "cells", cols: toInt(p.cols, NaN), rows: toInt(p.rows, NaN), marginX: n.marginX, marginY: n.marginY, spacingX: n.spacingX, spacingY: n.spacingY, errors: [], warnings: [] };
    if (isInt(g.cols) && g.cols > 0 && isInt(g.rows) && g.rows > 0 && isInt(imgW) && isInt(imgH)) {
      g.cellW = Math.floor((imgW - 2 * g.marginX - (g.cols - 1) * g.spacingX) / g.cols);
      g.cellH = Math.floor((imgH - 2 * g.marginY - (g.rows - 1) * g.spacingY) / g.rows);
    } else { g.cellW = NaN; g.cellH = NaN; }
    return finishGrid(g, imgW, imgH);
  }
  /* mode "size": user gives sprite size, columns+rows are derived */
  function gridFromSize(imgW, imgH, p) {
    var n = normGrid(p), g = { mode: "size", cellW: toInt(p.cellW, NaN), cellH: toInt(p.cellH, NaN), marginX: n.marginX, marginY: n.marginY, spacingX: n.spacingX, spacingY: n.spacingY, errors: [], warnings: [] };
    if (isInt(g.cellW) && g.cellW > 0 && isInt(g.cellH) && g.cellH > 0 && isInt(imgW) && isInt(imgH)) {
      g.cols = Math.floor((imgW - 2 * g.marginX + g.spacingX) / (g.cellW + g.spacingX));
      g.rows = Math.floor((imgH - 2 * g.marginY + g.spacingY) / (g.cellH + g.spacingY));
    } else { g.cols = NaN; g.rows = NaN; }
    return finishGrid(g, imgW, imgH);
  }
  function buildSprites(grid, baseName) {
    if (!grid || !grid.ok) return [];
    var list = [], base = sanitizeName(baseName, "sprite"), total = grid.cols * grid.rows, w = digitsFor(total);
    for (var r = 0; r < grid.rows; r++) for (var c = 0; c < grid.cols; c++) {
      var index = r * grid.cols + c;
      list.push({
        index: index, number: index + 1, col: c, row: r,
        x: grid.marginX + c * (grid.cellW + grid.spacingX), y: grid.marginY + r * (grid.cellH + grid.spacingY),
        width: grid.cellW, height: grid.cellH, name: base + "_" + pad(index + 1, w)
      });
    }
    return list;
  }
  function spriteAtPoint(grid, px, py) {
    if (!grid || !grid.ok) return -1;
    var x = px - grid.marginX, y = py - grid.marginY;
    if (x < 0 || y < 0) return -1;
    var sx = grid.cellW + grid.spacingX, sy = grid.cellH + grid.spacingY;
    var c = Math.floor(x / sx), r = Math.floor(y / sy);
    if (c >= grid.cols || r >= grid.rows) return -1;
    if (x - c * sx >= grid.cellW || y - r * sy >= grid.cellH) return -1; // inside spacing gap
    return r * grid.cols + c;
  }

  /* ---------- pixels / colours ---------- */
  function toHex(r, g, b, a) {
    function h(v) { return (v < 16 ? "0" : "") + v.toString(16).toUpperCase(); }
    return "#" + h(r) + h(g) + h(b) + (a === undefined || a === 255 ? "" : h(a));
  }
  function pixelAt(data, width, x, y) {
    var i = (y * width + x) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3], hex: toHex(data[i], data[i + 1], data[i + 2], data[i + 3]) };
  }
  function alphaStats(data) {
    var total = data.length / 4, transparent = 0, opaque = 0, semi = 0;
    for (var i = 3; i < data.length; i += 4) { var a = data[i]; if (a === 0) transparent++; else if (a === 255) opaque++; else semi++; }
    return { total: total, transparent: transparent, opaque: opaque, semi: semi, hasTransparency: transparent + semi > 0, empty: transparent === total };
  }
  function scaledSize(w, h, opts) {
    var o = opts || {}, nw, nh;
    if (isInt(o.width) && o.width > 0) { nw = o.width; nh = Math.round(h * nw / w); }
    else if (isInt(o.height) && o.height > 0) { nh = o.height; nw = Math.round(w * nh / h); }
    else if (typeof o.percent === "number" && o.percent > 0) { nw = Math.round(w * o.percent / 100); nh = Math.round(h * o.percent / 100); }
    else return null;
    nw = Math.max(1, nw); nh = Math.max(1, nh);
    if (nw > LIMITS.maxImageSide || nh > LIMITS.maxImageSide || nw * nh > LIMITS.maxPixels) return null;
    return { width: nw, height: nh };
  }

  /* ---------- metadata ---------- */
  function generateMetadata(img, grid, sprites, animation, allSprites) {
    var lookup = allSprites || sprites;
    var frames = animation && animation.frames && animation.frames.length ? animation.frames : null;
    var frameOf = {};
    if (frames) frames.forEach(function (idx, i) { if (frameOf[idx] === undefined) frameOf[idx] = i + 1; });
    return {
      generator: "PNG Asset Lab " + VERSION,
      image: { name: img.name, width: img.width, height: img.height },
      grid: { columns: grid.cols, rows: grid.rows, spriteWidth: grid.cellW, spriteHeight: grid.cellH, marginX: grid.marginX, marginY: grid.marginY, spacingX: grid.spacingX, spacingY: grid.spacingY },
      sprites: sprites.map(function (s) {
        var o = { name: s.name, index: s.index, number: s.number, column: s.col, row: s.row, x: s.x, y: s.y, width: s.width, height: s.height, frame: frameOf[s.index] === undefined ? null : frameOf[s.index] };
        if (s.empty !== undefined) o.empty = !!s.empty;
        return o;
      }),
      animation: frames ? { fps: animation.fps, loop: !!animation.loop, frameCount: frames.length, frames: frames.map(function (idx) { return lookup[idx] ? lookup[idx].name : null; }) } : null
    };
  }
  function metadataToJson(meta) { return JSON.stringify(meta, null, 2) + "\n"; }

  /* ---------- CSS ---------- */
  function px(v) { return v === 0 ? "0" : v + "px"; }
  function negPx(v) { return v === 0 ? "0" : "-" + v + "px"; }
  function cssString(url) { return String(url).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\n\r]/g, ""); }
  function generateImageCss(o) {
    var cls = cssIdent(o.className, "image"), s = o.scale || 1;
    var lines = ["." + cls + " {", "  display: inline-block;", "  width: " + px(o.width * s) + ";", "  height: " + px(o.height * s) + ";",
      '  background-image: url("' + cssString(o.imageUrl) + '");', "  background-repeat: no-repeat;", "  background-size: 100% 100%;"];
    if (o.pixelArt) lines.push("  image-rendering: pixelated;");
    lines.push("}");
    return lines.join("\n") + "\n";
  }
  function generateSpriteCss(o) {
    var cls = cssIdent(o.className, "sprite"), s = clamp(toInt(o.scale, 1), 1, 16), sprites = o.sprites || [];
    if (!sprites.length) return "";
    var out = [];
    out.push("." + cls + " {", "  display: inline-block;", '  background-image: url("' + cssString(o.imageUrl) + '");', "  background-repeat: no-repeat;",
      "  background-size: " + px(o.imageWidth * s) + " " + px(o.imageHeight * s) + ";");
    if (o.pixelArt) out.push("  image-rendering: pixelated;");
    out.push("}", "");
    sprites.forEach(function (sp) {
      out.push("." + cls + "--" + cssIdent(sp.name, "frame") + " {", "  width: " + px(sp.width * s) + ";", "  height: " + px(sp.height * s) + ";",
        "  background-position: " + negPx(sp.x * s) + " " + negPx(sp.y * s) + ";", "}", "");
    });
    var a = o.animation;
    if (a && a.frames && a.frames.length > 1 && a.fps > 0) {
      var f = a.frames.map(function (i) { return o.allSprites[i]; }).filter(Boolean), n = f.length, dur = Math.round(n / a.fps * 1000) / 1000;
      var first = f[0];
      out.push("." + cls + "--play {", "  width: " + px(first.width * s) + ";", "  height: " + px(first.height * s) + ";",
        "  animation: " + cls + "-play " + dur + "s steps(1, end) " + (a.loop ? "infinite" : "1 forwards") + ";", "}", "", "@keyframes " + cls + "-play {");
      f.forEach(function (sp, i) {
        out.push("  " + (Math.round(i / n * 10000) / 100) + "% { background-position: " + negPx(sp.x * s) + " " + negPx(sp.y * s) + "; }");
      });
      var last = f[n - 1];
      out.push("  100% { background-position: " + negPx(last.x * s) + " " + negPx(last.y * s) + "; }", "}", "");
    }
    return out.join("\n").replace(/\n+$/, "\n");
  }

  /* ---------- ZIP (stored, no compression; PNGs are already compressed) ---------- */
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function utf8(str) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
    return new Uint8Array(Buffer.from(str, "utf8"));
  }
  function zipStore(files, date) {
    var d = date || new Date(), seen = {}, chunks = [], central = [], offset = 0;
    var dosTime = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() >> 1) & 31);
    var dosDate = (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
    files.forEach(function (f) {
      var name = String(f.name);
      if (!/^[A-Za-z0-9][A-Za-z0-9._\-\/]*$/.test(name) || /\.\.|\/\//.test(name)) throw new Error("Unsafe ZIP entry name: " + name);
      if (seen[name]) throw new Error("Duplicate ZIP entry name: " + name);
      seen[name] = true;
      var nameBytes = utf8(name), data = f.data, crc = crc32(data);
      var lh = new Uint8Array(30 + nameBytes.length), v = new DataView(lh.buffer);
      v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true); v.setUint16(8, 0, true);
      v.setUint16(10, dosTime, true); v.setUint16(12, dosDate, true); v.setUint32(14, crc, true);
      v.setUint32(18, data.length, true); v.setUint32(22, data.length, true); v.setUint16(26, nameBytes.length, true); v.setUint16(28, 0, true);
      lh.set(nameBytes, 30);
      var ch = new Uint8Array(46 + nameBytes.length), c = new DataView(ch.buffer);
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, dosTime, true); c.setUint16(14, dosDate, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, nameBytes.length, true); c.setUint32(42, offset, true); ch.set(nameBytes, 46);
      chunks.push(lh, data); central.push(ch); offset += lh.length + data.length;
    });
    var cdSize = central.reduce(function (s, b) { return s + b.length; }, 0);
    var end = new Uint8Array(22), e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
    var all = chunks.concat(central, [end]), total = all.reduce(function (s, b) { return s + b.length; }, 0), out = new Uint8Array(total), pos = 0;
    all.forEach(function (b) { out.set(b, pos); pos += b.length; });
    return out;
  }

  /* ---------- pack manifests (JSON only - never executed) ---------- */
  var PACK_ID_RE = /^[a-z0-9][a-z0-9-]{1,47}$/;
  var SEMVER_RE = /^\d+\.\d+\.\d+$/;
  var EXEC_KEYS = ["script", "scripts", "main", "eval", "code", "html", "onload", "onclick", "onerror", "function", "module"];
  var DATA_PNG_RE = /^data:image\/png;base64,[A-Za-z0-9+\/]+={0,2}$/;
  function isSafeRelativePath(p) {
    if (typeof p !== "string" || !p || p.length > 160) return false;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(p) || p.charAt(0) === "/" || p.indexOf("\\") !== -1 || p.indexOf("\0") !== -1) return false;
    var parts = p.split("/");
    for (var i = 0; i < parts.length; i++) if (!parts[i] || parts[i] === "." || parts[i] === "..") return false;
    return /\.png$/i.test(p);
  }
  /* mode: "bundled" (asset files resolved inside the plugin) or "imported" (assets must carry inline PNG data) */
  function validatePackManifest(m, mode, opts) {
    var errors = [], allowEmpty = !!(opts && opts.allowEmpty);
    function err(s) { errors.push(s); }
    if (!m || typeof m !== "object" || Array.isArray(m)) return { ok: false, errors: ["Manifest must be a JSON object."] };
    Object.keys(m).forEach(function (k) { if (EXEC_KEYS.indexOf(k.toLowerCase()) !== -1) err('Field "' + k + '" is not allowed (packs cannot contain executable code).'); });
    if (m.schema !== "png-asset-lab.pack/1") err('"schema" must be "png-asset-lab.pack/1".');
    if (typeof m.id !== "string" || !PACK_ID_RE.test(m.id)) err('"id" must be 2-48 chars of a-z, 0-9 and "-".');
    if (typeof m.name !== "string" || !m.name.trim() || m.name.length > 80) err('"name" is required (max 80 chars).');
    if (typeof m.version !== "string" || !SEMVER_RE.test(m.version)) err('"version" must look like 1.0.0.');
    if (typeof m.description !== "string" || m.description.length > 400) err('"description" must be a string (max 400 chars).');
    var l = m.license;
    if (!l || typeof l !== "object") err('"license" object is required.');
    else {
      if (typeof l.spdx !== "string" || !l.spdx.trim() || l.spdx.length > 40) err('"license.spdx" is required.');
      if (typeof l.name !== "string" || !l.name.trim()) err('"license.name" is required.');
      if (typeof l.commercialUse !== "boolean") err('"license.commercialUse" must be true or false.');
      if (typeof l.attributionRequired !== "boolean") err('"license.attributionRequired" must be true or false.');
      else if (l.attributionRequired && (typeof l.attribution !== "string" || !l.attribution.trim())) err('"license.attribution" text is required when attribution is required.');
      if (l.url !== undefined && !/^https:\/\/[^\s"'<>]+$/.test(l.url)) err('"license.url" must be an https:// URL.');
    }
    if (m.preview !== undefined && mode !== "imported" && !isSafeRelativePath(m.preview.replace(/^(\.\.\/)+/, ""))) err('"preview" path is invalid.');
    if (!Array.isArray(m.assets) || (!m.assets.length && !allowEmpty)) err('"assets" must be a non-empty array.');
    else if (m.assets.length > 500) err("Too many assets (max 500).");
    else {
      var ids = {};
      m.assets.forEach(function (a, i) {
        var w = "assets[" + i + "]: ";
        if (!a || typeof a !== "object") return err(w + "must be an object.");
        Object.keys(a).forEach(function (k) { if (EXEC_KEYS.indexOf(k.toLowerCase()) !== -1) err(w + 'field "' + k + '" is not allowed.'); });
        if (typeof a.id !== "string" || !PACK_ID_RE.test(a.id)) err(w + '"id" is invalid.');
        else if (ids[a.id]) err(w + 'duplicate id "' + a.id + '".'); else ids[a.id] = true;
        if (typeof a.name !== "string" || !a.name.trim() || a.name.length > 80) err(w + '"name" is required.');
        if (!isSafeRelativePath(a.path)) err(w + '"path" must be a safe relative .png path (no "..", no absolute paths, no URLs).');
        if (!isInt(a.width) || !isInt(a.height) || a.width < 1 || a.height < 1 || a.width > LIMITS.maxImageSide || a.height > LIMITS.maxImageSide) err(w + "width/height must be positive integers.");
        if (mode === "imported" && (typeof a.data !== "string" || !DATA_PNG_RE.test(a.data))) err(w + '"data" must be a data:image/png;base64 URI.');
        if (mode !== "imported" && a.data !== undefined) err(w + '"data" is only allowed in imported packs.');
      });
    }
    return { ok: errors.length === 0, errors: errors };
  }

  return {
    VERSION: VERSION, LIMITS: LIMITS, isInt: isInt, toInt: toInt, clamp: clamp, pad: pad,
    sanitizeName: sanitizeName, isValidFilename: isValidFilename, spriteFileName: spriteFileName, cssIdent: cssIdent, digitsFor: digitsFor,
    isPng: isPng, readPngHeader: readPngHeader,
    gridFromCells: gridFromCells, gridFromSize: gridFromSize, buildSprites: buildSprites, spriteAtPoint: spriteAtPoint,
    toHex: toHex, pixelAt: pixelAt, alphaStats: alphaStats, scaledSize: scaledSize,
    generateMetadata: generateMetadata, metadataToJson: metadataToJson, generateSpriteCss: generateSpriteCss, generateImageCss: generateImageCss,
    crc32: crc32, zipStore: zipStore, utf8: utf8,
    isSafeRelativePath: isSafeRelativePath, validatePackManifest: validatePackManifest, DATA_PNG_RE: DATA_PNG_RE
  };
});
