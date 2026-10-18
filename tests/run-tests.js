#!/usr/bin/env node
"use strict";
/* Automated checks (no Acode runtime needed). Run: node tests/run-tests.js */
const fs = require("fs"), path = require("path"), cp = require("child_process"), zlib = require("zlib");
const ROOT = path.join(__dirname, ".."), core = require("../src/core.js");
let failed = 0, count = 0;
function t(name, fn) { count++; try { fn(); console.log("PASS " + name); } catch (e) { failed++; console.log("FAIL " + name + "\n     " + e.message); } }
function eq(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || "") + " expected " + JSON.stringify(b) + " got " + JSON.stringify(a)); }
function ok(c, m) { if (!c) throw new Error(m || "assertion failed"); }
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const json = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
function walk(d, b) { b = b || d; let o = []; for (const n of fs.readdirSync(d)) { const f = path.join(d, n); if (fs.statSync(f).isDirectory()) o = o.concat(walk(f, b)); else o.push(path.relative(b, f).split(path.sep).join("/")); } return o; }

/* 1-5: manifest + project files */
const m = json("plugin.json");
t("manifest parses and has required fields", () => { ["id", "name", "version", "main"].forEach((k) => ok(m[k], "missing " + k)); eq(m.id, "com.rafi.png-asset-lab"); ok(/^\d+\.\d+\.\d+$/.test(m.version), "version format"); ok(Number.isInteger(m.minVersionCode) && m.minVersionCode >= 290, "minVersionCode"); ok(m.icon === "icon.png" && m.readme === "readme.md" && m.changelogs === "changelogs.md", "paths/casing"); eq(m.price, 0); });
t("manifest declares only documented fields", () => { const allowed = ["$schema", "id", "name", "version", "main", "minVersionCode", "author", "readme", "icon", "files", "dependencies", "price", "license", "keywords", "changelogs", "contributors", "repository", "permissions"]; Object.keys(m).forEach((k) => ok(allowed.includes(k), "unexpected field " + k)); });
t("icon.png is <= 50 KB", () => ok(fs.statSync(path.join(ROOT, "icon.png")).size <= 50 * 1024));
t("source entry points and docs exist", () => ["src/core.js", "src/support.js", "src/packs.js", "src/ui.js", "src/main.js", "src/styles.css", "readme.md", "changelogs.md", "LICENSE", "scripts/build.js", "tests/validate-zip.js", ".github/workflows/build.yml", "docs/troubleshooting.md"].forEach((p) => ok(exists(p), "missing " + p)));
t("manifest `files` lists exactly the shipped assets", () => { const want = walk(path.join(ROOT, "assets")).map((f) => "assets/" + f).concat(["LICENSE"]).sort(); eq(m.files.slice().sort(), want); m.files.forEach((f) => ok(exists(f), "missing " + f)); });
t("JavaScript syntax valid (node --check on every src file)", () => { ["core", "support", "packs", "ui", "main"].forEach((n) => cp.execFileSync(process.execPath, ["--check", path.join(ROOT, "src", n + ".js")])); ["build", "zip", "gen-icons"].forEach((n) => cp.execFileSync(process.execPath, ["--check", path.join(ROOT, "scripts", n + ".js")])); });
t("CSS is balanced and non-empty", () => { const c = fs.readFileSync(path.join(ROOT, "src/styles.css"), "utf8"); eq((c.match(/{/g) || []).length, (c.match(/}/g) || []).length); ok(c.length > 2000); });
t("every element id used by ui.js selectors exists in the template", () => {
  const ui = fs.readFileSync(path.join(ROOT, "src/ui.js"), "utf8"), tpl = ui.slice(ui.indexOf("var TEMPLATE"), ui.indexOf("function App("));
  const have = new Set(); let r; const re1 = /id="pal-([a-z0-9-]+)"/g; while ((r = re1.exec(tpl))) have.add(r[1]);
  const re2 = /(?:btn|num|chk|sel)\("([a-z0-9-]+)"/g; while ((r = re2.exec(tpl))) have.add(r[1]);
  const used = new Set(); const re3 = /(?:\$|click)\("([a-z0-9-]+)"/g; while ((r = re3.exec(ui))) used.add(r[1]);
  const re4 = /\[((?:"[a-z0-9-]+",? ?)+)\]\.forEach\(function \(id\)/g; while ((r = re4.exec(ui))) (r[1].match(/[a-z0-9-]+/g) || []).forEach((x) => used.add(x));
  const missing = [...used].filter((x) => !have.has(x)); eq(missing, [], "ids used but not in template:");
});
t("main.js registers init and unmount with the manifest id", () => { const s = fs.readFileSync(path.join(ROOT, "src/main.js"), "utf8"); ok(s.includes('PLUGIN_ID = "' + m.id + '"') && s.includes("acode.setPluginInit(PLUGIN_ID") && s.includes("acode.setPluginUnmount(PLUGIN_ID")); });

/* 6: packs */
t("all bundled pack manifests validate and every asset file exists with real dimensions", () => {
  const dirs = fs.readdirSync(path.join(ROOT, "assets/packs")); eq(dirs.length, 8, "pack count");
  dirs.forEach((id) => { const pm = json("assets/packs/" + id + "/pack.json"); const v = core.validatePackManifest(pm, "bundled"); ok(v.ok, id + ": " + v.errors.join("; ")); eq(pm.id, id); ok(pm.license.spdx === "CC0-1.0" && pm.license.commercialUse === true);
    pm.assets.forEach((a) => { const b = fs.readFileSync(path.join(ROOT, "assets/packs", id, a.path)); const hd = core.readPngHeader(new Uint8Array(b)); ok(hd, a.path + " not PNG"); eq([hd.width, hd.height], [a.width, a.height], a.path); });
    ok(exists("assets/previews/" + id + ".png"), "preview " + id); });
});
t("pack validator rejects bad paths, executable fields and bad data", () => {
  const base = () => ({ schema: "png-asset-lab.pack/1", id: "my-pack", name: "P", version: "1.0.0", description: "d", license: { spdx: "MIT", name: "MIT", commercialUse: true, attributionRequired: false }, assets: [{ id: "aa", name: "A", path: "a.png", width: 1, height: 1 }] });
  ok(core.validatePackManifest(base(), "bundled").ok);
  ["../x.png", "/etc/a.png", "a\\b.png", "http://x/a.png", "a/../b.png", "a.svg", "javascript:alert(1).png", ""].forEach((p) => { const x = base(); x.assets[0].path = p; ok(!core.validatePackManifest(x, "bundled").ok, "accepted path " + p); });
  const e = base(); e.script = "alert(1)"; ok(!core.validatePackManifest(e, "bundled").ok, "script field accepted");
  const e2 = base(); e2.assets[0].onload = "x"; ok(!core.validatePackManifest(e2, "bundled").ok);
  const l = base(); l.license.attributionRequired = true; ok(!core.validatePackManifest(l, "bundled").ok, "attribution text required");
  ok(!core.validatePackManifest(base(), "imported").ok, "imported needs data");
  const d = base(); d.assets[0].data = "data:text/html;base64,AAAA"; ok(!core.validatePackManifest(d, "imported").ok);
  const d2 = base(); d2.assets[0].data = "data:image/png;base64,iVBORw0KGgo="; ok(core.validatePackManifest(d2, "imported").ok);
});

/* 7-8: grid */
t("grid from cells: exact division, margins, spacing", () => {
  const g = core.gridFromCells(192, 64, { cols: 6, rows: 2 }); ok(g.ok); eq([g.cellW, g.cellH], [32, 32]);
  const g2 = core.gridFromCells(100, 50, { cols: 2, rows: 1, marginX: 5, marginY: 5, spacingX: 10 }); ok(g2.ok); eq([g2.cellW, g2.cellH, g2.usedW], [40, 40, 100]);
  const g3 = core.gridFromCells(100, 50, { cols: 3, rows: 1 }); ok(g3.ok && g3.warnings.length === 1, "remainder warning");
});
t("grid from size: derives columns and rows", () => {
  const g = core.gridFromSize(192, 64, { cellW: 32, cellH: 32 }); eq([g.cols, g.rows, g.ok], [6, 2, true]);
  const g2 = core.gridFromSize(70, 40, { cellW: 16, cellH: 16, spacingX: 2, spacingY: 2, marginX: 1, marginY: 1 }); eq([g2.cols, g2.rows], [3, 2]); ok(g2.ok);
});
t("invalid grids are rejected", () => {
  ok(!core.gridFromCells(192, 64, { cols: 0, rows: 1 }).ok); ok(!core.gridFromCells(192, 64, { cols: 1, rows: 100 }).ok, "zero height cell"); ok(!core.gridFromSize(192, 64, { cellW: 0, cellH: 8 }).ok); ok(!core.gridFromSize(192, 64, { cellW: 500, cellH: 8 }).ok, "cell wider than image");
  ok(!core.gridFromCells(192, 64, { cols: 2, rows: 1, marginX: -1 }).ok); ok(!core.gridFromCells(0, 0, { cols: 1, rows: 1 }).ok); ok(!core.gridFromCells(192, 64, { cols: "abc", rows: 1 }).ok);
  ok(!core.gridFromCells(5000, 5000, { cols: 100, rows: 100, }).ok, "too many sprites");
});
t("sprite coordinates and hit-testing", () => {
  const g = core.gridFromSize(100, 50, { cellW: 20, cellH: 20, spacingX: 5, spacingY: 5, marginX: 2, marginY: 2 }); const s = core.buildSprites(g, "Hero Sheet.png");
  eq(s.length, g.cols * g.rows); eq([s[1].x, s[1].y, s[1].col], [27, 2, 1]); eq(s[g.cols].y, 27); eq(s[0].name, "Hero_Sheet_01"); eq(s[0].number, 1);
  eq(core.spriteAtPoint(g, 3, 3), 0); eq(core.spriteAtPoint(g, 23, 3), -1, "gap"); eq(core.spriteAtPoint(g, 28, 3), 1); eq(core.spriteAtPoint(g, 0, 0), -1, "margin"); eq(core.spriteAtPoint(g, 999, 3), -1);
});
t("scaling keeps aspect ratio and enforces limits", () => { eq(core.scaledSize(32, 16, { width: 64 }), { width: 64, height: 32 }); eq(core.scaledSize(32, 16, { height: 8 }), { width: 16, height: 8 }); eq(core.scaledSize(33, 17, { percent: 200 }), { width: 66, height: 34 }); eq(core.scaledSize(10, 10, { width: 99999 }), null); eq(core.scaledSize(10, 10, {}), null); });
t("colour and alpha helpers", () => { eq(core.toHex(255, 0, 170, 255), "#FF00AA"); eq(core.toHex(1, 2, 3, 128), "#01020380"); const d = new Uint8ClampedArray([0, 0, 0, 0, 1, 1, 1, 255, 1, 1, 1, 100, 0, 0, 0, 0]); const a = core.alphaStats(d); eq([a.transparent, a.opaque, a.semi, a.empty], [2, 1, 1, false]); ok(core.alphaStats(new Uint8ClampedArray(16)).empty); eq(core.pixelAt(d, 2, 1, 0).hex, "#010101"); });

/* 9: filenames */
t("export filenames are valid and predictable", () => {
  eq(core.sanitizeName("My Sheet (final).PNG"), "My_Sheet_final"); eq(core.sanitizeName("../../etc/passwd"), "etc_passwd"); eq(core.sanitizeName("", "x"), "x"); eq(core.sanitizeName("CON"), "sprite"); eq(core.sanitizeName("日本語.png", "fallback"), "fallback");
  const s = { number: 7 }; eq(core.spriteFileName("hero", s, 12, "png"), "hero_07.png"); eq(core.spriteFileName("hero", { number: 7 }, 1200, "png"), "hero_0007.png");
  ["a.png", "hero_01.png", "x-y.css"].forEach((n) => ok(core.isValidFilename(n), n)); ["", ".hidden", "a/b.png", "a..png", "con.png", "x".repeat(200)].forEach((n) => ok(!core.isValidFilename(n), "accepted " + JSON.stringify(n)));
});

/* 10: css + json from real data */
const sheet = fs.readFileSync(path.join(ROOT, "assets/samples/sample-slime-sheet.png")); const hd = core.readPngHeader(new Uint8Array(sheet)); const sm = json("assets/samples/sample-slime-sheet.json");
t("sample sheet header matches its metadata", () => { eq([hd.width, hd.height], [sm.width, sm.height]); const g = core.gridFromCells(hd.width, hd.height, { cols: sm.grid.cols, rows: sm.grid.rows }); ok(g.ok); eq([g.cellW, g.cellH], [sm.grid.cellWidth, sm.grid.cellHeight]); });
const grid = core.gridFromCells(hd.width, hd.height, { cols: 6, rows: 2 }), sprites = core.buildSprites(grid, "sample-slime-sheet");
t("metadata JSON uses actual image data and is valid", () => {
  const meta = core.generateMetadata({ name: "sample-slime-sheet.png", width: hd.width, height: hd.height }, grid, sprites, { fps: 8, loop: true, frames: [0, 1, 2] }, sprites);
  const parsed = JSON.parse(core.metadataToJson(meta)); eq(parsed.image, { name: "sample-slime-sheet.png", width: 192, height: 64 }); eq(parsed.sprites.length, 12); eq([parsed.sprites[7].x, parsed.sprites[7].y, parsed.sprites[7].width], [32, 32, 32]); eq([parsed.sprites[0].frame, parsed.sprites[2].frame, parsed.sprites[3].frame], [1, 3, null]); eq(parsed.animation.frames, ["sample-slime-sheet_01", "sample-slime-sheet_02", "sample-slime-sheet_03"]); eq(parsed.animation.fps, 8);
  const none = JSON.parse(core.metadataToJson(core.generateMetadata({ name: "a.png", width: 1, height: 1 }, grid, sprites, null))); eq(none.animation, null);
});
t("CSS uses actual sprite coordinates, size and scale", () => {
  const css = core.generateSpriteCss({ className: "Slime Hero", imageUrl: 'my "sheet".png', imageWidth: 192, imageHeight: 64, sprites: [sprites[7]], allSprites: sprites, pixelArt: true, scale: 2 });
  ok(css.includes(".slime-hero {") && css.includes("background-size: 384px 128px;") && css.includes("width: 64px;") && css.includes("background-position: -64px -64px;") && css.includes("image-rendering: pixelated;") && css.includes('my \\"sheet\\".png'), css);
  ok(!core.generateSpriteCss({ className: "a", imageUrl: "a.png", imageWidth: 1, imageHeight: 1, sprites: [], allSprites: [] }), "empty list -> empty css");
  const np = core.generateSpriteCss({ className: "a", imageUrl: "a.png", imageWidth: 192, imageHeight: 64, sprites: [sprites[0]], allSprites: sprites, pixelArt: false }); ok(!np.includes("pixelated"));
  const an = core.generateSpriteCss({ className: "a", imageUrl: "a.png", imageWidth: 192, imageHeight: 64, sprites: sprites.slice(0, 2), allSprites: sprites, animation: { fps: 4, loop: false, frames: [0, 1] } }); ok(an.includes("0.5s steps(1, end) 1 forwards") && an.includes("50% { background-position: -32px 0; }"), an);
  const one = core.generateImageCss({ className: "9bad", imageUrl: "x.png", width: 10, height: 20, pixelArt: true }); ok(one.includes(".s-9bad") && one.includes("height: 20px"));
});

/* 11-12 (ZIP writer used in-app) */
t("in-app ZIP writer produces a valid archive (CRC, structure, no nesting, unsafe names rejected)", () => {
  const files = [{ name: "sprites/a_01.png", data: new Uint8Array(sheet) }, { name: "metadata.json", data: core.utf8('{"a":1}\n') }]; const z = Buffer.from(core.zipStore(files, new Date(2026, 0, 1)));
  eq(z.readUInt32LE(0), 0x04034b50); const eocd = z.length - 22; eq(z.readUInt32LE(eocd), 0x06054b50); eq(z.readUInt16LE(eocd + 10), 2); fs.writeFileSync("/tmp/pal-test.zip", z);
  try { const out = cp.execFileSync("unzip", ["-t", "/tmp/pal-test.zip"]).toString(); ok(/No errors detected/.test(out), out); const l = cp.execFileSync("unzip", ["-Z1", "/tmp/pal-test.zip"]).toString().trim().split("\n"); eq(l, ["sprites/a_01.png", "metadata.json"]); ok(!l.some((n) => n.endsWith(".zip"))); } catch (e) { if (e.code === "ENOENT") console.log("     (unzip not installed; structure checked via headers only)"); else throw e; }
  ["../x", "/abs", "a//b", "", "a b.png"].forEach((n) => { let threw = false; try { core.zipStore([{ name: n, data: new Uint8Array(1) }]); } catch (e) { threw = true; } ok(threw, "accepted " + JSON.stringify(n)); });
  let dup = false; try { core.zipStore([{ name: "a", data: new Uint8Array(1) }, { name: "a", data: new Uint8Array(1) }]); } catch (e) { dup = true; } ok(dup, "duplicate accepted");
  eq(core.crc32(core.utf8("123456789")), 0xcbf43926);
});
t("PNG detection", () => { ok(core.isPng(new Uint8Array(sheet))); ok(!core.isPng(new Uint8Array(100))); ok(!core.isPng(new Uint8Array(Buffer.from("GIF89a" + "x".repeat(50))))); eq(core.readPngHeader(new Uint8Array(sheet)).hasAlphaChannel, true); });

console.log("\n" + (count - failed) + "/" + count + " passed"); process.exit(failed ? 1 : 0);
