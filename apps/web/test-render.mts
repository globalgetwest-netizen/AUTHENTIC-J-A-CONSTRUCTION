import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

async function run() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { createCanvas } = await import("@napi-rs/canvas");
  const data = await readFile(join(homedir(), "company-profile-test.pdf"));
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data), useSystemFonts: false, disableFontFace: true }).promise;
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
    const png = canvas.toBuffer("image/png");
    const out = join(homedir(), `company-profile-p${i}.png`);
    writeFileSync(out, png);
    console.log(`page ${i}: ${png.length} bytes -> ${out}`);
  }
}
run();
