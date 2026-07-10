import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Upload } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Novel Writing and Publishing Guides",
  description:
    "Practical guides for developing a story idea, preparing a novel manuscript, and choosing an online publishing path.",
  alternates: { canonical: "/guides" },
};

const guides = [
  {
    href: "/guides/how-to-turn-a-story-idea-into-a-novel",
    title: "How to turn a story idea into a novel",
    text: "Develop a premise into characters, conflict, structure, scenes, and a complete novel manuscript.",
    icon: BookOpen,
  },
  {
    href: "/guides/how-to-publish-a-novel-online",
    title: "How to publish a novel online",
    text: "Understand the practical steps between a finished novel manuscript and ebook or print publication.",
    icon: Upload,
  },
];

export default function GuidesPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-[#07110d] px-4 pb-16 pt-32 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase text-[#d9b56c]">Resources</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold sm:text-6xl">Novel writing and publishing guides</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">Clear, practical reading for moving from a promising idea to a complete novel manuscript and a thoughtful publishing plan.</p>
          </div>
        </section>
        <section className="bg-[#f7faf7] px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2">
            {guides.map((guide) => (
              <article key={guide.href} className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8">
                <guide.icon aria-hidden="true" className="text-[#007a4d]" />
                <h2 className="mt-5 text-2xl font-semibold text-[#101513]">{guide.title}</h2>
                <p className="mt-3 leading-7 text-[#52615a]">{guide.text}</p>
                <Link href={guide.href} className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-[#007a4d] hover:text-[#004d33]">Read guide <ArrowRight aria-hidden="true" size={18} /></Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
