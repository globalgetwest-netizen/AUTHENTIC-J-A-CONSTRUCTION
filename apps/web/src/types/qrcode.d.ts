/**
 * Ambient types for the `qrcode` package (runtime dep already present).
 * Declared locally so typecheck is independent of the optional `@types/qrcode`
 * stub being physically installed in node_modules.
 */
declare module "qrcode" {
  export interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    width?: number;
    color?: { dark?: string; light?: string };
  }
  export function toDataURL(
    text: string,
    options?: QRCodeToDataURLOptions,
  ): Promise<string>;
}