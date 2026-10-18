/* PNG Asset Lab - UI. One App instance per opened workspace; destroy() removes every listener, timer and DOM node it created. */
var TABS = [["workspace", "image", "Image"], ["sprites", "sprites", "Sprites"], ["animation", "film", "Animate"], ["packs", "pack", "Packs"], ["code", "code", "Code"], ["settings", "settings", "Settings"], ["about", "info", "About"]];
var STAGE_TABS = { workspace: 1, sprites: 1, animation: 1, code: 1 };

function btn(id, ico, label, cls) { return '<button type="button" id="pal-' + id + '" class="pal-btn ' + (cls || "") + '">' + (ico ? '<span data-icon="' + ico + '"></span>' : "") + "<span>" + label + "</span></button>"; }
function num(id, label, val) { return '<label class="pal-field"><span>' + label + '</span><input id="pal-' + id + '" type="number" inputmode="numeric" min="0" step="1" value="' + val + '"></label>'; }
function chk(id, label, on) { return '<label class="pal-check"><input id="pal-' + id + '" type="checkbox"' + (on ? " checked" : "") + "><span>" + label + "</span></label>"; }
function sel(id, label, opts) { return '<label class="pal-field"><span>' + label + '</span><select id="pal-' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("") + "</select></label>"; }

var TEMPLATE =
  '<header class="pal-bar"><button type="button" id="pal-back" class="pal-iconbtn" aria-label="Close PNG Asset Lab"><span data-icon="back"></span></button><h1 class="pal-title">PNG Asset Lab</h1><span class="pal-spacer"></span><button type="button" id="pal-theme" class="pal-iconbtn" aria-label="Switch light or dark theme"><span data-icon="sun"></span></button></header>' +
  '<div class="pal-body"><section class="pal-stage" id="pal-stage" aria-label="Image viewer">' +
  '<canvas id="pal-canvas" tabindex="0" aria-label="Image canvas. Drag to pan, pinch or use plus and minus to zoom."></canvas>' +
  '<div class="pal-empty" id="pal-empty"><span data-icon="image" class="pal-empty-ico"></span><p class="pal-empty-title">No image loaded</p><p class="pal-empty-sub">Import a PNG, drop one here, or open the sample sprite sheet.</p><div class="pal-row">' + btn("empty-open", "import", "Import PNG", "pal-primary") + btn("empty-sample", "sprites", "Sample sheet") + "</div></div>" +
  '<div class="pal-stage-tools" id="pal-stage-tools">' +
  '<button type="button" id="pal-zoom-out" class="pal-iconbtn" aria-label="Zoom out"><span data-icon="zoomout"></span></button><button type="button" id="pal-zoom-in" class="pal-iconbtn" aria-label="Zoom in"><span data-icon="zoomin"></span></button><button type="button" id="pal-zoom-fit" class="pal-iconbtn" aria-label="Fit to screen"><span data-icon="fit"></span></button><button type="button" id="pal-zoom-reset" class="pal-iconbtn" aria-label="Reset zoom to 100 percent"><span data-icon="reset"></span></button>' +
  '<span class="pal-sep"></span><button type="button" id="pal-tool-pan" class="pal-iconbtn" aria-pressed="true" aria-label="Pan and select tool"><span data-icon="move"></span></button><button type="button" id="pal-tool-pick" class="pal-iconbtn" aria-pressed="false" aria-label="Pixel color picker tool"><span data-icon="pick"></span></button><button type="button" id="pal-tool-grid" class="pal-iconbtn" aria-pressed="true" aria-label="Toggle sprite grid overlay"><span data-icon="grid"></span></button></div>' +
  '<div class="pal-readout" id="pal-readout">-</div><div class="pal-drop" id="pal-drop">Drop PNG to open</div></section>' +
  '<main class="pal-panels">' +
  /* workspace */
  '<section class="pal-panel" id="pal-panel-workspace" data-panel="workspace"><div class="pal-card"><h2>Image</h2><div class="pal-grid2">' + btn("btn-open", "folder", "Browse files", "pal-primary") + btn("btn-system", "import", "System picker") + btn("btn-sample", "sprites", "Sample sheet") + btn("btn-clear", "trash", "Close image", "pal-danger") + '</div><dl class="pal-dl" id="pal-info"></dl><div id="pal-recent" class="pal-recent"></div></div>' +
  '<div class="pal-card"><h2>Inspect</h2><div class="pal-grid2">' + btn("btn-alpha", "alpha", "Inspect alpha") + btn("btn-copyhex", "copy", "Copy picked HEX") + '</div><div class="pal-pick" id="pal-pick-out">Use the picker tool (crosshair) and tap a pixel.</div><div class="pal-note" id="pal-alpha-out"></div>' + sel("bg", "Viewer background", [["checker", "Checkerboard"], ["dark", "Dark"], ["light", "Light"]]) + "</div>" +
  '<div class="pal-card"><h2>Scale and export</h2><div class="pal-grid2">' + num("scale-w", "Width (px)", "") + num("scale-h", "Height (px)", "") + num("scale-pct", "Percent", 100) + chk("scale-lock", "Keep aspect ratio", true) + '</div><div class="pal-grid2">' + btn("btn-scale-export", "scale", "Export scaled PNG") + btn("btn-export-png", "download", "Export PNG copy") + "</div></div></section>" +
  /* sprites */
  '<section class="pal-panel" id="pal-panel-sprites" data-panel="sprites" hidden><div class="pal-card"><h2>Grid</h2>' + sel("mode", "Define grid by", [["cells", "Columns and rows"], ["size", "Sprite size"]]) + '<div class="pal-grid2">' + num("cols", "Columns", 1) + num("rows", "Rows", 1) + num("cw", "Sprite width", 0) + num("ch", "Sprite height", 0) + num("mx", "Margin X", 0) + num("my", "Margin Y", 0) + num("sx", "Spacing X", 0) + num("sy", "Spacing Y", 0) + "</div>" +
  '<label class="pal-field"><span>File name prefix</span><input id="pal-basename" type="text" maxlength="60" placeholder="sprite"></label><div class="pal-checks">' + chk("show-grid", "Grid overlay", true) + chk("show-coords", "Coordinates", true) + chk("skip-empty", "Skip empty sprites when exporting all", true) + '</div><div class="pal-status" id="pal-grid-status" role="status"></div></div>' +
  '<div class="pal-card"><h2>Sprites</h2><div class="pal-strip" id="pal-strip"></div><div class="pal-note" id="pal-sprite-info">Select a sprite on the sheet.</div><div class="pal-grid2">' + btn("btn-export-sprite", "download", "Export selected") + btn("btn-add-frame", "plus", "Add to animation") + btn("btn-export-zip", "pack", "Export all (ZIP)", "pal-primary") + btn("btn-export-files", "download", "Export all (files)") + btn("btn-detect-empty", "alpha", "Find empty sprites") + "</div></div></section>" +
  /* animation */
  '<section class="pal-panel" id="pal-panel-animation" data-panel="animation" hidden><div class="pal-card"><h2>Preview</h2><div class="pal-animbox" id="pal-animbox"><canvas id="pal-anim-canvas" aria-label="Animation preview"></canvas></div><div class="pal-frame" id="pal-frame-label">No frames</div><div class="pal-row">' + '<button type="button" id="pal-btn-prev" class="pal-iconbtn" aria-label="Previous frame"><span data-icon="stepback"></span></button><button type="button" id="pal-btn-play" class="pal-btn pal-primary" aria-label="Play or pause"><span data-icon="play"></span><span id="pal-play-label">Play</span></button><button type="button" id="pal-btn-next" class="pal-iconbtn" aria-label="Next frame"><span data-icon="stepfwd"></span></button></div>' +
  '<div class="pal-grid2"><label class="pal-field"><span>FPS: <b id="pal-fps-val">8</b></span><input id="pal-fps" type="range" min="1" max="60" value="8"></label>' + sel("anim-bg", "Preview background", [["checker", "Checkerboard"], ["dark", "Dark"], ["light", "Light"], ["green", "Green"]]) + "</div>" + chk("loop", "Loop playback", true) + "</div>" +
  '<div class="pal-card"><h2>Frames</h2><p class="pal-note">Tap sprites on the sheet above to append frames in order.</p><div class="pal-chips" id="pal-seq"></div><div class="pal-grid2">' + btn("btn-seq-add", "plus", "Add selected") + btn("btn-seq-row", "layers", "Add row") + btn("btn-seq-all", "sprites", "Add all") + btn("btn-seq-undo", "back", "Remove last") + btn("btn-seq-clear", "trash", "Clear", "pal-danger") + btn("btn-export-frame", "download", "Export frame PNG") + "</div></div></section>" +
  /* packs */
  '<section class="pal-panel" id="pal-panel-packs" data-panel="packs" hidden><div class="pal-card" id="pal-packs-list-card"><h2>Image packs</h2><div class="pal-grid2">' + btn("btn-import-pack", "import", "Import pack file") + btn("btn-new-pack", "plus", "New pack") + '</div><div id="pal-packs-list" class="pal-packs"></div></div><div class="pal-card" id="pal-pack-view" hidden></div></section>' +
  /* code */
  '<section class="pal-panel" id="pal-panel-code" data-panel="code" hidden><div class="pal-card"><h2>CSS options</h2><div class="pal-grid2"><label class="pal-field"><span>Class name</span><input id="pal-css-class" type="text" value="sprite" maxlength="40"></label><label class="pal-field"><span>Image URL / path</span><input id="pal-css-url" type="text" value="" maxlength="200"></label>' + num("css-scale", "Scale (1-16)", 1) + sel("css-scope", "Sprites", [["all", "All sprites"], ["selected", "Selected only"], ["sequence", "Animation frames"]]) + "</div>" + chk("css-pixel", "Pixel-art rendering", true) + chk("css-anim", "Include animation keyframes", true) + "</div>" +
  '<div class="pal-card"><h2>CSS</h2><textarea id="pal-css-out" class="pal-code" rows="10" spellcheck="false" aria-label="Generated CSS"></textarea><div class="pal-grid2">' + btn("btn-copy-css", "copy", "Copy CSS") + btn("btn-save-css", "download", "Save .css") + '</div></div><div class="pal-card"><h2>JSON metadata</h2><textarea id="pal-json-out" class="pal-code" rows="10" spellcheck="false" aria-label="Generated JSON"></textarea><div class="pal-grid2">' + btn("btn-copy-json", "copy", "Copy JSON") + btn("btn-save-json", "download", "Save .json") + "</div></div></section>" +
  /* settings */
  '<section class="pal-panel" id="pal-panel-settings" data-panel="settings" hidden><div class="pal-card"><h2>Appearance</h2>' + sel("set-theme", "Theme", [["dark", "Dark"], ["light", "Light"]]) + chk("set-nearest", "Nearest-neighbor scaling (pixel art)", true) + chk("set-coords", "Show sprite coordinates by default", true) + "</div>" +
  '<div class="pal-card"><h2>Export folder</h2><div class="pal-note" id="pal-export-dir">Not chosen yet (you are asked on first export).</div><div class="pal-grid2">' + btn("btn-pick-dir", "folder", "Choose folder") + "</div></div>" +
  '<div class="pal-card"><h2>Storage</h2><div class="pal-note" id="pal-storage-status"></div><div class="pal-grid2">' + btn("btn-clear-data", "trash", "Clear saved data", "pal-danger") + '</div></div><div class="pal-card"><h2>Developer</h2>' + chk("set-dev", "Diagnostics mode", false) + '<pre class="pal-code pal-diag" id="pal-diag" aria-label="Diagnostics log"></pre><div class="pal-grid2">' + btn("btn-copy-diag", "copy", "Copy log") + btn("btn-refresh-diag", "reset", "Refresh") + '</div></div><div class="pal-card"><h2>Shortcuts</h2><p class="pal-note">+ / - zoom, 0 reset, F fit, G grid, arrow keys move selection, Space play/pause (Animate tab), Esc closes dialogs. Shortcuts work while the canvas has focus.</p></div></section>' +
  /* about */
  '<section class="pal-panel" id="pal-panel-about" data-panel="about" hidden><div class="pal-card"><h2>PNG Asset Lab</h2><p class="pal-note">Version <b id="pal-ver"></b> by Rafi (rafijordan4). MIT license. Source: https://github.com/rafijordan4/png-asset-lab</p><p class="pal-note">Supports PNG only. Original files are never modified; every export writes a new file.</p></div>' +
  '<div class="pal-card"><h2>What is saved</h2><ul class="pal-list"><li>Saved on this device when storage is available: settings, recent file list, user packs and their images.</li><li>Temporary (lost when the page closes): loaded image, selection, animation frames, generated code.</li><li>Check Settings, Storage, to see whether saving works on your device.</li></ul></div><div class="pal-card"><h2>Bundled pack licenses</h2><ul class="pal-list" id="pal-about-licenses"></ul></div></section>' +
  "</main></div>" +
  '<nav class="pal-nav" role="tablist" aria-label="Sections">' + TABS.map(function (t) { return '<button type="button" role="tab" class="pal-tab" data-tab="' + t[0] + '" aria-selected="false"><span data-icon="' + t[1] + '"></span><span>' + t[2] + "</span></button>"; }).join("") + "</nav>" +
  '<div class="pal-toasts" id="pal-toasts" role="status" aria-live="polite"></div><div class="pal-busy" id="pal-busy" hidden><div class="pal-spinner"></div><span id="pal-busy-text">Working...</span></div><div class="pal-modal" id="pal-modal" hidden></div>';

function App(plugin) {
  this.plugin = plugin; this.root = null; this.styleEl = null; this.disposers = []; this.timers = []; this.raf = 0; this.busyCount = 0;
  this.set = Object.assign({ theme: "dark", nearest: true, coords: true, dev: false, bg: "checker", exportDir: null, recent: [] }, Store.get("settings", {}));
  this.img = null; this.grid = null; this.sprites = []; this.sel = -1; this.seq = []; this.tool = "pan"; this.tab = "workspace"; this.openPackId = null; this.openAssetId = null;
  this.view = { zoom: 1, x: 0, y: 0, w: 0, h: 0 }; this.dpr = 1; this.pick = null; this.hover = null; this.ptrs = {}; this.anim = { playing: false, i: 0, acc: 0, last: 0, raf: 0 };
  this.checkerTiles = {}; this.emptyChecked = false; this.showGrid = true;
}
var AP = App.prototype;

AP.$ = function (id) { var el = this.root.querySelector("#pal-" + id); if (!el) throw new Error("Missing element #pal-" + id + " (template/selector mismatch)"); return el; };
AP.on = function (t, ev, fn, o) { t.addEventListener(ev, fn, o); this.disposers.push(function () { t.removeEventListener(ev, fn, o); }); };
AP.later = function (fn, ms) { var id = setTimeout(fn, ms); this.timers.push(id); return id; };
AP.click = function (id, fn) { var self = this; this.on(this.$(id), "click", function (e) { Promise.resolve().then(function () { return fn.call(self, e); }).catch(function (err) { self.fail("Action failed", err); }); }); };
AP.fail = function (msg, err) { Diag.log("error", msg, err); this.toast(msg + (err && err.message && err.message !== "cancelled" ? ": " + err.message : ""), "err"); };

AP.mount = function (page) {
  Diag.setStage("build-ui");
  if (!document.getElementById("pal-style")) { this.styleEl = h("style", { id: "pal-style" }); this.styleEl.textContent = CSS_TEXT; document.head.appendChild(this.styleEl); }
  this.root = h("div", { class: "pal-root", "data-theme": this.set.theme, "data-tab": "workspace" });
  this.root.innerHTML = TEMPLATE; // static, build-time template; no user data
  var self = this; Array.prototype.forEach.call(this.root.querySelectorAll("[data-icon]"), function (el) { el.replaceWith(icon(el.getAttribute("data-icon"))); });
  Diag.setStage("attach-page"); page.innerHTML = ""; page.appendChild(this.root);
  Diag.setStage("bind-events"); this.bind(); this.applySettings(); this.renderPacks(); this.renderAbout(); this.showTab("workspace"); this.renderInfo(); this.updateGridUi(); this.drawAnim();
  this.later(function () { self.resize(); }, 50);
};

AP.destroy = function () {
  this.disposers.forEach(function (d) { try { d(); } catch (e) { /* ignore */ } }); this.disposers = [];
  this.timers.forEach(clearTimeout); this.timers = []; if (this.raf) cancelAnimationFrame(this.raf); if (this.anim.raf) cancelAnimationFrame(this.anim.raf);
  if (this.root && this.root.parentNode) this.root.parentNode.removeChild(this.root);
  var st = document.getElementById("pal-style"); if (st && st.parentNode) st.parentNode.removeChild(st);
  this.root = null; this.img = null;
};

/* ---------- feedback ---------- */
AP.toast = function (msg, kind) {
  var box = this.$("toasts"), t = h("div", { class: "pal-toast " + (kind || "info"), text: msg }); box.appendChild(t);
  while (box.children.length > 3) box.removeChild(box.firstChild);
  this.later(function () { if (t.parentNode) t.parentNode.removeChild(t); }, kind === "err" ? 6000 : 3200);
};
AP.busy = function (text) {
  var self = this; this.busyCount++; this.$("busy-text").textContent = text || "Working..."; this.$("busy").hidden = false;
  return function (t) { if (t !== undefined) { self.$("busy-text").textContent = t; return; } self.busyCount = Math.max(0, self.busyCount - 1); if (!self.busyCount && self.root) self.$("busy").hidden = true; };
};
AP.modal = function (title, bodyNodes, actions) {
  var self = this, m = this.$("modal");
  return new Promise(function (resolve) {
    m.innerHTML = ""; var card = h("div", { class: "pal-dialog", role: "dialog", "aria-modal": "true", "aria-label": title }, [h("h2", { text: title })].concat(bodyNodes || []));
    var row = h("div", { class: "pal-grid2" }); card.appendChild(row);
    function close(v) { m.hidden = true; m.innerHTML = ""; self.modalResolve = null; resolve(v); }
    self.modalResolve = close;
    actions.forEach(function (a) { var b = h("button", { type: "button", class: "pal-btn " + (a.cls || ""), text: a.label }); b.addEventListener("click", function () { close(a.value !== undefined ? a.value : a.get ? a.get() : null); }); row.appendChild(b); });
    m.appendChild(card); m.hidden = false; var f = card.querySelector("input,button"); if (f) f.focus();
  });
};
AP.confirm = function (title, text, ok, danger) { return this.modal(title, [h("p", { class: "pal-note", text: text })], [{ label: "Cancel", value: false }, { label: ok || "OK", cls: danger ? "pal-danger" : "pal-primary", value: true }]); };
AP.prompt = function (title, value) { var inp = h("input", { type: "text", value: value || "", maxlength: "80", "aria-label": title }); return this.modal(title, [inp], [{ label: "Cancel", value: null }, { label: "Save", cls: "pal-primary", get: function () { return inp.value; } }]); };
AP.choose = function (title, opts) { return this.modal(title, [], opts.map(function (o) { return { label: o[1], value: o[0], cls: "pal-primary" }; }).concat([{ label: "Cancel", value: null }])); };

/* ---------- settings ---------- */
AP.saveSettings = function () { Store.set("settings", this.set); };
AP.applySettings = function () {
  Diag.dev = !!this.set.dev; this.root.setAttribute("data-theme", this.set.theme);
  this.$("set-theme").value = this.set.theme; this.$("set-nearest").checked = !!this.set.nearest; this.$("set-coords").checked = !!this.set.coords; this.$("set-dev").checked = !!this.set.dev; this.$("bg").value = this.set.bg;
  this.$("show-coords").checked = !!this.set.coords;
  var t = this.$("theme"); t.innerHTML = ""; t.appendChild(icon(this.set.theme === "dark" ? "sun" : "moon"));
  this.$("export-dir").textContent = this.set.exportDir ? this.set.exportDir : "Not chosen yet (you are asked on first export).";
  this.$("storage-status").textContent = Store.ok ? "Saving works: settings and user packs persist across restarts." : "Saving is NOT available here: everything is session-only. Export your packs to keep them.";
  this.$("ver").textContent = Core.VERSION; this.renderDiag(); this.render();
};
AP.renderDiag = function () { this.$("diag").textContent = this.set.dev ? Diag.text() || "(empty)" : "Turn on Diagnostics mode to record a log."; };

/* ---------- binding ---------- */
AP.bind = function () {
  var self = this, root = this.root;
  this.click("back", function () { if (self.plugin.page && self.plugin.page.hide) self.plugin.page.hide(); });
  this.click("theme", function () { self.set.theme = self.set.theme === "dark" ? "light" : "dark"; self.saveSettings(); self.applySettings(); });
  Array.prototype.forEach.call(root.querySelectorAll(".pal-tab"), function (b) { self.on(b, "click", function () { self.showTab(b.getAttribute("data-tab")); }); });
  ["empty-open", "btn-open"].forEach(function (id) { self.click(id, self.openAcode); });
  ["btn-system"].forEach(function (id) { self.click(id, function () { return self.openSystem(false); }); });
  ["empty-sample", "btn-sample"].forEach(function (id) { self.click(id, self.loadSample); });
  this.click("btn-clear", function () { if (!self.img) return self.toast("Nothing to close."); return self.confirm("Close image", "Close the current image? Selection and animation frames are discarded.", "Close", true).then(function (ok) { if (ok) self.clearImage(); }); });
  this.click("zoom-in", function () { self.zoomAt(1.5); }); this.click("zoom-out", function () { self.zoomAt(1 / 1.5); }); this.click("zoom-fit", function () { self.fit(); }); this.click("zoom-reset", function () { self.resetZoom(); });
  this.click("tool-pan", function () { self.setTool("pan"); }); this.click("tool-pick", function () { self.setTool("pick"); });
  this.click("tool-grid", function () { self.showGrid = !self.showGrid; self.$("show-grid").checked = self.showGrid; self.syncTools(); self.render(); });
  this.on(this.$("show-grid"), "change", function () { self.showGrid = self.$("show-grid").checked; self.syncTools(); self.render(); });
  this.on(this.$("show-coords"), "change", function () { self.set.coords = self.$("show-coords").checked; self.saveSettings(); self.render(); });
  this.on(this.$("bg"), "change", function () { self.set.bg = self.$("bg").value; self.saveSettings(); self.render(); });
  this.on(this.$("set-theme"), "change", function () { self.set.theme = self.$("set-theme").value; self.saveSettings(); self.applySettings(); });
  this.on(this.$("set-nearest"), "change", function () { self.set.nearest = self.$("set-nearest").checked; self.saveSettings(); self.render(); });
  this.on(this.$("set-coords"), "change", function () { self.set.coords = self.$("set-coords").checked; self.$("show-coords").checked = self.set.coords; self.saveSettings(); self.render(); });
  this.on(this.$("set-dev"), "change", function () { self.set.dev = self.$("set-dev").checked; self.saveSettings(); Diag.dev = self.set.dev; Diag.log("info", "diagnostics mode " + (Diag.dev ? "on" : "off")); self.renderDiag(); });
  this.click("btn-refresh-diag", function () { self.renderDiag(); });
  this.click("btn-copy-diag", function () { return self.copy(Diag.text(), "Log"); });
  this.click("btn-pick-dir", function () { return AcodeIO.pickFolder().then(function (u) { self.set.exportDir = u; self.saveSettings(); self.applySettings(); self.toast("Export folder set."); }); });
  this.click("btn-clear-data", function () { return self.confirm("Clear saved data", "Delete saved settings, recent files and ALL user packs from this device?", "Delete", true).then(function (ok) { if (!ok) return; Store.clearAll(); Packs.user = []; Packs.init(); self.set = { theme: self.set.theme, nearest: true, coords: true, dev: false, bg: "checker", exportDir: null, recent: [] }; self.applySettings(); self.renderPacks(); self.renderInfo(); self.toast("Saved data cleared."); }); });
  /* inspect + scale */
  this.click("btn-alpha", this.inspectAlpha); this.click("btn-copyhex", function () { if (!self.pick) return self.toast("Pick a pixel first."); return self.copy(self.pick.hex, "HEX"); });
  this.on(this.$("scale-w"), "input", function () { self.scaleSync("w"); }); this.on(this.$("scale-h"), "input", function () { self.scaleSync("h"); }); this.on(this.$("scale-pct"), "input", function () { self.scaleSync("p"); });
  this.click("btn-scale-export", this.exportScaled); this.click("btn-export-png", this.exportCopy);
  /* grid inputs */
  ["mode", "cols", "rows", "cw", "ch", "mx", "my", "sx", "sy"].forEach(function (id) { self.on(self.$(id), "input", function () { self.queueGrid(); }); self.on(self.$(id), "change", function () { self.queueGrid(); }); });
  this.on(this.$("basename"), "input", function () { self.queueGrid(); });
  this.click("btn-export-sprite", this.exportSelected); this.click("btn-export-zip", function () { return self.exportAll(true); }); this.click("btn-export-files", function () { return self.exportAll(false); }); this.click("btn-detect-empty", this.detectEmpty);
  this.click("btn-add-frame", function () { if (self.sel < 0) return self.toast("Select a sprite first."); self.addFrame(self.sel); self.toast("Frame added (" + self.seq.length + ")."); });
  /* animation */
  this.click("btn-play", function () { self.togglePlay(); }); this.click("btn-prev", function () { self.step(-1); }); this.click("btn-next", function () { self.step(1); });
  this.on(this.$("fps"), "input", function () { self.$("fps-val").textContent = self.$("fps").value; self.regen(); });
  this.on(this.$("loop"), "change", function () { self.regen(); }); this.on(this.$("anim-bg"), "change", function () { self.drawAnim(); });
  this.click("btn-seq-add", function () { if (self.sel < 0) return self.toast("Select a sprite first."); self.addFrame(self.sel); });
  this.click("btn-seq-row", function () { if (self.sel < 0) return self.toast("Select a sprite first."); var r = self.sprites[self.sel].row; self.sprites.forEach(function (s) { if (s.row === r) self.seq.push(s.index); }); self.seqChanged(); });
  this.click("btn-seq-all", function () { self.sprites.forEach(function (s) { self.seq.push(s.index); }); self.seqChanged(); });
  this.click("btn-seq-undo", function () { self.seq.pop(); self.seqChanged(); });
  this.click("btn-seq-clear", function () { if (!self.seq.length) return; return self.confirm("Clear frames", "Remove all animation frames?", "Clear", true).then(function (ok) { if (ok) { self.seq = []; self.seqChanged(); } }); });
  this.click("btn-export-frame", function () { var i = self.seq[self.anim.i]; if (i === undefined) return self.toast("No frame to export."); return self.exportSprites([self.sprites[i]], "frame"); });
  /* packs */
  this.click("btn-import-pack", this.importPack); this.click("btn-new-pack", this.newPack);
  /* code */
  ["css-class", "css-url", "css-scale", "css-scope", "css-pixel", "css-anim"].forEach(function (id) { self.on(self.$(id), "input", function () { self.regen(); }); self.on(self.$(id), "change", function () { self.regen(); }); });
  this.click("btn-copy-css", function () { return self.copy(self.$("css-out").value, "CSS"); }); this.click("btn-copy-json", function () { return self.copy(self.$("json-out").value, "JSON"); });
  this.click("btn-save-css", function () { return self.saveText(self.baseName() + ".css", self.$("css-out").value, "text/css"); });
  this.click("btn-save-json", function () { return self.saveText(self.baseName() + ".json", self.$("json-out").value, "application/json"); });
  /* stage */
  var cv = this.$("canvas"); this.ctx = cv.getContext("2d"); if (!this.ctx) throw new Error("2D canvas is not available in this WebView.");
  this.bindStage(cv);
  if (typeof ResizeObserver !== "undefined") { var ro = new ResizeObserver(function () { self.resize(); }); ro.observe(this.$("stage")); this.disposers.push(function () { ro.disconnect(); }); }
  this.on(window, "resize", function () { self.resize(); }); this.on(window, "orientationchange", function () { self.later(function () { self.resize(); }, 200); });
  /* drag & drop (only when the environment delivers drag events) */
  var drop = this.$("drop");
  this.on(root, "dragover", function (e) { e.preventDefault(); drop.classList.add("on"); }); this.on(root, "dragleave", function (e) { if (e.target === root || e.target === drop) drop.classList.remove("on"); });
  this.on(root, "drop", function (e) { e.preventDefault(); drop.classList.remove("on"); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (!f) return self.toast("Nothing was dropped.", "err"); self.readFileObject(f).catch(function (err) { self.fail("Could not open dropped file", err); }); });
  this.on(root, "keydown", function (e) { self.onKey(e); });
};

AP.showTab = function (name) {
  var self = this; if (this.tab === "animation" && name !== "animation") this.pause();
  this.tab = name; this.root.setAttribute("data-tab", name); this.root.setAttribute("data-stage", STAGE_TABS[name] ? "1" : "0");
  Array.prototype.forEach.call(this.root.querySelectorAll(".pal-tab"), function (b) { b.setAttribute("aria-selected", b.getAttribute("data-tab") === name ? "true" : "false"); });
  Array.prototype.forEach.call(this.root.querySelectorAll(".pal-panel"), function (p) { p.hidden = p.getAttribute("data-panel") !== name; });
  if (name === "code") this.regen(); if (name === "settings") this.renderDiag(); if (name === "animation") this.drawAnim();
  this.later(function () { self.resize(); }, 30);
};
AP.onKey = function (e) {
  var tag = (e.target && e.target.tagName || "").toLowerCase();
  if (e.key === "Escape" && !this.$("modal").hidden) { if (this.modalResolve) this.modalResolve(null); return; }
  if (tag === "input" || tag === "textarea" || tag === "select" || !this.$("modal").hidden) return;
  var k = e.key, used = true;
  if (k === "+" || k === "=") this.zoomAt(1.5); else if (k === "-") this.zoomAt(1 / 1.5); else if (k === "0") this.resetZoom(); else if (k === "f" || k === "F") this.fit(); else if (k === "g" || k === "G") { this.showGrid = !this.showGrid; this.$("show-grid").checked = this.showGrid; this.syncTools(); this.render(); }
  else if (k === " " && this.tab === "animation") this.togglePlay();
  else if (/^Arrow/.test(k) && this.grid && this.grid.ok) { var g = this.grid, i = this.sel < 0 ? 0 : this.sel, c = i % g.cols, r = Math.floor(i / g.cols); if (this.sel >= 0) { if (k === "ArrowLeft") c = Math.max(0, c - 1); if (k === "ArrowRight") c = Math.min(g.cols - 1, c + 1); if (k === "ArrowUp") r = Math.max(0, r - 1); if (k === "ArrowDown") r = Math.min(g.rows - 1, r + 1); } this.select(r * g.cols + c); }
  else used = false;
  if (used) e.preventDefault();
};

/* ---------- viewer ---------- */
AP.setTool = function (t) { this.tool = t; this.syncTools(); };
AP.syncTools = function () { this.$("tool-pan").setAttribute("aria-pressed", this.tool === "pan"); this.$("tool-pick").setAttribute("aria-pressed", this.tool === "pick"); this.$("tool-grid").setAttribute("aria-pressed", this.showGrid); };
AP.resize = function () {
  if (!this.root) return; var st = this.$("stage"), r = st.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
  var first = !this.view.w, dpr = window.devicePixelRatio || 1; this.dpr = dpr; this.view.w = r.width; this.view.h = r.height;
  var cv = this.$("canvas"); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  if (first && this.img) this.fit(); else this.render();
};
AP.render = function () { var self = this; if (this.raf || !this.root) return; this.raf = requestAnimationFrame(function () { self.raf = 0; if (self.root) self.draw(); }); };
AP.checker = function (dark) {
  var key = dark ? "d" : "l"; if (this.checkerTiles[key]) return this.checkerTiles[key];
  var t = document.createElement("canvas"); t.width = t.height = 16; var c = t.getContext("2d"); c.fillStyle = dark ? "#2b2e3b" : "#d4d7e3"; c.fillRect(0, 0, 16, 16); c.fillStyle = dark ? "#363a4b" : "#eceef5"; c.fillRect(0, 0, 8, 8); c.fillRect(8, 8, 8, 8);
  return (this.checkerTiles[key] = this.ctx.createPattern(t, "repeat"));
};
AP.draw = function () {
  var ctx = this.ctx, v = this.view, d = this.dpr; ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, v.w, v.h);
  if (!this.img) return; var z = v.zoom, w = this.img.width * z, hh = this.img.height * z;
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, w, hh); ctx.clip();
  if (this.set.bg === "checker") { ctx.translate(v.x, v.y); ctx.fillStyle = this.checker(this.set.theme === "dark"); ctx.fillRect(0, 0, w, hh); } else { ctx.fillStyle = this.set.bg === "dark" ? "#101116" : "#f4f5fa"; ctx.fillRect(v.x, v.y, w, hh); }
  ctx.restore();
  ctx.imageSmoothingEnabled = !this.set.nearest || z < 1; ctx.drawImage(this.img.canvas, v.x, v.y, w, hh);
  var g = this.grid, sp = this.sprites;
  if (g && g.ok && this.showGrid) {
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(124,92,255,.9)"; ctx.beginPath();
    for (var i = 0; i < sp.length; i++) { var s = sp[i], sx = v.x + s.x * z, sy = v.y + s.y * z; if (sx > v.w || sy > v.h || sx + s.width * z < 0 || sy + s.height * z < 0) continue; ctx.rect(Math.round(sx) + .5, Math.round(sy) + .5, Math.round(s.width * z), Math.round(s.height * z)); }
    ctx.stroke();
    var inSeq = {}; this.seq.forEach(function (n) { inSeq[n] = 1; });
    ctx.font = "10px monospace"; ctx.textBaseline = "top";
    for (var j = 0; j < sp.length; j++) {
      var q = sp[j], qx = v.x + q.x * z, qy = v.y + q.y * z, qw = q.width * z, qh = q.height * z; if (qx > v.w || qy > v.h || qx + qw < 0 || qy + qh < 0) continue;
      if (inSeq[j]) { ctx.fillStyle = "rgba(76,141,255,.22)"; ctx.fillRect(qx, qy, qw, qh); }
      if (j === this.sel) { ctx.fillStyle = "rgba(124,92,255,.30)"; ctx.fillRect(qx, qy, qw, qh); ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.strokeRect(qx + 1, qy + 1, qw - 2, qh - 2); }
      if (this.set.coords && qw >= 46 && qh >= 16) { var tx = q.x + "," + q.y; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.75)"; ctx.strokeText(tx, qx + 3, qy + 3); ctx.fillStyle = "#fff"; ctx.fillText(tx, qx + 3, qy + 3); }
    }
  }
  if (this.pick) { var px = v.x + this.pick.x * z, py = v.y + this.pick.y * z; ctx.lineWidth = 2; ctx.strokeStyle = "#ffc857"; ctx.strokeRect(px - 1, py - 1, Math.max(z, 3) + 2, Math.max(z, 3) + 2); }
};
AP.fit = function () { if (!this.img || !this.view.w) return; var v = this.view, z = Core.clamp(Math.min(v.w / this.img.width, v.h / this.img.height) * 0.94, 0.05, 64); v.zoom = z; v.x = (v.w - this.img.width * z) / 2; v.y = (v.h - this.img.height * z) / 2; this.updateReadout(); this.render(); };
AP.resetZoom = function () { if (!this.img) return; var v = this.view; v.zoom = 1; v.x = (v.w - this.img.width) / 2; v.y = (v.h - this.img.height) / 2; this.updateReadout(); this.render(); };
AP.zoomAt = function (f, cx, cy) { if (!this.img) return; var v = this.view; cx = cx === undefined ? v.w / 2 : cx; cy = cy === undefined ? v.h / 2 : cy; var nz = Core.clamp(v.zoom * f, 0.05, 64); v.x = cx - (cx - v.x) * nz / v.zoom; v.y = cy - (cy - v.y) * nz / v.zoom; v.zoom = nz; this.updateReadout(); this.render(); };
AP.toImage = function (cx, cy) { var r = this.$("canvas").getBoundingClientRect(), v = this.view; return { x: Math.floor((cx - r.left - v.x) / v.zoom), y: Math.floor((cy - r.top - v.y) / v.zoom) }; };
AP.pixel = function (x, y) {
  if (!this.img || x < 0 || y < 0 || x >= this.img.width || y >= this.img.height) return null;
  var d = this.img.ctx.getImageData(x, y, 1, 1).data; var p = Core.pixelAt(d, 1, 0, 0); p.x = x; p.y = y; return p;
};
AP.updateReadout = function () {
  var p = this.hover, t = Math.round(this.view.zoom * 100) + "%";
  this.$("readout").textContent = this.img ? (p ? "x " + p.x + "  y " + p.y + "  " + p.hex + "  rgba(" + p.r + "," + p.g + "," + p.b + "," + (Math.round(p.a / 2.55) / 100) + ")  " : "") + t : "-";
};
AP.bindStage = function (cv) {
  var self = this, down = null;
  function pts() { return Object.keys(self.ptrs).map(function (k) { return self.ptrs[k]; }); }
  this.on(cv, "pointerdown", function (e) { if (!self.img) return; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } self.ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; down = pts().length === 1 ? { x: e.clientX, y: e.clientY, t: Date.now(), moved: false } : null; if (down === null) self.pinch = null; cv.focus(); });
  this.on(cv, "pointermove", function (e) {
    var p = self.ptrs[e.pointerId], v = self.view;
    if (!p) { if (self.img && e.pointerType === "mouse") { var im = self.toImage(e.clientX, e.clientY); self.hover = self.pixel(im.x, im.y); self.updateReadout(); } return; }
    var list = pts();
    if (list.length === 1) { v.x += e.clientX - p.x; v.y += e.clientY - p.y; if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down.moved = true; self.render(); }
    else if (list.length === 2) { var o = list[0] === p ? list[1] : list[0], d0 = Math.hypot(p.x - o.x, p.y - o.y), d1 = Math.hypot(e.clientX - o.x, e.clientY - o.y); if (d0 > 0) { var r = self.$("canvas").getBoundingClientRect(); self.zoomAt(d1 / d0, (e.clientX + o.x) / 2 - r.left, (e.clientY + o.y) / 2 - r.top); } }
    p.x = e.clientX; p.y = e.clientY;
  });
  function up(e) { var had = self.ptrs[e.pointerId]; delete self.ptrs[e.pointerId]; if (had && down && !down.moved && Date.now() - down.t < 600 && e.type === "pointerup") self.tap(e.clientX, e.clientY); if (!pts().length) down = null; }
  this.on(cv, "pointerup", up); this.on(cv, "pointercancel", up);
  this.on(cv, "wheel", function (e) { if (!self.img) return; e.preventDefault(); var r = cv.getBoundingClientRect(); self.zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
};
AP.tap = function (cx, cy) {
  var im = this.toImage(cx, cy), p = this.pixel(im.x, im.y); if (!p) return; this.hover = p; this.updateReadout();
  if (this.tool === "pick") { this.pick = p; this.renderPick(); this.render(); return; }
  if (this.grid && this.grid.ok) { var i = Core.spriteAtPoint(this.grid, im.x, im.y); if (i >= 0) { this.select(i); if (this.tab === "animation") this.addFrame(i); } }
};
AP.renderPick = function () {
  var p = this.pick, box = this.$("pick-out"); box.innerHTML = ""; if (!p) { box.textContent = "Use the picker tool (crosshair) and tap a pixel."; return; }
  var sw = h("span", { class: "pal-swatch" }); sw.style.background = "rgba(" + p.r + "," + p.g + "," + p.b + "," + p.a / 255 + ")";
  box.appendChild(sw); box.appendChild(h("span", { text: "(" + p.x + ", " + p.y + ")  " + p.hex + "  rgba(" + p.r + ", " + p.g + ", " + p.b + ", " + (Math.round(p.a / 2.55) / 100) + ")" }));
};

/* ---------- loading ---------- */
AP.clearImage = function () { this.img = null; this.grid = null; this.sprites = []; this.sel = -1; this.seq = []; this.pick = null; this.hover = null; this.pause(); this.renderInfo(); this.updateGridUi(); this.seqChanged(); this.renderPick(); this.updateReadout(); this.render(); };
AP.loadBytes = function (bytes, name, meta) {
  var self = this, done = this.busy("Opening image...");
  return Promise.resolve().then(function () {
    if (bytes.length > Core.LIMITS.maxFileBytes) throw new Error("File is too large (" + formatBytes(bytes.length) + "). Limit is " + formatBytes(Core.LIMITS.maxFileBytes) + ".");
    var hd = Core.readPngHeader(bytes); if (!hd) throw new Error("This is not a valid PNG file. Only PNG is supported.");
    if (hd.width > Core.LIMITS.maxImageSide || hd.height > Core.LIMITS.maxImageSide || hd.width * hd.height > Core.LIMITS.maxPixels) throw new Error("Image is " + hd.width + "x" + hd.height + ". The maximum is " + Core.LIMITS.maxPixels / 1e6 + " megapixels and " + Core.LIMITS.maxImageSide + " px per side on mobile.");
    return decodePngBytes(bytes).then(function (im) {
      var c = document.createElement("canvas"); c.width = hd.width; c.height = hd.height; var cx = c.getContext("2d", { willReadFrequently: true }); if (!cx) throw new Error("Could not create a 2D canvas for this image.");
      cx.drawImage(im, 0, 0);
      self.img = { name: name, size: bytes.length, width: hd.width, height: hd.height, header: hd, canvas: c, ctx: cx, origin: (meta && meta.origin) || "file" };
    });
  }).then(function () {
    self.sel = -1; self.seq = []; self.pick = null; self.hover = null; self.emptyChecked = false; self.pause(); self.anim.i = 0;
    var g = meta && meta.grid; self.$("mode").value = g ? "cells" : "cells"; self.$("cols").value = g ? g.cols : 1; self.$("rows").value = g ? g.rows : 1;
    ["mx", "my", "sx", "sy"].forEach(function (k) { self.$(k).value = 0; }); self.$("basename").value = Core.sanitizeName(name, "sprite"); self.$("css-url").value = name; self.$("scale-w").value = self.img.width; self.$("scale-h").value = self.img.height; self.$("scale-pct").value = 100;
    self.renderInfo(); self.updateGridUi(); self.seqChanged(); self.renderPick(); self.fit(); self.toast("Opened " + name + " (" + self.img.width + " x " + self.img.height + ")", "ok"); Diag.log("info", "image loaded " + name + " " + self.img.width + "x" + self.img.height);
  }).then(function () { done(); }, function (e) { done(); throw e; });
};
AP.remember = function (f) { this.set.recent = [f].concat((this.set.recent || []).filter(function (r) { return r.url !== f.url; })).slice(0, 6); this.saveSettings(); this.renderInfo(); };
AP.openAcode = function () { var self = this; return AcodeIO.pickFile("Select a PNG image").then(function (f) { return AcodeIO.readFile(f.url).then(function (bytes) { return self.loadBytes(bytes, f.name).then(function () { self.remember({ name: f.name, url: f.url }); }); }); }).catch(function (e) { if (e.message !== "cancelled") self.fail("Could not open file", e); });
};
AP.openRecent = function (r) { var self = this; return AcodeIO.readFile(r.url).then(function (b) { return self.loadBytes(b, r.name); }).catch(function (e) { self.fail("Could not reopen " + r.name + " (the file may have moved or access expired)", e); }); };
AP.readFileObject = function (f) { var self = this; return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(new Uint8Array(fr.result)); }; fr.onerror = function () { rej(fr.error || new Error("Could not read file")); }; fr.readAsArrayBuffer(f); }).then(function (b) { return self.loadBytes(b, f.name); }); };
AP.openSystem = function (multiple, onFiles) {
  var self = this; return new Promise(function (resolve) {
    var inp = document.createElement("input"); inp.type = "file"; inp.accept = onFiles ? onFiles : "image/png,.png"; if (multiple) inp.multiple = true; inp.style.display = "none";
    inp.addEventListener("change", function () { var fl = Array.prototype.slice.call(inp.files || []); if (inp.parentNode) inp.parentNode.removeChild(inp); resolve(fl); });
    inp.addEventListener("cancel", function () { if (inp.parentNode) inp.parentNode.removeChild(inp); resolve([]); });
    document.body.appendChild(inp); inp.click();
  }).then(function (files) { if (multiple || onFiles) return files; if (!files.length) { self.toast("No file selected."); return []; } return self.readFileObject(files[0]).then(function () { return []; }).catch(function (e) { self.fail("Could not open file", e); return []; }); });
};
AP.loadSample = function () {
  var s = BUNDLED_SAMPLE; return this.loadBytes(dataUrlToBytes(s.data), "sample-slime-sheet.png", { origin: "sample", grid: s.meta.grid });
};

/* ---------- info / inspect / scale ---------- */
AP.renderInfo = function () {
  var dl = this.$("info"), im = this.img, self = this; dl.innerHTML = "";
  function row(k, v) { dl.appendChild(h("dt", { text: k })); dl.appendChild(h("dd", { text: v })); }
  if (!im) row("Status", "No image loaded"); else { row("Name", im.name); row("Size", im.width + " x " + im.height + " px"); row("File size", formatBytes(im.size)); row("Color type", im.header.colorTypeName + ", " + im.header.bitDepth + "-bit" + (im.header.interlaced ? ", interlaced" : "")); row("Alpha channel", im.header.hasAlphaChannel ? "yes" : "no (or palette transparency)"); }
  this.$("empty").hidden = !!im;
  var rec = this.$("recent"); rec.innerHTML = ""; if (Store.ok && (this.set.recent || []).length) { rec.appendChild(h("div", { class: "pal-note", text: "Recent files" })); this.set.recent.forEach(function (r) { var b = h("button", { type: "button", class: "pal-chip", text: r.name }); b.addEventListener("click", function () { self.openRecent(r); }); rec.appendChild(b); }); }
};
AP.inspectAlpha = function () {
  var self = this; if (!this.img) return this.toast("Open an image first."); var done = this.busy("Inspecting alpha..."), im = this.img, tot = { total: 0, transparent: 0, opaque: 0, semi: 0 }, y = 0, stripe = Math.max(1, Math.floor(1e6 / im.width));
  function next() { if (y >= im.height) return Promise.resolve(); var hh = Math.min(stripe, im.height - y), st = Core.alphaStats(im.ctx.getImageData(0, y, im.width, hh).data); ["total", "transparent", "opaque", "semi"].forEach(function (k) { tot[k] += st[k]; }); y += hh; return tick().then(next); }
  return next().then(function () { done(); var pc = function (n) { return (n * 100 / tot.total).toFixed(1) + "%"; }; self.$("alpha-out").textContent = "Transparent: " + tot.transparent + " (" + pc(tot.transparent) + "), semi-transparent: " + tot.semi + " (" + pc(tot.semi) + "), opaque: " + tot.opaque + " (" + pc(tot.opaque) + ")."; }, function (e) { done(); throw e; });
};
AP.scaleSync = function (src) {
  if (!this.img) return; var w = this.$("scale-w"), hh = this.$("scale-h"), p = this.$("scale-pct"), lock = this.$("scale-lock").checked, im = this.img;
  if (src === "p") { var r = Core.scaledSize(im.width, im.height, { percent: parseFloat(p.value) }); if (r) { w.value = r.width; hh.value = r.height; } }
  else if (lock) { var r2 = Core.scaledSize(im.width, im.height, src === "w" ? { width: Core.toInt(w.value, 0) } : { height: Core.toInt(hh.value, 0) }); if (r2) { w.value = r2.width; hh.value = r2.height; p.value = Math.round(r2.width * 100 / im.width); } }
};
AP.exportScaled = function () {
  var self = this; if (!this.img) return this.toast("Open an image first.", "err"); var w = Core.toInt(this.$("scale-w").value, 0), hh = Core.toInt(this.$("scale-h").value, 0);
  if (w < 1 || hh < 1 || w > Core.LIMITS.maxImageSide || hh > Core.LIMITS.maxImageSide || w * hh > Core.LIMITS.maxPixels) return this.toast("Invalid size. Use 1 to " + Core.LIMITS.maxImageSide + " px and at most " + Core.LIMITS.maxPixels / 1e6 + " megapixels.", "err");
  var c = document.createElement("canvas"); c.width = w; c.height = hh; var x = c.getContext("2d"); if (!x) return this.toast("Canvas unavailable.", "err"); x.imageSmoothingEnabled = !this.set.nearest || w < this.img.width; x.drawImage(this.img.canvas, 0, 0, w, hh);
  return canvasToPngBytes(c).then(function (b) { return self.saveFiles([{ name: Core.sanitizeName(self.img.name) + "_" + w + "x" + hh + ".png", bytes: b }]); });
};
AP.exportCopy = function () { var self = this; if (!this.img) return this.toast("Open an image first.", "err"); return canvasToPngBytes(this.img.canvas).then(function (b) { return self.saveFiles([{ name: Core.sanitizeName(self.img.name) + "_copy.png", bytes: b }]); }); };

/* ---------- grid / sprites ---------- */
AP.baseName = function () { return Core.sanitizeName(this.$("basename").value || (this.img && this.img.name) || "sprite", "sprite"); };
AP.queueGrid = function () { var self = this; clearTimeout(this.gridTimer); this.gridTimer = this.later(function () { self.updateGridUi(); }, 120); };
AP.updateGridUi = function () {
  var im = this.img, mode = this.$("mode").value, v = function (id) { return Core.toInt(this.$(id).value, 0); }.bind(this), st = this.$("grid-status");
  ["cols", "rows"].forEach(function (id) { this.$(id).readOnly = mode === "size"; }, this); ["cw", "ch"].forEach(function (id) { this.$(id).readOnly = mode === "cells"; }, this);
  var iw = im ? im.width : 0, ih = im ? im.height : 0, p = { cols: v("cols"), rows: v("rows"), cellW: v("cw"), cellH: v("ch"), marginX: v("mx"), marginY: v("my"), spacingX: v("sx"), spacingY: v("sy") };
  this.grid = mode === "cells" ? Core.gridFromCells(iw, ih, p) : Core.gridFromSize(iw, ih, p);
  var g = this.grid; if (isFinite(g.cols) && mode === "size") this.$("cols").value = g.cols; if (isFinite(g.rows) && mode === "size") this.$("rows").value = g.rows; if (isFinite(g.cellW) && mode === "cells") this.$("cw").value = g.cellW; if (isFinite(g.cellH) && mode === "cells") this.$("ch").value = g.cellH;
  this.sprites = Core.buildSprites(g, this.baseName()); if (this.sel >= this.sprites.length) this.sel = -1; var n = this.sprites.length; this.seq = this.seq.filter(function (i) { return i < n; });
  st.className = "pal-status " + (!im ? "" : g.ok ? (g.warnings.length ? "warn" : "ok") : "err");
  st.textContent = !im ? "Open an image to define a grid." : g.ok ? n + " sprites of " + g.cellW + " x " + g.cellH + " px." + (g.warnings.length ? " " + g.warnings.join(" ") : "") : g.errors.join(" ");
  this.renderStrip(); this.renderSpriteInfo(); this.seqChanged(); this.render(); this.regen();
};
AP.renderStrip = function () {
  var self = this, box = this.$("strip"), n = Math.min(this.sprites.length, 300); box.innerHTML = ""; if (!this.img || !n) return; var token = this.stripToken = (this.stripToken || 0) + 1, i = 0;
  function batch() { if (token !== self.stripToken || !self.root) return; for (var k = 0; k < 40 && i < n; k++, i++) { (function (s) { var b = h("button", { type: "button", class: "pal-thumb", "aria-label": "Select sprite " + s.number }), c = document.createElement("canvas"), sc = Math.max(1, Math.floor(44 / Math.max(s.width, s.height))); c.width = Math.min(44, s.width * sc); c.height = Math.min(44, s.height * sc); var x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(self.img.canvas, s.x, s.y, s.width, s.height, 0, 0, c.width, c.height); b.appendChild(c); b.setAttribute("data-i", s.index); b.addEventListener("click", function () { self.select(s.index); }); box.appendChild(b); })(self.sprites[i]); } self.markStrip(); if (i < n) self.later(batch, 16); else if (self.sprites.length > n) box.appendChild(h("span", { class: "pal-note", text: "Showing first " + n + " sprites. Tap the sheet for the rest." })); }
  batch();
};
AP.markStrip = function () { var s = this.sel; Array.prototype.forEach.call(this.$("strip").querySelectorAll(".pal-thumb"), function (b) { b.classList.toggle("on", Number(b.getAttribute("data-i")) === s); }); };
AP.select = function (i) { this.sel = i; this.markStrip(); this.renderSpriteInfo(); this.render(); if (this.tab === "code" || this.$("css-scope").value === "selected") this.regen(); };
AP.renderSpriteInfo = function () { var s = this.sprites[this.sel]; this.$("sprite-info").textContent = s ? s.name + "  x " + s.x + "  y " + s.y + "  " + s.width + " x " + s.height + " px  (col " + s.col + ", row " + s.row + ")" + (s.empty ? "  EMPTY" : "") : "Select a sprite on the sheet."; };
AP.spriteBytes = function (s) { var c = document.createElement("canvas"); c.width = s.width; c.height = s.height; var x = c.getContext("2d"); if (!x) return Promise.reject(new Error("Canvas unavailable.")); x.imageSmoothingEnabled = false; x.drawImage(this.img.canvas, s.x, s.y, s.width, s.height, 0, 0, s.width, s.height); return canvasToPngBytes(c); };
AP.isEmpty = function (s) { return Core.alphaStats(this.img.ctx.getImageData(s.x, s.y, s.width, s.height).data).empty; };
AP.detectEmpty = function () {
  var self = this; if (!this.img || !this.grid.ok) return this.toast("Define a valid grid first.", "err"); var done = this.busy("Scanning sprites..."), i = 0, empties = 0;
  function next() { if (i >= self.sprites.length) return Promise.resolve(); var s = self.sprites[i++]; s.empty = self.isEmpty(s); if (s.empty) empties++; return i % 16 === 0 ? tick().then(next) : next(); }
  return next().then(function () { done(); self.emptyChecked = true; self.renderSpriteInfo(); self.toast(empties ? empties + " empty sprite(s) found." : "No empty sprites.", empties ? "warn" : "ok"); }, function (e) { done(); throw e; });
};
AP.exportSelected = function () {
  var self = this; if (!this.img) return this.toast("Open an image first.", "err"); var s = this.sprites[this.sel]; if (!s) return this.toast("Select a sprite first.", "err");
  return Promise.resolve(this.isEmpty(s) ? this.confirm("Empty sprite", "This region is fully transparent. Export it anyway?", "Export") : true).then(function (ok) { if (ok) return self.exportSprites([s]); });
};
AP.exportSprites = function (list, kind) { var self = this, n = this.sprites.length; return Promise.all(list.map(function (s) { return self.spriteBytes(s); })).then(function (bs) { return self.saveFiles(list.map(function (s, i) { return { name: Core.spriteFileName(self.baseName(), s, n, "png"), bytes: bs[i] }; })); }); };
AP.exportAll = function (zip) {
  var self = this; if (!this.img || !this.grid.ok) return this.toast("Define a valid grid first.", "err");
  var p = this.emptyChecked ? Promise.resolve() : this.detectEmpty();
  return p.then(function () {
    var list = self.sprites.filter(function (s) { return !(self.$("skip-empty").checked && s.empty); }); if (!list.length) return self.toast("Every sprite is empty; nothing to export.", "err");
    var go = list.length > 100 && !zip ? self.confirm("Many files", "This writes " + list.length + " files. Continue?", "Write files") : Promise.resolve(true);
    return go.then(function (ok) {
      if (!ok) return; var done = self.busy("Exporting 0/" + list.length), files = [], i = 0, n = self.sprites.length, base = self.baseName();
      function next() { if (i >= list.length) return Promise.resolve(); var s = list[i]; return self.spriteBytes(s).then(function (b) { files.push({ name: (zip ? "sprites/" : "") + Core.spriteFileName(base, s, n, "png"), bytes: b }); i++; done("Exporting " + i + "/" + list.length); return tick().then(next); }); }
      return next().then(function () {
        var code = self.codeFor(true); files.push({ name: zip ? "metadata.json" : base + "_metadata.json", bytes: Core.utf8(code.json) }); if (code.css) files.push({ name: zip ? "sprites.css" : base + "_sprites.css", bytes: Core.utf8(code.css) });
        if (zip) { var z = Core.zipStore(files.map(function (f) { return { name: f.name, data: f.bytes }; })); files = [{ name: base + "_sprites.zip", bytes: z }]; }
        done(); return self.saveFiles(files);
      }, function (e) { done(); throw e; });
    });
  });
};

/* ---------- animation ---------- */
AP.addFrame = function (i) { this.seq.push(i); this.seqChanged(); };
AP.seqChanged = function () {
  var self = this, box = this.$("seq"); box.innerHTML = ""; if (this.anim.i >= this.seq.length) this.anim.i = 0;
  this.seq.forEach(function (idx, k) { var c = h("span", { class: "pal-chip" + (k === self.anim.i ? " on" : "") }); var a = h("button", { type: "button", text: String(k + 1) + ": #" + (idx + 1), "aria-label": "Show frame " + (k + 1) }); a.addEventListener("click", function () { self.anim.i = k; self.seqChanged(); }); var x = h("button", { type: "button", "aria-label": "Remove frame " + (k + 1), text: "x" }); x.addEventListener("click", function () { self.seq.splice(k, 1); self.seqChanged(); }); c.appendChild(a); c.appendChild(x); box.appendChild(c); });
  this.drawAnim(); this.render(); this.regen();
};
AP.drawAnim = function () {
  if (!this.root) return; var cv = this.$("anim-canvas"), lbl = this.$("frame-label"), box = this.$("animbox"), bg = this.$("anim-bg").value; box.setAttribute("data-bg", bg);
  var idx = this.seq[this.anim.i], s = this.sprites[idx], x = cv.getContext("2d"); if (!x) return;
  if (!this.img || !s) { cv.width = 64; cv.height = 64; x.clearRect(0, 0, 64, 64); lbl.textContent = "No frames"; return; }
  var sc = Math.max(1, Math.floor(Math.min(240 / s.width, 240 / s.height))); cv.width = s.width * sc; cv.height = s.height * sc; x.imageSmoothingEnabled = false; x.clearRect(0, 0, cv.width, cv.height); x.drawImage(this.img.canvas, s.x, s.y, s.width, s.height, 0, 0, cv.width, cv.height);
  lbl.textContent = "Frame " + (this.anim.i + 1) + " / " + this.seq.length + "  (sprite " + s.number + ", " + this.$("fps").value + " FPS)";
  Array.prototype.forEach.call(this.$("seq").children, function (c, k) { c.classList.toggle("on", k === this.anim.i); }, this);
};
AP.step = function (d) { if (!this.seq.length) return; this.anim.i = (this.anim.i + d + this.seq.length) % this.seq.length; this.drawAnim(); };
AP.togglePlay = function () { if (this.anim.playing) this.pause(); else this.play(); };
AP.play = function () { var self = this; if (this.seq.length < 1) return this.toast("Add frames first."); this.anim.playing = true; this.anim.last = 0; this.anim.acc = 0; this.$("play-label").textContent = "Pause"; function tickf(ts) { if (!self.anim.playing || !self.root) return; if (self.anim.last) self.anim.acc += ts - self.anim.last; self.anim.last = ts; var fp = 1000 / Core.clamp(Core.toInt(self.$("fps").value, 8), 1, 60); while (self.anim.acc >= fp) { self.anim.acc -= fp; if (self.anim.i + 1 >= self.seq.length) { if (self.$("loop").checked) self.anim.i = 0; else { self.pause(); return; } } else self.anim.i++; } self.drawAnim(); self.anim.raf = requestAnimationFrame(tickf); } this.anim.raf = requestAnimationFrame(tickf); };
AP.pause = function () { this.anim.playing = false; if (this.anim.raf) cancelAnimationFrame(this.anim.raf); this.anim.raf = 0; if (this.root) this.$("play-label").textContent = "Play"; };

/* ---------- code generation ---------- */
AP.subset = function (scope) { var self = this; if (scope === "selected") return this.sprites[this.sel] ? [this.sprites[this.sel]] : []; if (scope === "sequence") { var seen = {}; return this.seq.filter(function (i) { return !seen[i] && (seen[i] = 1); }).map(function (i) { return self.sprites[i]; }).filter(Boolean); } return this.sprites; };
AP.codeFor = function (all) {
  var im = this.img; if (!im) return { css: "", json: "", note: "Open an image first." };
  var scope = all ? "all" : this.$("css-scope").value, list = this.subset(scope), anim = this.seq.length ? { fps: Core.clamp(Core.toInt(this.$("fps").value, 8), 1, 60), loop: this.$("loop").checked, frames: this.seq.slice() } : null, url = this.$("css-url").value || im.name, css = "", note = "";
  if (!this.grid || !this.grid.ok) css = Core.generateImageCss({ className: this.$("css-class").value, imageUrl: url, width: im.width, height: im.height, pixelArt: this.$("css-pixel").checked, scale: Core.clamp(Core.toInt(this.$("css-scale").value, 1), 1, 16) });
  else if (!list.length) note = scope === "selected" ? "Select a sprite first." : "Add animation frames first.";
  else css = Core.generateSpriteCss({ className: this.$("css-class").value, imageUrl: url, imageWidth: im.width, imageHeight: im.height, sprites: list, allSprites: this.sprites, pixelArt: this.$("css-pixel").checked, scale: this.$("css-scale").value, animation: this.$("css-anim").checked || all ? anim : null });
  var json = this.grid && this.grid.ok ? Core.metadataToJson(Core.generateMetadata({ name: im.name, width: im.width, height: im.height }, this.grid, list, anim, this.sprites)) : JSON.stringify({ generator: "PNG Asset Lab " + Core.VERSION, image: { name: im.name, width: im.width, height: im.height }, sprites: [], animation: null }, null, 2) + "\n";
  return { css: css, json: json, note: note };
};
AP.regen = function () { if (!this.root) return; var c = this.codeFor(false); this.$("css-out").value = c.css || (c.note ? "/* " + c.note + " */\n" : ""); this.$("json-out").value = this.img ? c.json : ""; };
AP.copy = function (text, label) { var self = this; if (!text) return this.toast("Nothing to copy.", "err"); return AcodeIO.copyText(text).then(function (ok) { self.toast(ok ? label + " copied." : "Copy failed. Select the text and copy it manually.", ok ? "ok" : "err"); }); };

/* ---------- saving ---------- */
AP.saveText = function (name, text, mime) { if (!text) return this.toast("Nothing to save.", "err"); return this.saveFiles([{ name: name, bytes: Core.utf8(text), mime: mime }]); };
AP.saveFiles = function (files) {
  var self = this; for (var k = 0; k < files.length; k++) if (!Core.isValidFilename(files[k].name.replace(/^.*\//, ""))) return Promise.reject(new Error("Invalid file name: " + files[k].name));
  var hasFs = AcodeIO.has() && (AcodeIO.mod("fsOperation") || AcodeIO.mod("fs"));
  if (!hasFs) { files.forEach(function (f) { AcodeIO.browserDownload(f.name, f.bytes, f.mime); }); this.toast("Acode file system not available: started browser download for " + files.length + " file(s). Check your downloads.", "warn"); return Promise.resolve(); }
  var dirP = this.set.exportDir ? Promise.resolve(this.set.exportDir) : AcodeIO.pickFolder("Choose export folder").then(function (u) { self.set.exportDir = u; self.saveSettings(); self.applySettings(); return u; });
  return dirP.then(function (dir) {
    return Promise.all(files.map(function (f) { return AcodeIO.exists(dir, f.name); })).then(function (ex) {
      var n = ex.filter(Boolean).length; return (n ? self.confirm("Overwrite files", n + " file(s) already exist in the export folder. Overwrite them?", "Overwrite", true) : Promise.resolve(true)).then(function (ok) {
        if (!ok) return self.toast("Export cancelled.");
        var done = self.busy("Saving 0/" + files.length), okN = 0, bad = [], i = 0;
        function next() { if (i >= files.length) return Promise.resolve(); var f = files[i++]; return AcodeIO.writeBinary(dir, f.name, f.bytes).then(function () { okN++; }, function (e) { bad.push(f.name + ": " + e.message); Diag.log("error", "save failed " + f.name, e); }).then(function () { done("Saving " + i + "/" + files.length); return next(); }); }
        return next().then(function () { done(); if (!bad.length) self.toast("Saved " + okN + " file(s) to " + dir, "ok"); else return self.modal("Export finished with errors", [h("p", { class: "pal-note", text: okN + " saved, " + bad.length + " failed." }), h("pre", { class: "pal-code", text: bad.slice(0, 8).join("\n") })], [{ label: "OK", cls: "pal-primary", value: true }]); });
      });
    });
  }).catch(function (e) { if (e.message === "cancelled") return self.toast("Export cancelled."); throw e; });
};

/* ---------- packs ---------- */
AP.renderAbout = function () { var ul = this.$("about-licenses"); ul.innerHTML = ""; Packs.bundled.forEach(function (b) { ul.appendChild(h("li", { text: b.manifest.name + ": " + Packs.licenseLine(b.manifest.license) })); }); if (Packs.problems.length) ul.appendChild(h("li", { class: "pal-status err", text: "Problems: " + Packs.problems.join(" | ") })); };
AP.thumbs = function (pack) {
  var box = h("div", { class: "pal-pthumb" }); if (pack.preview) { var im = h("img", { alt: "", src: pack.preview }); box.appendChild(im); return box; }
  pack.manifest.assets.slice(0, 4).forEach(function (a) { box.appendChild(h("img", { alt: "", src: Packs.dataUrl(pack, a) })); }); if (!pack.manifest.assets.length) box.appendChild(icon("pack")); return box;
};
AP.renderPacks = function () {
  var self = this, list = this.$("packs-list"); this.$("pack-view").hidden = !this.openPackId; this.$("packs-list-card").hidden = !!this.openPackId; if (this.openPackId) return this.renderPackView(); list.innerHTML = "";
  Packs.all().forEach(function (p) {
    var m = p.manifest, card = h("div", { class: "pal-pack" }, [self.thumbs(p), h("div", { class: "pal-pack-body" }, [h("h3", { text: m.name }), h("p", { class: "pal-note", text: m.description }), h("p", { class: "pal-badges" }, [h("span", { class: "pal-badge", text: m.assets.length + " assets" }), h("span", { class: "pal-badge", text: m.license.spdx }), h("span", { class: "pal-badge " + (m.license.commercialUse ? "ok" : "warn"), text: m.license.commercialUse ? "commercial OK" : "no commercial grant" }), h("span", { class: "pal-badge", text: "v" + m.version })])])]);
    var b = h("button", { type: "button", class: "pal-btn pal-primary", text: "Open" }); b.addEventListener("click", function () { self.openPackId = m.id; self.openAssetId = null; self.renderPacks(); }); card.appendChild(b); list.appendChild(card);
  });
};
AP.renderPackView = function () {
  var self = this, p = Packs.get(this.openPackId), box = this.$("pack-view"); if (!p) { this.openPackId = null; return this.renderPacks(); } var m = p.manifest, user = p.kind === "user"; box.innerHTML = "";
  function act(label, ico, fn, cls) { var b = h("button", { type: "button", class: "pal-btn " + (cls || "") }, [icon(ico), h("span", { text: label })]); b.addEventListener("click", function () { Promise.resolve().then(fn).catch(function (e) { self.fail("Action failed", e); }); }); return b; }
  var back = act("All packs", "back", function () { self.openPackId = null; self.renderPacks(); });
  box.appendChild(back); box.appendChild(h("h2", { text: m.name })); box.appendChild(h("p", { class: "pal-note", text: m.description + " (v" + m.version + ")" }));
  box.appendChild(h("div", { class: "pal-license" }, [h("b", { text: "License: " }), h("span", { text: Packs.licenseLine(m.license) }), m.license.url ? h("div", { class: "pal-note", text: m.license.url }) : null, m.license.notes ? h("div", { class: "pal-note", text: m.license.notes }) : null]));
  var grid = h("div", { class: "pal-assets" }); if (!m.assets.length) grid.appendChild(h("p", { class: "pal-note", text: user ? "No assets yet. Use Add PNG." : "Empty pack." }));
  m.assets.forEach(function (a) { var b = h("button", { type: "button", class: "pal-asset" + (a.id === self.openAssetId ? " on" : ""), "aria-label": a.name }, [h("img", { alt: a.name, src: Packs.dataUrl(p, a) }), h("span", { text: a.name })]); b.addEventListener("click", function () { self.openAssetId = a.id; self.renderPackView(); }); grid.appendChild(b); }); box.appendChild(grid);
  var a = m.assets.filter(function (x) { return x.id === self.openAssetId; })[0];
  if (a) { box.appendChild(h("div", { class: "pal-card inner" }, [h("h3", { text: a.name }), h("p", { class: "pal-note", text: "File: " + a.path + "  |  " + a.width + " x " + a.height + " px  |  id: " + a.id })])); var row = h("div", { class: "pal-grid2" });
    row.appendChild(act("Open in workspace", "image", function () { self.showTab("workspace"); return self.loadBytes(Packs.bytes(p, a), a.path, { origin: "pack" }); }, "pal-primary")); row.appendChild(act("Export PNG", "download", function () { return self.saveFiles([{ name: a.path, bytes: Packs.bytes(p, a) }]); }));
    if (user) { row.appendChild(act("Rename", "edit", function () { return self.prompt("Rename asset", a.name).then(function (n) { if (n === null) return; Packs.renameAsset(m.id, a.id, n); self.renderPackView(); }); })); row.appendChild(act("Remove", "trash", function () { return self.confirm("Remove asset", 'Remove "' + a.name + '" from this pack?', "Remove", true).then(function (ok) { if (!ok) return; Packs.removeAsset(m.id, a.id); self.openAssetId = null; self.renderPackView(); }); }, "pal-danger")); } box.appendChild(row); }
  var ex = h("div", { class: "pal-grid2" });
  if (user) ex.appendChild(act("Add PNG", "plus", function () { return self.addToPack(m.id); }, "pal-primary"));
  ex.appendChild(act("Export manifest", "code", function () { return self.saveText(m.id + "_pack.json", Packs.manifestJson(p, false), "application/json"); }));
  if (user) ex.appendChild(act("Export pack file", "download", function () { return self.saveText(m.id + "_pack_full.json", Packs.manifestJson(p, true), "application/json"); }));
  ex.appendChild(act("Export ZIP", "pack", function () { var files = [{ name: "pack.json", data: Core.utf8(Packs.manifestJson(p, false)) }]; m.assets.forEach(function (x) { files.push({ name: "images/" + x.path, data: Packs.bytes(p, x) }); }); return self.saveFiles([{ name: m.id + "_pack.zip", bytes: Core.zipStore(files) }]); }));
  if (user && m.id !== CUSTOM_ID) ex.appendChild(act("Delete pack", "trash", function () { return self.confirm("Delete pack", 'Delete "' + m.name + '" and all its images?', "Delete", true).then(function (ok) { if (!ok) return; Packs.removePack(m.id); self.openPackId = null; self.renderPacks(); }); }, "pal-danger"));
  box.appendChild(ex); if (user && !Store.ok) box.appendChild(h("p", { class: "pal-status warn", text: "Saving is unavailable: this pack disappears when the app closes. Export it to keep it." }));
};
AP.addToPack = function (packId) {
  var self = this; return this.choose("Add PNG from", [["acode", "Acode file browser"], ["system", "System picker"]]).then(function (src) {
    if (!src) return; var get = src === "acode" ? AcodeIO.pickFile("Select PNG").then(function (f) { return AcodeIO.readFile(f.url).then(function (b) { return [{ name: f.name, bytes: b }]; }); }) : self.openSystem(true).then(function (fl) { return Promise.all(fl.map(function (f) { return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res({ name: f.name, bytes: new Uint8Array(fr.result) }); }; fr.onerror = function () { rej(fr.error); }; fr.readAsArrayBuffer(f); }); })); });
    return get.then(function (items) {
      if (!items.length) return self.toast("No file selected."); var added = 0, errs = [], i = 0, saved = true;
      function next() { if (i >= items.length) return Promise.resolve(); var it = items[i++], hd = Core.readPngHeader(it.bytes); if (!hd) { errs.push(it.name + ": not a PNG"); return next(); } if (it.bytes.length > 2 * 1024 * 1024) { errs.push(it.name + ": larger than 2 MB"); return next(); } return decodePngBytes(it.bytes).then(function () { saved = Packs.addAsset(packId, Core.sanitizeName(it.name, "asset"), it.bytes, hd.width, hd.height) && saved; added++; }, function (e) { errs.push(it.name + ": " + e.message); }).then(next); }
      return next().then(function () { self.renderPackView(); self.toast(added + " added" + (errs.length ? ", " + errs.length + " rejected: " + errs[0] : "") + (added && !saved ? ". Could not save (storage full or unavailable)." : "."), errs.length || !saved ? "warn" : "ok"); });
    });
  }).catch(function (e) { if (e.message !== "cancelled") self.fail("Could not add PNG", e); });
};
AP.newPack = function () { var self = this; return this.prompt("New pack name", "My pack").then(function (n) { if (n === null) return; n = n.trim(); if (!n) return self.toast("Name cannot be empty.", "err"); var r = Packs.createPack(n); self.openPackId = r.id; self.renderPacks(); self.toast(r.saved ? "Pack created." : "Pack created (not saved: storage unavailable).", r.saved ? "ok" : "warn"); }); };
AP.importPack = function () {
  var self = this; return this.choose("Import pack file (.json) from", [["acode", "Acode file browser"], ["system", "System picker"]]).then(function (src) {
    if (!src) return; var get = src === "acode" ? AcodeIO.pickFile("Select pack .json").then(function (f) { return AcodeIO.readFile(f.url).then(function (b) { return new TextDecoder().decode(b); }); }) : self.openSystem(true, ".json,application/json").then(function (fl) { if (!fl.length) return null; return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(String(fr.result)); }; fr.onerror = function () { rej(fr.error); }; fr.readAsText(fl[0]); }); });
    return get.then(function (text) {
      if (text === null) return self.toast("No file selected."); if (text.length > 8 * 1024 * 1024) return self.toast("Pack file is larger than 8 MB.", "err"); var r = Packs.parseImport(text);
      if (!r.ok) return self.modal("Pack rejected", [h("pre", { class: "pal-code", text: r.errors.slice(0, 10).join("\n") })], [{ label: "OK", cls: "pal-primary", value: true }]);
      var exists = Packs.user.some(function (x) { return x.id === r.manifest.id; }); return (exists ? self.confirm("Replace pack", 'A pack with id "' + r.manifest.id + '" exists. Replace it?', "Replace", true) : Promise.resolve(true)).then(function (ok) { if (!ok) return; var s = Packs.saveImported(r.manifest); self.renderPacks(); self.toast(s ? "Pack imported." : "Pack imported (not saved: storage unavailable).", s ? "ok" : "warn"); });
    });
  }).catch(function (e) { if (e.message !== "cancelled") self.fail("Import failed", e); });
};
