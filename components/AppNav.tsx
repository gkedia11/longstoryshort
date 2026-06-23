"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, PenLine } from "lucide-react";
import { Logo } from "./Logo";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new-story", label: "New story", icon: PenLine },
];

export function AppNav() {
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();

  async function signOut() {
    await supabase?.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="border-b border-[#dbe5df] bg-[#07110d] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Logo compact />
        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-white text-[#07110d]"
                    : "bg-white/8 text-white/76 hover:bg-white/14 hover:text-white",
                ].join(" ")}
              >
                <link.icon aria-hidden="true" size={16} />
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-white/76 transition hover:bg-white/14 hover:text-white"
          >
            <LogOut aria-hidden="true" size={16} />
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
