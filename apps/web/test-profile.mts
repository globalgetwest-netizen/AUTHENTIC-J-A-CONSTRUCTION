import { readFileSync } from "node:fs";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";

const { Font } = await import("@react-pdf/renderer");
const ttf = (n: string) => `data:font/ttf;base64,${readFileSync(join(process.cwd(), "public", "fonts", n)).toString("base64")}`;
Font.register({ family: "Playfair Display", fonts: [
  { src: ttf("playfair-display-600.ttf"), fontWeight: 600 },
  { src: ttf("playfair-display-700.ttf"), fontWeight: 700 },
]});
Font.register({ family: "EB Garamond", fonts: [
  { src: ttf("eb-garamond-400.ttf"), fontWeight: 400 },
  { src: ttf("eb-garamond-500.ttf"), fontWeight: 500 },
  { src: ttf("eb-garamond-600.ttf"), fontWeight: 600 },
  { src: ttf("eb-garamond-700.ttf"), fontWeight: 700 },
  { src: ttf("eb-garamond-italic.ttf"), fontWeight: 400, fontStyle: "italic" },
]});
Font.register({ family: "Inter", fonts: [
  { src: ttf("inter-400.ttf"), fontWeight: 400 },
  { src: ttf("inter-500.ttf"), fontWeight: 500 },
  { src: ttf("inter-600.ttf"), fontWeight: 600 },
  { src: ttf("inter-700.ttf"), fontWeight: 700 },
]});
Font.register({ family: "EB Garamond Bold", fonts: [{ src: ttf("eb-garamond-700.ttf") }] });
Font.register({ family: "EB Garamond Italic", fonts: [{ src: ttf("eb-garamond-italic.ttf") }] });

const { renderCompanyProfilePdf } = await import("@/lib/documents/pdf");
const pdf = await renderCompanyProfilePdf({
  projects: [
    { code: "P001", name: "Kenyase Estate Road Works", projectType: "CONSTRUCTION", status: "COMPLETED", client: "Private Client" },
    { code: "P002", name: "Adum Commercial Block", projectType: "CONSTRUCTION", status: "ONGOING", client: "Sekyedomase Rural Bank" },
  ],
  equipment: [
    { assetCode: "E001", name: "Excavator CAT 320", category: "HEAVY", status: "ACTIVE" },
    { assetCode: "E002", name: "Concrete Mixer", category: "PLANT", status: "ACTIVE" },
  ],
  includeStamp: true,
  includeSignature: true,
});
const out = join(homedir(), "company-profile-test.pdf");
writeFileSync(out, pdf);
console.log("PDF OK bytes=" + pdf.length + " -> " + out);
