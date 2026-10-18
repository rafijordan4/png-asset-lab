# Troubleshooting

Turn on **Settings > Developer > Diagnostics mode**, reproduce the problem, then **Copy log**. Every log line carries the stage (`environment`, `storage`, `packs`, `commands`, `build-ui`, `attach-page`, `bind-events`, ...) where it happened. If startup fails, the plugin shows the failing stage and message instead of a generic error.

| Symptom | Likely cause | Fix |
|---|---|---|
| Plugin not offered / "invalid plugin" on install | `plugin.json` not at the ZIP root, or you installed the **dev project** ZIP | Install `png-asset-lab-<version>-acode-plugin.zip` (the one with `plugin.json` at the root). Check with `unzip -l`. |
| Plugin installs but nothing happens | Command palette not used | Open the command palette and run **PNG Asset Lab: Open workspace** (Ctrl-Alt-L with a keyboard). |
| Stage `environment`: "window.acode is not available" | Script loaded outside Acode | Only run inside Acode. |
| Stage `commands`: `commands` unavailable | Acode older than the Commands API | Update Acode. |
| Stage `build-ui`: "Missing element #pal-..." | Template/selector mismatch (a bug) | Run `node tests/run-tests.js`; it checks ids. Report with the log. |
| "2D canvas is not available" | WebView without canvas | Update Android System WebView. |
| Export says "Write finished but ... not found" | Folder not writable via Acode fs | Choose another folder in Settings > Export folder. |
| Imported file "is not a valid PNG" | JPG/WebP renamed to .png, or truncated file | Re-export as real PNG. Only PNG is supported. |
| User packs disappear after restart | `localStorage` unavailable | Settings > Storage shows the status. Export the pack file to keep it. |
| Installing from a URL fails | You used a repository, Actions-artifact or release **page** URL | Use the direct release-asset URL (see readme). |
