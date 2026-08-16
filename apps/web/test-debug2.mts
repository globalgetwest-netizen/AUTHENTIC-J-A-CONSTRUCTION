import { Font } from "@react-pdf/renderer";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const buf = readFileSync(join(process.cwd(), "public", "fonts", "eb-garamond-400.ttf"));
console.log("font bytes:", buf.length);
Font.register({ family: "EB Garamond", fonts: [{ src: `data:font/ttf;base64,${buf.toString("base64")}`, fontWeight: 400 }] });
console.log("after inline register:", Object.keys(Font.getRegisteredFonts()));
