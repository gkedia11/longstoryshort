import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="bg-[#07110d] text-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[1.25fr_0.75fr_0.75fr] lg:px-8">
        <div className="space-y-3">
          <Logo compact />
          <p className="max-w-sm text-sm leading-6 text-white/68">
            Complete novel manuscripts from a focused story idea, delivered by
            email without a subscription.
          </p>
          <p className="text-xs leading-5 text-white/52">
            A service of {site.legalName}.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Service</h2>
          <div className="mt-3 grid gap-2 text-sm text-white/68">
            <Link href="/#pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/how-it-works" className="hover:text-white">
              How it works
            </Link>
            <Link href="/samples" className="hover:text-white">
              Samples
            </Link>
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
            <Link href="/new-story" className="hover:text-white">
              New story
            </Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Company</h2>
          <div className="mt-3 grid gap-2 text-sm text-white/68">
            <Link href="/about" className="hover:text-white">
              About
            </Link>
            <Link href="/guides" className="hover:text-white">
              Guides
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-xs text-white/52 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <a href={`mailto:${site.supportEmail}`} className="break-all hover:text-white">
            {site.supportEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}
