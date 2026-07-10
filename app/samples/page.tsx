import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Novel Writing Samples",
  description:
    "Read original illustrative excerpts showing the range of tone and style available for mystery, romance, and thriller novel manuscripts.",
  alternates: { canonical: "/samples" },
};

const samples = [
  {
    genre: "Mystery",
    title: "The Bellwether Ledger",
    excerpt: "Mara had catalogued every confession in Bellwether except the one written in her father's hand. It waited between tax rolls from 1978, folded twice and sealed with the blue wax he had used on her childhood birthday cards. Outside the archive, the courthouse clock struck six. Inside, dust turned slowly through the desk lamp's narrow light. She read the first line, then locked the records room door. By morning, three people would be searching for the letter. One of them had already killed to keep it hidden.",
  },
  {
    genre: "Romantic fantasy",
    title: "Maps of the Moving Kingdom",
    excerpt: "At midnight, the river abandoned its bed and curled around the palace like a silver ribbon. Ilyan watched from the eastern tower, ink drying on a map that had become a lie before he finished it. Across the chamber, Sera laughed without looking up. She was the only cartographer he could not outdraw and the last person he wished to trust. Yet the king had chained their commissions together: map the kingdom before dawn, or share the sentence for failure. Somewhere below, a bridge unfolded toward a city that had not existed yesterday.",
  },
  {
    genre: "Thriller",
    title: "The Sleep Index",
    excerpt: "The first patient dreamed the market would fall at 9:47. At 9:46, Dr. Lena Vale watched every screen in the clinic turn red. By noon, the recording had vanished from the secure server and the patient was missing from a locked room. Lena told herself it was coincidence until a second sleeper whispered tomorrow's closing price and the name of the man who would die to protect it. She had spent ten years teaching people not to fear their dreams. Now someone was trading on them.",
  },
];

export default function SamplesPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-[#07110d] px-4 pb-16 pt-32 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase text-[#d9b56c]">Illustrative excerpts</p>
            <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">Novel writing samples</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">These original excerpts demonstrate possible voice, pacing, atmosphere, and genre range. They are not customer work or testimonials.</p>
          </div>
        </section>
        <section className="bg-[#f7faf7] px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-6">
            {samples.map((sample) => (
              <article key={sample.title} className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-semibold uppercase text-[#007a4d]">{sample.genre}</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#101513] sm:text-3xl">{sample.title}</h2>
                <p className="mt-5 text-lg leading-9 text-[#34423c]">{sample.excerpt}</p>
              </article>
            ))}
            <div className="pt-4">
              <Link href="/new-story" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#007a4d] px-6 py-3 font-semibold text-white hover:bg-[#004d33]">Start your novel manuscript <ArrowRight aria-hidden="true" size={18} /></Link>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
