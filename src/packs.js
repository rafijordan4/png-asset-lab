/* PNG Asset Lab - image pack registry. Packs are JSON data only; nothing from a pack is ever executed or injected as HTML. */
var CUSTOM_ID = "custom-user";
var Packs = {
  bundled: [], user: [], problems: [],
  customLicense: { spdx: "LicenseRef-User-Content", name: "Your own files (you are responsible for the rights)", commercialUse: false, attributionRequired: false, notes: "This app grants no license to user-added images." },

  init: function () {
    Packs.bundled = []; Packs.user = []; Packs.problems = [];
    (typeof BUNDLED_PACKS !== "undefined" ? BUNDLED_PACKS : []).forEach(function (bp) {
      var v = Core.validatePackManifest(bp.manifest, "bundled");
      if (!v.ok) { Packs.problems.push(bp.manifest && bp.manifest.id + ": " + v.errors.join("; ")); Diag.log("error", "Bundled pack rejected: " + v.errors.join("; ")); return; }
      var missing = bp.manifest.assets.filter(function (a) { return !bp.files[a.path]; });
      if (missing.length) { Packs.problems.push(bp.manifest.id + ": missing asset data"); Diag.log("error", "Bundled pack missing files: " + bp.manifest.id); return; }
      Packs.bundled.push(bp);
    });
    var saved = Store.get("userpacks", []);
    (Array.isArray(saved) ? saved : []).forEach(function (m) {
      var v = Core.validatePackManifest(m, "imported", { allowEmpty: true });
      if (v.ok) Packs.user.push(m); else { Packs.problems.push("saved pack skipped: " + v.errors[0]); Diag.log("warn", "Saved user pack invalid: " + v.errors[0]); }
    });
    if (!Packs.get(CUSTOM_ID)) Packs.user.push({ schema: "png-asset-lab.pack/1", id: CUSTOM_ID, name: "Custom User Pack", version: "1.0.0", description: "Your own PNG files. Stored on this device only.", license: Packs.customLicense, assets: [] });
  },
  all: function () { return Packs.bundled.map(function (b) { return { manifest: b.manifest, kind: "bundled", preview: b.preview }; }).concat(Packs.user.map(function (m) { return { manifest: m, kind: "user" }; })); },
  get: function (id) { var a = Packs.all().filter(function (p) { return p.manifest.id === id; }); return a[0] || null; },
  dataUrl: function (pack, asset) {
    if (pack.kind === "user") return asset.data;
    var b = Packs.bundled.filter(function (x) { return x.manifest.id === pack.manifest.id; })[0];
    return b.files[asset.path];
  },
  bytes: function (pack, asset) { return dataUrlToBytes(Packs.dataUrl(pack, asset)); },
  persist: function () { return Store.set("userpacks", Packs.user); },
  uniqueId: function (list, base) {
    var slug = Core.cssIdent(base, "item").slice(0, 40); if (slug.length < 2) slug += "-x";
    var id = slug, n = 2; while (list.some(function (x) { return x.id === id; })) id = slug + "-" + n++;
    return id;
  },
  createPack: function (name) {
    var id = Packs.uniqueId(Packs.all().map(function (p) { return p.manifest; }), name);
    Packs.user.push({ schema: "png-asset-lab.pack/1", id: id, name: String(name).slice(0, 80), version: "1.0.0", description: "User pack.", license: Packs.customLicense, assets: [] });
    return { id: id, saved: Packs.persist() };
  },
  removePack: function (id) { if (id === CUSTOM_ID) return false; Packs.user = Packs.user.filter(function (m) { return m.id !== id; }); Packs.persist(); return true; },
  addAsset: function (packId, name, bytes, w, h) {
    var m = Packs.user.filter(function (x) { return x.id === packId; })[0]; if (!m) throw new Error("Only user packs can be edited.");
    if (!Core.isPng(bytes)) throw new Error("Not a PNG file.");
    var id = Packs.uniqueId(m.assets, name);
    m.assets.push({ id: id, name: String(name).slice(0, 80), path: id + ".png", width: w, height: h, data: "data:image/png;base64," + bytesToBase64(bytes) });
    return Packs.persist();
  },
  renameAsset: function (packId, assetId, newName) {
    var m = Packs.user.filter(function (x) { return x.id === packId; })[0]; if (!m) throw new Error("Only user packs can be edited.");
    var a = m.assets.filter(function (x) { return x.id === assetId; })[0]; if (!a) throw new Error("Asset not found.");
    var name = String(newName).trim().slice(0, 80); if (!name) throw new Error("Name cannot be empty.");
    var others = m.assets.filter(function (x) { return x !== a; }), slug = Core.cssIdent(name, "item").slice(0, 40), p = slug, n = 2;
    if (p.length < 2) p += "-x";
    while (others.some(function (x) { return x.path === p + ".png"; })) p = slug + "-" + n++;
    a.name = name; a.path = p + ".png"; return Packs.persist();
  },
  removeAsset: function (packId, assetId) {
    var m = Packs.user.filter(function (x) { return x.id === packId; })[0]; if (!m) return false;
    m.assets = m.assets.filter(function (x) { return x.id !== assetId; }); Packs.persist(); return true;
  },
  /* Import a pack file (JSON text). Returns {ok, errors, manifest}. */
  parseImport: function (text) {
    var m; try { m = JSON.parse(text); } catch (e) { return { ok: false, errors: ["File is not valid JSON: " + e.message] }; }
    var v = Core.validatePackManifest(m, "imported"); if (!v.ok) return v;
    if (Packs.bundled.some(function (b) { return b.manifest.id === m.id; }) || m.id === CUSTOM_ID) return { ok: false, errors: ['The pack id "' + m.id + '" is reserved.'] };
    return { ok: true, manifest: m, errors: [] };
  },
  saveImported: function (m) { Packs.user = Packs.user.filter(function (x) { return x.id !== m.id; }); Packs.user.push(m); return Packs.persist(); },
  /* Manifest JSON text; withData=true embeds PNG data (user packs) so the file can be re-imported. */
  manifestJson: function (pack, withData) {
    var m = JSON.parse(JSON.stringify(pack.manifest));
    m.assets.forEach(function (a) { if (pack.kind === "user" && !withData) delete a.data; if (pack.kind === "bundled" && withData) a.data = Packs.dataUrl(pack, a); });
    return JSON.stringify(m, null, 2) + "\n";
  },
  licenseLine: function (l) {
    return l.name + " (" + l.spdx + ") - " + (l.commercialUse ? "commercial use allowed by this license" : "commercial use not granted/stated; check the source license") + (l.attributionRequired ? "; attribution required: " + l.attribution : "; no attribution required");
  }
};
