import * as fonts from "@/lib/documents/fonts";
console.log("fonts module key count:", Object.keys(fonts).length);
import { Font } from "@react-pdf/renderer";
console.log("registered families:", Font.getRegisteredFonts ? Font.getRegisteredFonts() : "n/a");
