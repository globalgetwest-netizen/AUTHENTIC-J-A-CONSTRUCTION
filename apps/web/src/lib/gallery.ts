import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { COMPANY_IMAGES } from "../config/company";

/**
 * Every image path referenced by an existing homepage section (fleet, pillars,
 * materials, land, architectural designs). These already render in their own
 * slots, so the Featured Projects grid skips them to avoid showing the same
 * photo twice on the page.
 */
const USED_SRCS = new Set(
  [
    COMPANY_IMAGES.hero.src,
    COMPANY_IMAGES.construction.src,
    COMPANY_IMAGES.materials.src,
    COMPANY_IMAGES.equipment.src,
    ...COMPANY_IMAGES.fleet.map((i) => i.src),
    COMPANY_IMAGES.pillars.construction.src,
    COMPANY_IMAGES.pillars.catalog.src,
    COMPANY_IMAGES.pillars.premium.src,
    ...COMPANY_IMAGES.materialsGallery.map((i) => i.src),
    COMPANY_IMAGES.land.src,
    COMPANY_IMAGES.architecturalDesigns.src,
  ].filter((s): s is string => Boolean(s)),
);

/**
 * Returns the image paths (relative to /public) found in
 * `public/company/gallery/` that aren't already used by another homepage
 * section, sorted alphabetically. Dropping a new photo into that folder
 * surfaces it in the Featured Projects grid with no code change.
 */
export async function getGalleryImages(): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), "public", "company", "gallery");
    const entries = await fs.readdir(dir);
    const imageExts = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".avif"]);
    return entries
      .filter((f) => imageExts.has(path.extname(f).toLowerCase()))
      .map((f) => `/company/gallery/${f}`)
      .filter((src) => !USED_SRCS.has(src))
      .sort();
  } catch {
    return [];
  }
}
