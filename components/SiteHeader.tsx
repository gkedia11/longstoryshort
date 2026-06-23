import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { navItems } from "@/lib/site";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-white/78 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-white/86 hover:text-white sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/new-story"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#07110d] shadow-sm transition hover:bg-[#d9f4e9]"
          >
            Start
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}
