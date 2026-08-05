# Company imagery — asset manifest

The homepage renders real photography through the `COMPANY_IMAGES` map in
`apps/web/src/config/company.ts`. Each slot takes a path under this folder
(`public/company/…`). While a slot's `src` is `null`, the section renders a
clean branded panel instead of a broken image or a placeholder.

## Required photographs

Drop the real company photos in here, then set the matching `src` in
`config/company.ts`. Keep files reasonably optimised (WebP/JPEG, ≤ ~500KB each).

| Slot           | Path example                       | Subject                                                        |
| -------------- | ---------------------------------- | -------------------------------------------------------------- |
| `hero`         | `/company/hero-site.jpg`           | Engineers/workers in PPE, tower cranes, concrete works, completed buildings |
| `construction` | `/company/construction.jpg`        | Building construction, reinforcement, formwork, concreting, site supervision |
| `materials`    | `/company/materials.jpg`           | Factory-made blocks, sand, quarry stones, cement, block production |
| `equipment`    | `/company/equipment.jpg`           | Excavators, wheel loaders, C.A.T. equipment, tipper trucks, rollers, cranes |

## Guidance

- **Authenticity**: use the company's own photographs of its sites, machinery,
  block factory and completed projects. Never use unrelated stock or borrowed
  photos — this is a real enterprise's public face.
- **Aspect**: the blocks use `object-cover`, so either fill the frame or supply a
  crop you are happy with.
- **More slots later**: when the Featured Projects gallery ships, a `projects`
  entry will be added here and each project card will take its own image.
- **Optimisation**: resize and compress before committing; the site has no image
  CDN yet (Phase 23 deployment).
