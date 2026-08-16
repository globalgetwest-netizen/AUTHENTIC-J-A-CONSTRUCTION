console.log("CWD:", process.cwd());
import "@/lib/documents/fonts";
import { Font } from "@react-pdf/renderer";
console.log("registered families:", Object.keys(Font.getRegisteredFonts()));
