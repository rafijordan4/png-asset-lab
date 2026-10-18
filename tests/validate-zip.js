#!/usr/bin/env node
"use strict";
/* Validates the production Acode plugin ZIP structure. Run after `node scripts/build.js`. */
const fs = require("fs"), path = require("path"), cp = require("child_process"), zlib = require("zlib");
const DIST = path.join(__dirname, "..", "dist"), ROOT = path.join(__dirname, ".."), m = JSON.parse(fs.readFileSync(path.join(ROOT, "plugin.json"), "utf8"));
const name = "png-asset-lab-" + m.version + "-acode-plugin.zip", file = path.join(DIST, name); let failed = 0;
const ok = (c, msg) => { console.log((c ? "PASS " : "FAIL ") + msg); if (!c) failed++; };
ok(fs.existsSync(file), "production ZIP exists: " + name); if (!fs.existsSync(file)) process.exit(1);
const z = fs.readFileSync(file), eocd = z.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])), n = z.readUInt16LE(eocd + 10); let p = z.readUInt32LE(eocd + 16); const ents = {};
for (let i = 0; i < n; i++) { const method = z.readUInt16LE(p + 10), csize = z.readUInt32LE(p + 20), nl = z.readUInt16LE(p + 28), el = z.readUInt16LE(p + 30), cl = z.readUInt16LE(p + 32), lho = z.readUInt32LE(p + 42), nm = z.slice(p + 46, p + 46 + nl).toString(); const lnl = z.readUInt16LE(lho + 26), lel = z.readUInt16LE(lho + 28), ds = lho + 30 + lnl + lel, raw = z.slice(ds, ds + csize); ents[nm] = method === 8 ? zlib.inflateRawSync(raw) : raw; p += 46 + nl + el + cl; }
const names = Object.keys(ents);
ok(names[0] === "plugin.json" && ents["plugin.json"], "plugin.json is at the ZIP root");
const pj = JSON.parse(ents["plugin.json"].toString()); ok(pj.id === "com.rafi.png-asset-lab", "id in ZIP manifest");
ok(names.includes(pj.main) && !pj.main.includes("/"), "main entry `" + pj.main + "` is at the ZIP root");
ok(names.includes(pj.icon) && names.includes(pj.readme) && names.includes(pj.changelogs), "icon, readme and changelogs are present");
ok(pj.files.every((f) => names.includes(f)), "every file listed in manifest `files` is in the ZIP (" + pj.files.length + ")");
ok(names.filter((x) => !["plugin.json", "main.js", "icon.png", "readme.md", "changelogs.md", "LICENSE"].includes(x)).every((x) => pj.files.includes(x)), "no unlisted extra files in the ZIP");
ok(!names.some((x) => /\.zip$/i.test(x)), "no nested ZIP");
ok(!names.some((x) => /^(\.git|node_modules|dist|tests|scripts|src)\//.test(x) || /^\.|\/\./.test(x)), "no .git / node_modules / tests / sources / hidden files");
ok(!names.some((x) => x.startsWith("png-asset-lab/")), "no outer project directory");
const main = ents["main.js"].toString(); ok(main.includes("acode.setPluginInit") && main.includes("com.rafi.png-asset-lab"), "main.js registers the plugin id");
ok(!/\bimport\s+.*from\s|\brequire\(["']\.\//.test(main), "main.js has no module imports (plain script)");
ok(ents["icon.png"].length <= 50 * 1024, "icon <= 50 KB");
try { const out = cp.execFileSync("unzip", ["-t", file]).toString(); ok(/No errors detected/.test(out), "unzip -t reports no errors"); } catch (e) { if (e.code === "ENOENT") console.log("SKIP unzip -t (unzip not installed)"); else ok(false, "unzip -t failed"); }
const dev = path.join(DIST, "png-asset-lab-" + m.version + "-dev-project.zip"); ok(fs.existsSync(dev) && dev !== file, "dev project ZIP exists with a distinct name");
console.log((failed ? failed + " FAILED" : "ZIP validation OK") + " | " + name + " | " + (z.length / 1024).toFixed(1) + " KB | " + names.length + " entries"); process.exit(failed ? 1 : 0);
