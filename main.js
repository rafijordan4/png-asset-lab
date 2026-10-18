
const PLUGIN_ID = "com.rafi.png-asset-lab";
const COMMAND_ID = "png-asset-lab.open";

class PNGAssetLab {
  constructor() {
    this.page = null;
    this.commands = null;
    this.image = null;
    this.imageName = "spritesheet";
    this.sprites = [];
    this.objectURL = null;
  }

  async init(_baseUrl, page) {
    this.page = page;
    this.commands = acode.require("commands");

    this.commands.addCommand({
      name: COMMAND_ID,
      description: "Open PNG Asset Lab",
      exec: () => {
        this.render();
        this.page.show();
      }
    });

    this.render();
  }

  render() {
    const p = this.page;

    p.innerHTML = `
      <div id="pal">
        <style>
          #pal {
            padding: 14px;
            color: var(--primary-text-color, #f5f5f5);
            background: var(--secondary-color, #171923);
            font-family: system-ui, sans-serif;
            min-height: 100%;
          }
          #pal * { box-sizing: border-box; }
          #pal h2 { margin: 0 0 5px; }
          #pal .muted { opacity: .7; font-size: 12px; }
          #pal .panel {
            margin: 14px 0;
            padding: 12px;
            border: 1px solid #414657;
            border-radius: 12px;
          }
          #pal .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 12px 0;
          }
          #pal button, #pal input {
            max-width: 100%;
            padding: 9px;
            border-radius: 8px;
          }
          #pal button {
            border: 0;
            background: #536dfe;
            color: white;
          }
          #pal input {
            background: #202432;
            color: white;
            border: 1px solid #51586b;
          }
          #pal label {
            display: inline-flex;
            flex-direction: column;
            gap: 5px;
            margin: 5px;
          }
          #pal .checker {
            overflow: auto;
            padding: 8px;
            background-color: #242936;
            background-image:
              linear-gradient(45deg,#363c49 25%,transparent 25%),
              linear-gradient(-45deg,#363c49 25%,transparent 25%),
              linear-gradient(45deg,transparent 75%,#363c49 75%),
              linear-gradient(-45deg,transparent 75%,#363c49 75%);
            background-size: 20px 20px;
            background-position:
              0 0, 0 10px, 10px -10px, -10px 0;
          }
          #pal #pal-preview {
            display: block;
            max-width: 100%;
            height: auto;
          }
          #pal .sprite-grid {
            display: grid;
            grid-template-columns: repeat(3,minmax(0,1fr));
            gap: 8px;
          }
          #pal .sprite {
            min-width: 0;
            padding: 6px;
            border: 1px solid #414657;
            border-radius: 8px;
            overflow: hidden;
          }
          #pal .sprite canvas {
            display: block;
            width: 100%;
            height: auto;
            image-rendering: pixelated;
          }
          #pal pre {
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            font-size: 11px;
          }
        </style>

        <h2>PNG Asset Lab</h2>
        <div class="muted">Sprite tools for Acode</div>

        <div class="panel">
          <b>1. Image source</b>
          <div class="actions">
            <button id="pal-pick">Open image</button>
            <button id="pal-export-sheet">Export sheet PNG</button>
          </div>
          <input id="pal-file" type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden>
          <div id="pal-info" class="muted">
            No image selected
          </div>
          <div class="checker" style="margin-top:10px">
            <canvas id="pal-preview"></canvas>
          </div>
        </div>

        <div class="panel">
          <b>2. Sprite sheet cutter</b>
          <p class="muted">
            Potong gambar berdasarkan ukuran grid.
          </p>
          <label>Cell width (px)
            <input id="pal-width" type="number"
              min="1" max="4096" value="32">
          </label>
          <label>Cell height (px)
            <input id="pal-height" type="number"
              min="1" max="4096" value="32">
          </label>
          <div class="actions">
            <button id="pal-cut">Cut sprites</button>
            <button id="pal-export-all">Export all sprites</button>
          </div>
          <div id="pal-count" class="muted">0 sprites</div>
          <div id="pal-sprites" class="sprite-grid"></div>
        </div>

        <div class="panel">
          <b>3. CSS generator</b>
          <p class="muted">
            Menghasilkan posisi sprite untuk background-image CSS.
          </p>
          <div class="actions">
            <button id="pal-generate-css">Generate CSS</button>
            <button id="pal-copy-css">Copy CSS</button>
            <button id="pal-download-css">Download CSS</button>
          </div>
          <pre id="pal-css-output">Belum ada CSS.</pre>
        </div>
        <div class="muted">
          PNG Asset Lab · Local image processing
        </div>
      </div>
    `;

    const root = p.querySelector("#pal");
    const $ = id => root.querySelector("#pal-" + id);
    const preview = $("preview");
    const ctx = preview.getContext("2d");

    const downloadBlob = (blob, name) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.style.display = "none";
      root.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    };

    const downloadCanvas = (canvas, name) => {
      canvas.toBlob(blob => {
        if (blob) downloadBlob(blob, name);
        else alert("Gagal mengekspor PNG.");
      }, "image/png");
    };

    $("pick").onclick = () => $("file").click();

    $("file").onchange = event => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 25 * 1024 * 1024) {
        alert("File terlalu besar. Maksimum 25 MB.");
        event.target.value = "";
        return;
      }

      if (this.objectURL) URL.revokeObjectURL(this.objectURL);

      const url = URL.createObjectURL(file);
      this.objectURL = url;

      const img = new Image();

      img.onload = () => {
        if (url !== this.objectURL) return;

        if (img.naturalWidth > 8192 ||
            img.naturalHeight > 8192) {
          alert("Dimensi gambar maksimum 8192 × 8192.");
          URL.revokeObjectURL(url);
          this.objectURL = null;
          return;
        }

        this.image = img;
        this.imageName = file.name.replace(/\.[^.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_") || "spritesheet";

        preview.width = img.naturalWidth;
        preview.height = img.naturalHeight;
        ctx.clearRect(0, 0, preview.width, preview.height);
        ctx.drawImage(img, 0, 0);

        $("info").textContent =
          `${file.name} · ${img.naturalWidth} × ${img.naturalHeight}`;

        this.sprites = [];
        $("sprites").replaceChildren();
        $("count").textContent = "0 sprites";
        $("css-output").textContent = "Belum ada CSS.";
      };

      img.onerror = () => {
        alert("Gambar tidak bisa dibuka.");
        if (this.objectURL === url) this.objectURL = null;
        URL.revokeObjectURL(url);
      };

      img.src = url;
    };

    $("cut").onclick = () => {
      if (!this.image) {
        alert("Pilih gambar terlebih dahulu.");
        return;
      }

      const w = Number($("width").value);
      const h = Number($("height").value);

      if (!Number.isInteger(w) || !Number.isInteger(h) ||
          w < 1 || h < 1) {
        alert("Ukuran cell harus bilangan bulat positif.");
        return;
      }

      const cols = Math.floor(preview.width / w);
      const rows = Math.floor(preview.height / h);
      const total = cols * rows;

      if (total < 1 || total > 300) {
        alert("Jumlah sprite harus antara 1 dan 300.");
        return;
      }

      const result = [];
      const fragment = document.createDocumentFragment();

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;

          c.getContext("2d").drawImage(
            preview,
            x * w, y * h, w, h,
            0, 0, w, h
          );

          const index = result.length + 1;
          result.push({ canvas: c, x: x * w, y: y * h });

          const card = document.createElement("div");
          card.className = "sprite";

          const label = document.createElement("p");
          label.className = "muted";
          label.textContent = `Sprite ${index}`;

          const button = document.createElement("button");
          button.textContent = "Export PNG";
          button.onclick = () =>
            downloadCanvas(c, `${this.imageName}-${index}.png`);

          card.append(c, label, button);
          fragment.appendChild(card);
        }
      }

      this.sprites = result;
      $("sprites").replaceChildren(fragment);
      $("count").textContent =
        `${total} sprites · ${cols} columns × ${rows} rows`;
      $("css-output").textContent = "Tekan Generate CSS.";
    };

    $("export-sheet").onclick = () => {
      if (!this.image) return alert("Pilih gambar terlebih dahulu.");
      downloadCanvas(preview, `${this.imageName}.png`);
    };

    $("export-all").onclick = async () => {
      if (!this.sprites.length) {
        alert("Potong sprite terlebih dahulu.");
        return;
      }

      if (this.sprites.length > 30 &&
          !confirm(`Ekspor ${this.sprites.length} file PNG?`)) return;

      for (let i = 0; i < this.sprites.length; i++) {
        await new Promise(resolve => {
          const c = this.sprites[i].canvas;
          c.toBlob(blob => {
            if (blob) downloadBlob(
              blob, `${this.imageName}-${i + 1}.png`
            );
            resolve();
          }, "image/png");
        });
      }
    };

    $("generate-css").onclick = () => {
      if (!this.sprites.length) {
        alert("Potong sprite terlebih dahulu.");
        return;
      }

      const w = Number($("width").value);
      const h = Number($("height").value);

      const lines = [
        "/* PNG Asset Lab generated CSS */",
        ".sprite {",
        `  width: ${w}px;`,
        `  height: ${h}px;`,
        `  background-image: url("${this.imageName}.png");`,
        "  background-repeat: no-repeat;",
        "  image-rendering: pixelated;",
        "}"
      ];

      this.sprites.forEach((s, i) => {
        lines.push(
          `.sprite-${i + 1} {`,
          `  background-position: -${s.x}px -${s.y}px;`,
          "}"
        );
      });

      $("css-output").textContent = lines.join("\n");
    };

    $("copy-css").onclick = async () => {
      const text = $("css-output").textContent;
      if (!text || text === "Belum ada CSS." ||
          text === "Tekan Generate CSS.") {
        alert("Generate CSS terlebih dahulu.");
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        alert("CSS disalin.");
      } catch {
        alert("Clipboard tidak tersedia. Gunakan Download CSS.");
      }
    };

    $("download-css").onclick = () => {
      const text = $("css-output").textContent;
      if (!text || text === "Belum ada CSS." ||
          text === "Tekan Generate CSS.") {
        alert("Generate CSS terlebih dahulu.");
        return;
      }

      downloadBlob(
        new Blob([text], { type: "text/css;charset=utf-8" }),
        `${this.imageName}.css`
      );
    };
  }

  destroy() {
    if (this.commands) {
      this.commands.removeCommand(COMMAND_ID);
    }

    if (this.objectURL) {
      URL.revokeObjectURL(this.objectURL);
      this.objectURL = null;
    }

    if (this.page) this.page.innerHTML = "";
    this.image = null;
    this.sprites = [];
  }
}

if (window.acode) {
  const plugin = new PNGAssetLab();

  acode.setPluginInit(PLUGIN_ID, async (baseUrl, page) => {
    await plugin.init(baseUrl, page);
  });

  acode.setPluginUnmount(PLUGIN_ID, () => plugin.destroy());
}
