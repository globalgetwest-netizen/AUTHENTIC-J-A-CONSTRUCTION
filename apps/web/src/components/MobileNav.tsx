"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./icons";

interface MobileNavProps {
  links: { href: string; label: string }[];
  actions: { href: string; label: string }[];
}

export function MobileNav({ links, actions }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100"
      >
        <Icon name={open ? "close" : "menu"} className="h-6 w-6" />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-neutral-200 bg-surface shadow-lg">
          <nav aria-label="Mobile" className="px-4 py-4">
            <ul className="flex flex-col">
              {links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-neutral-100 py-3 text-sm font-medium text-neutral-800 hover:text-brand-blue"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              {actions.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-brand-blue px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
