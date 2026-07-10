import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CreditCard, Mail, NotebookPen } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "How Our Novel Manuscript Service Works",
  description:
    "See how to submit a story idea, complete secure payment, and receive a complete novel manuscript by email.",
  alternates: { canonical: "/how-it-works" },
};

const steps = [
  { title: "Describe your novel", text: "Choose a genre and share the premise, main characters, setting, tone, plot points, and ending preferences that matter to you.", icon: NotebookPen },
  { title: "Keep your Book ID", text: "Your form includes a unique Book ID. Keep it with your records so support can locate the request quickly if delivery needs attention.", icon: BookOpenCheck },
  { title: "Complete secure payment", text: `Pay ${site.price} once for plot development, outlining, complete novel manuscript writing, and proofreading.`, icon: CreditCard },
  { title: "Receive your novel manuscript", text: `We send the completed work to the email address on your order. Our target delivery time is ${site.delivery}.`, icon: Mail },
];

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-[#07110d] px-4 pb-16 pt-32 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase text-[#d9b56c]">How it works</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight sm:text-6xl">A clear path from story idea to complete novel manuscript.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">You provide the creative direction. The service handles the development, structure, writing, and proofreading needed to complete the book.</p>
          </div>
        </section>
        <section className="bg-[#f7faf7] px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-5 sm:grid-cols-2">
              {steps.map((step, index) => (
                <article key={step.title} className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <step.icon aria-hidden="true" className="text-[#007a4d]" />
                    <span className="font-mono text-sm text-[#7a8a82]">0{index + 1}</span>
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold text-[#101513]">{step.title}</h2>
                  <p className="mt-3 leading-7 text-[#52615a]">{step.text}</p>
                </article>
              ))}
            </div>
            <div className="mt-10 rounded-lg bg-[#07110d] p-6 text-white sm:p-8">
              <h2 className="text-2xl font-semibold">What helps us follow your vision?</h2>
              <p className="mt-3 max-w-3xl leading-7 text-white/72">Specific details produce stronger direction. Include character motivations, major conflicts, the emotional tone, themes to explore, scenes you want included, and any content you want avoided.</p>
              <Link href="/new-story" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#07110d] hover:bg-[#d9f4e9]">Describe your story <ArrowRight aria-hidden="true" size={18} /></Link>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
