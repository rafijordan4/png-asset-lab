#!/usr/bin/env node
"use strict";
/* Real-browser smoke test: loads the BUILT main.js in headless Chromium with a MOCK Acode runtime.
   This is NOT a test inside real Acode. Skipped automatically when Playwright/Chromium is unavailable. */
const fs = require("fs"), path = require("path");
let pw; try { pw = require("playwright"); } catch (e) { try { pw = require(path.join(process.env.NODE_PATH || "/home/claude/.npm-global/lib/node_modules", "playwright")); } catch (e2) { console.log("SKIP ui-smoke: playwright not installed"); process.exit(0); } }
const bundle = fs.readFileSync(path.join(__dirname, "..", "dist", "plugin", "main.js"), "utf8");
let failed = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) failed++; };
(async () => {
  let browser; try { browser = await pw.chromium.launch(); } catch (e) { console.log("SKIP ui-smoke: no Chromium (" + e.message.split("\n")[0] + ")"); process.exit(0); }
  const page = await browser.newPage({ viewport: { width: 390, height: 780 } }); const errors = []; page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.setContent("<!doctype html><html><head></head><body></body></html>");
  await page.evaluate(() => {
    window.__fs = {}; window.__cmds = {}; window.__init = null; window.__unmount = null;
    const pageEl = document.createElement("div"); pageEl.show = function () { document.body.appendChild(pageEl); }; pageEl.hide = function () { pageEl.remove(); }; window.__page = pageEl;
    const mods = {
      commands: { addCommand: (d) => { window.__cmds[d.name] = d; }, removeCommand: (n) => { delete window.__cmds[n]; } },
      fileBrowser: async (mode) => ({ url: "file:///export", name: "export", type: "folder" }),
      fsOperation: (url) => ({
        createFile: async (name, data) => { window.__fs[url + "/" + name] = new Uint8Array(data.byteLength !== undefined ? data : []); return url + "/" + name; },
        exists: async () => url in window.__fs || Object.keys(window.__fs).indexOf(url) >= 0, writeFile: async () => {}, readFile: async () => new ArrayBuffer(0)
      }),
      url: { join: (a, b) => a.replace(/\/+$/, "") + "/" + b }
    };
    window.acode = { require: (n) => { if (!mods[n]) throw new Error("no module " + n); return mods[n]; }, setPluginInit: (id, fn) => { window.__init = fn; }, setPluginUnmount: (id, fn) => { window.__unmount = fn; }, alert: () => {} };
  });
  await page.addScriptTag({ content: bundle });
  const reg = await page.evaluate(async () => { await window.__init("file:///plugin", window.__page, {}); return Object.keys(window.__cmds); });
  ok(reg.length === 3, "init registers 3 commands: " + reg.join(", "));
  await page.evaluate(async () => { await window.__init("file:///plugin", window.__page, {}); });
  ok((await page.evaluate(() => Object.keys(window.__cmds).length)) === 3, "re-init does not duplicate commands");
  await page.evaluate(() => window.__cmds["png-asset-lab.open"].exec());
  ok(await page.locator(".pal-root").count() === 1, "workspace opens");
  ok(await page.locator("#pal-empty").isVisible(), "empty state visible");
  await page.click("#pal-empty-sample"); await page.waitForTimeout(500);
  ok((await page.textContent("#pal-grid-status")).includes("12 sprites of 32 x 32"), "sample sheet loads with 12 sprites");
  ok((await page.textContent("#pal-info")).includes("192 x 64"), "info shows dimensions");
  await page.click('[data-tab="sprites"]'); await page.fill("#pal-cols", "3"); await page.waitForTimeout(300);
  ok((await page.textContent("#pal-grid-status")).includes("6 sprites of 64 x 32"), "changing columns recalculates grid");
  await page.fill("#pal-rows", "100"); await page.waitForTimeout(300);
  ok((await page.getAttribute("#pal-grid-status", "class")).includes("err"), "invalid grid shows error");
  await page.fill("#pal-cols", "6"); await page.fill("#pal-rows", "2"); await page.waitForTimeout(300);
  await page.waitForSelector(".pal-thumb"); await page.locator(".pal-thumb").nth(2).click();
  ok((await page.textContent("#pal-sprite-info")).includes("x 64"), "selecting sprite shows coordinates");
  await page.click("#pal-btn-export-sprite"); await page.waitForTimeout(500);
  ok((await page.evaluate(() => Object.keys(window.__fs))).some((k) => /sample-slime-sheet_03\.png$/.test(k)), "export selected writes sample-slime-sheet_03.png via mock fs");
  await page.click("#pal-btn-export-zip"); await page.waitForTimeout(1500);
  const zipKey = (await page.evaluate(() => Object.keys(window.__fs))).find((k) => k.endsWith(".zip")); ok(!!zipKey, "export all writes a ZIP");
  if (zipKey) { const bytes = await page.evaluate((k) => Array.from(window.__fs[k]), zipKey); fs.writeFileSync("/tmp/ui-export.zip", Buffer.from(bytes)); }
  await page.click('[data-tab="animation"]'); await page.click("#pal-btn-seq-row"); await page.click("#pal-btn-play"); await page.waitForTimeout(600);
  ok((await page.textContent("#pal-frame-label")).startsWith("Frame"), "animation plays and shows frame counter");
  await page.click("#pal-btn-play");
  await page.click('[data-tab="code"]'); const css = await page.inputValue("#pal-css-out"), json = await page.inputValue("#pal-json-out");
  ok(/@keyframes sprite-play/.test(css) && /background-position: -32px 0/.test(css), "CSS contains keyframes and real coordinates");
  let parsed = null; try { parsed = JSON.parse(json); } catch (e) { /* */ } ok(parsed && parsed.sprites.length === 12 && parsed.animation && parsed.animation.frames.length === 6, "JSON valid with 12 sprites and animation");
  await page.click('[data-tab="packs"]'); ok((await page.locator(".pal-pack").count()) === 9, "9 packs listed (8 bundled + custom)");
  await page.locator(".pal-pack").first().locator("button").click(); ok(await page.locator(".pal-asset").count() >= 1, "pack view lists assets");
  await page.locator(".pal-asset").first().click(); await page.click("text=Open in workspace"); await page.waitForTimeout(400);
  ok((await page.textContent("#pal-info")).includes("32 x 32"), "pack asset opens in workspace");
  await page.setViewportSize({ width: 800, height: 390 }); await page.waitForTimeout(300); ok(await page.locator("#pal-canvas").isVisible(), "landscape layout keeps viewer visible");
  await page.evaluate(() => window.__unmount()); ok((await page.locator(".pal-root").count()) === 0 && (await page.evaluate(() => Object.keys(window.__cmds).length)) === 0, "unmount removes UI, style and commands");
  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close(); console.log(failed ? failed + " FAILED" : "ui-smoke OK"); process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
