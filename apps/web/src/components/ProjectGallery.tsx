'use client';

import { useCallback, useEffect, useState } from 'react';
import { PhotoBlock } from './PhotoBlock';
import { Icon } from './icons';

interface GalleryProps {
  /** Image paths (relative to public) to display in the grid. */
  images: string[];
}

/**
 * Responsive photo gallery that shows every image dropped into the
 * `public/company/gallery/` folder. Clicking a tile opens a lightbox for
 * closer inspection; the grid is populated from a server-provided file list,
 * so new photos appear on the homepage with no code change.
 */
export function ProjectGallery({ images }: GalleryProps) {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const go = useCallback(
    (dir: 1 | -1) => setActive((cur) => (cur === null ? cur : (cur + dir + images.length) % images.length)),
    [images.length],
  );

  // Keyboard navigation + scroll lock while the lightbox is open.
  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, close, go]);

  return (
    <>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Open photo ${i + 1}`}
            className="overflow-hidden rounded-lg p-0 text-left ring-1 ring-black/5 transition hover:ring-2 hover:ring-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <PhotoBlock
              image={{ src, alt: `AUTHENTIC J.A. project photo ${i + 1}` }}
              className="aspect-[4/3] min-h-0"
            />
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${active + 1} of ${images.length}`}
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <Icon name="close" className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
          >
            <Icon name="chevron-left" className="h-7 w-7" />
          </button>

          <figure
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] max-w-5xl flex-col items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[active]}
              alt={`AUTHENTIC J.A. project photo ${active + 1}`}
              className="max-h-[82vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
            />
            <figcaption className="mt-3 text-sm font-medium text-white/80">
              {active + 1} / {images.length}
            </figcaption>
          </figure>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
          >
            <Icon name="chevron-right" className="h-7 w-7" />
          </button>
        </div>
      )}
    </>
  );
}
