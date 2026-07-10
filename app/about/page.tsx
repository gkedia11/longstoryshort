import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ListTree, PenLine, SearchCheck } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Our Novel Manuscript Service",
  description:
    "Learn how Long Story Short LLC helps turn focused story ideas into complete novel manuscripts through development, writing, and proofreading.",
  alternates: { canonical: "/about" },
};

const stages = [
  { title: "Story development", text: "We expand the premise into characters, conflict, stakes, and a complete plot.", icon: BookOpen },
  { title: "Detailed outlining", text: "The story is organized into a chapter-by-chapter path before the full writing begins.", icon: ListTree },
  { title: "Manuscript writing", text: "Your direction guides the genre, voice, tone, setting, and ending of the novel manuscript.", icon: PenLine },
  { title: "Proofreading", text: "The completed work is checked for clarity, continuity, and consistency before delivery.", icon: SearchCheck },
];

export default function AboutPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Longstory Short Story",
    url: `${site.url}/about`,
    about: { "@type": "Organization", name: site.legalName, alternateName: site.name },
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <main>
        <section className="bg-[#07110d] px-4 pb-16 pt-32 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase text-[#d9b56c]">About us</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight sm:text-6xl">
              Helping good story ideas become complete novels.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              Longstory Short Story is operated by {site.legalName}. We built the service for people who have a premise worth pursuing but need a structured path to a finished novel manuscript.
            </p>
          </div>
        </section>

        <section className="bg-white px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold text-[#101513] sm:text-4xl">Creative direction stays with you.</h2>
              <p className="mt-5 text-lg leading-8 text-[#52615a]">
                You choose the premise, genre, characters, tone, setting, and important story details. Our process develops that direction into a complete book rather than leaving you with disconnected scenes or a short outline.
              </p>
              <p className="mt-4 leading-8 text-[#52615a]">
                We use a structured, technology-assisted writing process together with editorial preparation and proofreading. The tools support the work; your submitted direction remains the foundation of the novel manuscript you receive.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {stages.map((stage) => (
                <article key={stage.title} className="rounded-lg border border-[#dbe5df] bg-[#f7faf7] p-6">
                  <stage.icon aria-hidden="true" className="text-[#007a4d]" />
                  <h3 className="mt-4 text-xl font-semibold text-[#101513]">{stage.title}</h3>
                  <p className="mt-2 leading-7 text-[#52615a]">{stage.text}</p>
                </article>
              ))}
            </div>
            <div className="mt-10 border-t border-[#dbe5df] pt-8">
              <Link href="/new-story" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#007a4d] px-6 py-3 font-semibold text-white hover:bg-[#004d33]">
                Start your novel manuscript <ArrowRight aria-hidden="true" size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
