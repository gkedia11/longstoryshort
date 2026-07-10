import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "How to Turn a Story Idea Into a Novel",
  description:
    "A practical step-by-step guide to developing a premise into characters, conflict, an outline, scenes, and a complete novel manuscript.",
  alternates: { canonical: "/guides/how-to-turn-a-story-idea-into-a-novel" },
};

const sections = [
  { title: "1. Write the premise in one sentence", body: "A useful premise identifies the main character, the goal, the central obstacle, and the stakes. Instead of starting with a broad topic such as 'a story about betrayal,' write a sentence that shows who acts and what can be lost. This becomes the test for every later plot decision." },
  { title: "2. Give the main character a difficult choice", body: "A novel needs more than events. Give the protagonist a strong desire, a reason the desire matters now, and a conflict that forces meaningful choices. The best conflicts challenge both the character's external goal and an internal belief, fear, or flaw." },
  { title: "3. Decide what changes", body: "Clarify the difference between the opening and the ending. What has changed in the world, the relationships, and the protagonist? Knowing the intended transformation helps you choose scenes that build toward a clear emotional and narrative result." },
  { title: "4. Build a sequence of turning points", body: "Map the inciting incident, the first major commitment, a midpoint reversal, the lowest point, the climax, and the resolution. These turning points do not need to make the story formulaic. They give the novel manuscript enough structure to maintain momentum while leaving room for discovery." },
  { title: "5. Turn the outline into purposeful scenes", body: "Each scene should change something. A character gains information, loses leverage, makes a decision, deepens a relationship, or creates a new problem. When consecutive scenes have clear causes and consequences, the story feels intentional instead of episodic." },
  { title: "6. Keep tone and point of view consistent", body: "Choose who tells the story, how close the reader is to that character, and what emotional atmosphere the prose should create. A warm romantic voice, a restrained historical voice, and a tense thriller voice use different sentence rhythms and details even when the underlying scene is similar." },
  { title: "7. Finish before perfecting", body: "A complete novel manuscript gives you something concrete to evaluate. Once the full story exists, you can strengthen pacing, sharpen character motivation, remove repetition, and improve the prose with the ending in view. Perfection at chapter one is less useful than coherence across the whole book." },
];

export default function StoryIdeaGuidePage() {
  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Turn a Story Idea Into a Novel",
    datePublished: "2026-07-10",
    dateModified: "2026-07-10",
    author: { "@type": "Organization", name: site.legalName },
    publisher: { "@type": "Organization", name: site.legalName },
    mainEntityOfPage: `${site.url}/guides/how-to-turn-a-story-idea-into-a-novel`,
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }} />
      <main>
        <article>
          <header className="bg-[#07110d] px-4 pb-16 pt-32 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <Link href="/guides" className="text-sm font-semibold text-[#d9b56c] hover:text-white">Novel writing guides</Link>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">How to turn a story idea into a novel</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">A strong premise becomes a complete book through deliberate character, conflict, structure, scenes, and revision.</p>
            </div>
          </header>
          <div className="bg-[#f7faf7] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="mx-auto max-w-4xl rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-10">
              <p className="text-lg leading-8 text-[#34423c]">Most novel ideas begin as an image, a character, a question, or a situation. The work is not finding more ideas. It is making a series of choices that gives one idea enough shape to sustain a complete novel manuscript.</p>
              <div className="mt-10 grid gap-9">
                {sections.map((section) => (
                  <section key={section.title}>
                    <h2 className="text-2xl font-semibold text-[#101513]">{section.title}</h2>
                    <p className="mt-3 leading-8 text-[#52615a]">{section.body}</p>
                  </section>
                ))}
              </div>
              <div className="mt-10 border-t border-[#dbe5df] pt-8">
                <h2 className="text-2xl font-semibold text-[#101513]">Ready to move from premise to manuscript?</h2>
                <p className="mt-3 leading-7 text-[#52615a]">Share your genre, story idea, characters, tone, and ending preferences. Longstory Short Story develops the plot, outline, complete novel manuscript, and proofreading for one simple price.</p>
                <Link href="/new-story" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#007a4d] px-6 py-3 font-semibold text-white hover:bg-[#004d33]">Start your novel manuscript <ArrowRight aria-hidden="true" size={18} /></Link>
              </div>
            </div>
          </div>
        </article>
      </main>
    </MarketingShell>
  );
}
