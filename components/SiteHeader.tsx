"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { navItems } from "@/lib/site";
import { Logo } from "./Logo";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 text-base font-semibold text-white lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] transition hover:text-white/82"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="inline-flex rounded-full px-2.5 py-2 text-[11px] font-semibold leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] transition hover:text-white/82 sm:px-4 sm:py-2 sm:text-base sm:leading-normal"
          >
            Log in / Sign up
          </Link>
          <Link
            href="/new-story"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#07110d] shadow-sm transition hover:bg-[#d9f4e9] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            Start
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/new-story"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#07110d] shadow-sm transition hover:bg-[#d9f4e9]"
          >
            Start
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur-sm"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav className="mx-3 rounded-lg border border-white/15 bg-[#07110d]/96 p-3 text-white shadow-xl backdrop-blur-md sm:mx-6 lg:hidden">
          <div className="grid">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center rounded-md px-3 text-base font-semibold hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-1 flex min-h-11 items-center rounded-md border-t border-white/12 px-3 pt-2 text-base font-semibold hover:bg-white/10"
            >
              Log in / Sign up
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
