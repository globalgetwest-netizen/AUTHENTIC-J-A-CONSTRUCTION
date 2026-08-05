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

## Galleries & future sections

- **`public/company/gallery/`** — drop any additional photos here (projects,
  site work, machinery, events). This folder is committed and served, ready for
  the Featured Projects gallery and photo galleries that ship in later phases.
  Name files meaningfully (e.g. `project-01.jpg`); they'll be surfaced from the
  admin panel once DB-backed media storage lands — nothing here will need to move.
- **Logo** — `public/brand/ajac-logo.jpg` (already in place). To change the logo
  site-wide, overwrite that one file; it renders in the header and footer.

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
