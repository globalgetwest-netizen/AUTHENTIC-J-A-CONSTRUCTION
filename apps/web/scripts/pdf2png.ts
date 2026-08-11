import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createCanvas, type Canvas } from "@napi-rs/canvas";
import { createRequire } from "node:module";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = pathToFileURL(
  require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs"),
).href;

async function pageToPng(pdfPath: string, outPath: string, scale = 1.6) {
  const data = new Uint8Array(await fs.readFile(pdfPath));
  const doc = await getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    canvasFactory: {
      create(width: number, height: number) {
        return createCanvas(width, height);
      },
      reset(canvas: Canvas, width: number, height: number) {
        canvas.width = width;
        canvas.height = height;
        return canvas;
      },
      destroy(canvas: Canvas) {
        (canvas as { dispose?: () => void }).dispose?.();
      },
    },
  } as unknown as Parameters<typeof getDocument>[0]).promise;
  const page = await doc.getPage(1);
  const base = await page.getViewport({ scale });
  const canvas = createCanvas(base.width, base.height);
  const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
  await page.render(
    { canvasContext: ctx, viewport: base } as unknown as Parameters<typeof page.render>[0],
  ).promise;
  const out = canvas.toBuffer("image/png");
  await fs.writeFile(outPath, out);
  console.log("wrote", path.basename(outPath), `(${base.width}x${base.height})`);
  await doc.cleanup();
}

const INPUT = process.argv[2];
const OUTPUT = process.argv[3];
pageToPng(INPUT, OUTPUT).catch((e) => { console.error(e); process.exit(1); });