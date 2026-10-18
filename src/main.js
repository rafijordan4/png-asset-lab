/* PNG Asset Lab - plugin entry. Lifecycle follows https://docs.acode.app/docs/plugin-essentials/core-file :
   acode.setPluginInit(id, init) and acode.setPluginUnmount(id, unmount). */
var PLUGIN_ID = "com.rafi.png-asset-lab";
var CMD_OPEN = "png-asset-lab.open", CMD_IMPORT = "png-asset-lab.import", CMD_SAMPLE = "png-asset-lab.sample";

function PngAssetLabPlugin() { this.baseUrl = ""; this.page = null; this.app = null; this.failure = null; this.commands = null; this.registered = []; this.ready = false; }
var PP = PngAssetLabPlugin.prototype;

PP.init = function (page) {
  var self = this;
  if (this.ready) this.destroy(); // init is repeatable: never stack registrations
  this.page = page; this.failure = null;
  try {
    Diag.setStage("environment"); if (typeof document === "undefined" || !window.acode) throw new Error("Acode API (window.acode) is not available.");
    if (!page) throw new Error("Acode did not pass a $page object to init.");
    Diag.setStage("storage"); Store.probe(); var st = Store.get("settings", {}); Diag.dev = !!st.dev;
    Diag.setStage("packs"); Packs.init();
    Diag.setStage("commands"); this.commands = acode.require("commands"); if (!this.commands || !this.commands.addCommand) throw new Error('acode.require("commands") is unavailable on this Acode version.');
    [[CMD_OPEN, "PNG Asset Lab: Open workspace", function () { self.open(); }, "Ctrl-Alt-L"], [CMD_IMPORT, "PNG Asset Lab: Import PNG", function () { self.open(); if (self.app) self.app.openAcode(); }], [CMD_SAMPLE, "PNG Asset Lab: Open sample sheet", function () { self.open(); if (self.app) self.app.loadSample().catch(function (e) { self.app.fail("Sample failed", e); }); }]].forEach(function (c) {
      try { self.commands.removeCommand(c[0]); } catch (e) { /* not registered yet */ }
      var d = { name: c[0], description: c[1], exec: function () { try { c[2](); } catch (e) { Diag.log("error", "command failed " + c[0], e); self.showFailure(e); } return true; } };
      if (c[3]) d.bindKey = { win: c[3], mac: c[3].replace("Ctrl", "Command") };
      self.commands.addCommand(d); self.registered.push(c[0]);
    });
    this.ready = true; Diag.setStage("ready"); Diag.log("info", "initialised v" + Core.VERSION + "; storage=" + Store.ok + "; bundled packs=" + Packs.bundled.length);
  } catch (e) {
    this.failure = { stage: Diag.stage, error: e }; Diag.log("error", "init failed at stage " + Diag.stage, e);
    try { if (window.acode && acode.alert) acode.alert("PNG Asset Lab", "Failed at stage '" + Diag.stage + "': " + e.message); } catch (x) { /* ignore */ }
  }
};
PP.open = function () {
  try {
    if (this.failure) return this.showFailure(this.failure.error);
    if (!this.app) { this.app = new App(this); this.app.mount(this.page); }
    else if (!this.app.root || !this.app.root.parentNode) { this.app.destroy(); this.app = new App(this); this.app.mount(this.page); }
    this.page.show(); this.app.later(function () { }, 0); var a = this.app; setTimeout(function () { if (a.root) a.resize(); }, 80);
  } catch (e) { Diag.log("error", "open failed at stage " + Diag.stage, e); if (this.app) { try { this.app.destroy(); } catch (x) { /* ignore */ } this.app = null; } this.showFailure(e); }
};
PP.showFailure = function (err) {
  var p = this.page; if (!p) return;
  try {
    p.innerHTML = ""; var box = document.createElement("div"); box.style.cssText = "padding:16px;color:#eee;background:#16171d;min-height:100%;font:14px system-ui;white-space:pre-wrap";
    box.textContent = "PNG Asset Lab could not start.\n\nStage: " + Diag.stage + "\nError: " + (err && err.message ? err.message : String(err)) + "\n\nCommon causes: unsupported Acode version, missing file in the ZIP, WebView without canvas support.\nSee readme.md > Troubleshooting.\n\nLog:\n" + Diag.text();
    p.appendChild(box); if (p.show) p.show();
  } catch (e) { console.error("[PNGAssetLab] could not render failure page", e); }
};
PP.destroy = function () {
  var self = this;
  if (this.app) { try { this.app.destroy(); } catch (e) { Diag.log("warn", "app destroy failed", e); } this.app = null; }
  if (this.commands) this.registered.forEach(function (n) { try { self.commands.removeCommand(n); } catch (e) { Diag.log("warn", "removeCommand failed " + n, e); } });
  this.registered = []; this.ready = false;
  if (this.page) { try { this.page.innerHTML = ""; } catch (e) { /* ignore */ } }
};

if (typeof window !== "undefined" && window.acode) {
  var palPlugin = new PngAssetLabPlugin();
  acode.setPluginInit(PLUGIN_ID, function (baseUrl, $page) { palPlugin.baseUrl = baseUrl && baseUrl.endsWith("/") ? baseUrl : (baseUrl || "") + "/"; palPlugin.init($page); });
  acode.setPluginUnmount(PLUGIN_ID, function () { palPlugin.destroy(); });
}
