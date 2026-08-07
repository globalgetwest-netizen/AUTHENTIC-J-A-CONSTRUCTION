# Company imagery — asset manifest

This is the drop-in location for all real company photography. **Drop a photo at
the exact filename below and the homepage picks it up — no code changes.**

`COMPANY_IMAGES` in `apps/web/src/config/company.ts` is pre-wired to these paths.
While a file is missing, the section renders a clean branded panel (PhotoBlock
falls back automatically) instead of a broken image or a placeholder.

## Required photographs (fixed filenames)

| Slot           | File to drop in `public/company/`      | Subject                                                        |
| -------------- | -------------------------------------- | -------------------------------------------------------------- |
| `hero`         | `hero-site.jpg`                        | Engineers/workers in PPE, tower cranes, concrete works, completed buildings |
| `construction` | `construction.jpg`                     | Building construction, reinforcement, formwork, concreting, site supervision |
| `materials`    | `materials.jpg`                        | Factory-made blocks, sand, quarry stones, cement, block production |
| `equipment`    | `equipment.jpg`                        | Excavators, wheel loaders, C.A.T. equipment, tipper trucks, rollers, cranes |

Keep filenames exactly as listed (same names, same case). Any common image
format works (JPG/WebP/PNG); JPG/WebP preferred.

## Wired gallery slots (already on the homepage)

These drop into `public/company/gallery/` and render on the page — same
drop-in rule as above. Drop a photo and it appears; remove it and the
section shows a clean branded panel.

| Slot                  | File to drop in `public/company/gallery/` | Homepage section           |
| -------------------- | ----------------------------------------- | ------------------------- |
| Fleet (tipper trucks)  | `tipper-trucks.jpg`                    | "On site" gallery          |
| Fleet (wheel loader)   | `wheel-loader.jpg`                    | "On site" gallery          |
| Pillars — process shot | `pillars-construction.jpg`            | Ready-Made Pillars (large) |
| Pillars — standard     | `pillars-catalog.jpg`                  | Ready-Made Pillars (left)  |
| Pillars — premium      | `pillars-premium.jpg`                  | Ready-Made Pillars (right) |
| Quarry stones & chips  | `quarry-stones.jpg`                    | Materials gallery          |
| Foundation sand        | `foundation-sand.jpg`                  | Materials gallery          |
| Cement & binders       | `cement-binders.jpg`                   | Materials gallery          |
| Gravel                 | `gravel.jpg`                           | Materials gallery          |
| Quarry dust            | `quarry-dust.jpg`                      | Materials gallery          |
| Factory-made blocks    | `factory-blocks.jpg`                   | Materials gallery          |
| Land plots             | `land-plot.jpg`                        | Real Estate — Land          |
| Architectural designs  | `architectural-design.jpg`            | Architectural Designs      |

The `gallery/` folder also holds `production.jpg` and `construction-crew.jpg`
for future use — neither is wired to a homepage slot yet, so they will not
appear until a gallery or projects section that references them ships.

Project photography (schools, markets, banks, buildings) is planned for the
Featured Projects section — more photos will arrive as their own slots.

## Galleries & future sections

- **`public/company/gallery/`** — drop any additional photos here (projects,
  site work, machinery, events). This folder is committed and served, ready for
  the Featured Projects gallery and photo galleries that ship in later phases.
  Name files meaningfully (e.g. `project-01.jpg`); they'll be surfaced from the
  admin panel once DB-backed media storage lands — nothing here will need to move.
- **Logo** — `public/brand/aja-logo.png` (already in place). To change the logo
  site-wide, overwrite that one file; it renders in the header, footer and
  CompanySignboard (config-driven via `COMPANY_LOGO` in `company.ts`).

## Guidance

- **Authenticity**: use the company's own photographs of its sites, machinery,
  block factory and completed projects. Never use unrelated stock or borrowed
  photos — this is a real enterprise's public face.
- **Aspect**: the blocks use `object-cover`, so either fill the frame or supply
  a crop you are happy with.
- **Optimisation**: resize and compress before committing (≤ ~500KB each); the
  site has no image CDN yet (Phase 23 deployment).

## Later: admin-uploaded media (no git, no code)

From the admin portal phase onward, photos will be uploaded through the admin
dashboard and served from storage (R2/S3/local), with image URLs kept in the
database. That flow needs **no code changes and no git** — and the folder
contract described above remains the local/static fallback, so nothing breaks
when that lands.
