import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/MarketingShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "How to Publish a Novel Online",
  description:
    "Learn the practical steps for preparing a complete novel manuscript for ebook or print publication, from revision to metadata and launch.",
  alternates: { canonical: "/guides/how-to-publish-a-novel-online" },
};

const sections = [
  { title: "Review and personalize your novel manuscript", body: "Read the complete novel manuscript from beginning to end before preparing files. Strengthen any scenes you want to make more personal, confirm character details, and check that the tone and ending match your goals. A final author review is essential because you are responsible for the version you publish." },
  { title: "Choose ebook, print, or both", body: "Ebooks are delivered as reflowable files that adapt to different screens. Print books need fixed page dimensions, margins, headers, page numbers, and a print-ready cover. Many authors release both formats, but each requires its own quality check." },
  { title: "Prepare the interior and cover", body: "Format chapter openings, scene breaks, front matter, and back matter consistently. Commission or create a cover that remains legible as a small thumbnail and fits the technical specifications of the platform you choose. Do not use images, fonts, or other assets unless you have the necessary rights." },
  { title: "Write accurate book metadata", body: "Your title, subtitle, description, author name, categories, and keywords help readers understand the book. Describe the central conflict and reading experience without making unsupported claims. Choose categories that genuinely match the novel rather than only the largest audience." },
  { title: "Select a publishing platform", body: "Compare distribution reach, file requirements, royalty terms, pricing controls, exclusivity rules, and payment schedules. Platform terms change, so read the current official documentation before uploading. Consider whether you want one retailer, broad distribution, or direct sales." },
  { title: "Order a proof and test the files", body: "Preview every ebook on multiple screen sizes and order a physical proof for print. Look for missing scene breaks, awkward page turns, clipped text, low-resolution cover elements, and metadata errors. Correcting these details before launch protects the reader experience." },
  { title: "Plan a credible launch", body: "Prepare an author page, a clear book description, sample pages, and a way for interested readers to hear about the release. Marketing can improve discoverability, but no launch plan guarantees sales, rankings, reviews, or income. Focus on presenting the book honestly and building reader trust over time." },
];

export default function PublishingGuidePage() {
  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Publish a Novel Online",
    datePublished: "2026-07-10",
    dateModified: "2026-07-10",
    author: { "@type": "Organization", name: site.legalName },
    publisher: { "@type": "Organization", name: site.legalName },
    mainEntityOfPage: `${site.url}/guides/how-to-publish-a-novel-online`,
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }} />
      <main>
        <article>
          <header className="bg-[#07110d] px-4 pb-16 pt-32 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <Link href="/guides" className="text-sm font-semibold text-[#d9b56c] hover:text-white">Publishing guides</Link>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">How to publish a novel online</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">A practical overview of the decisions between a complete novel manuscript and a professional ebook or print release.</p>
            </div>
          </header>
          <div className="bg-[#f7faf7] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="mx-auto max-w-4xl rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-10">
              <p className="text-lg leading-8 text-[#34423c]">Online publishing gives authors several paths to readers, but a finished story is only the first requirement. Careful review, professional presentation, accurate metadata, and platform research all shape the quality of the final release.</p>
              <div className="mt-10 grid gap-9">
                {sections.map((section, index) => (
                  <section key={section.title}>
                    <p className="font-mono text-sm text-[#007a4d]">Step {index + 1}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#101513]">{section.title}</h2>
                    <p className="mt-3 leading-8 text-[#52615a]">{section.body}</p>
                  </section>
                ))}
              </div>
              <p className="mt-10 border-t border-[#dbe5df] pt-8 text-sm leading-7 text-[#52615a]">This guide is general educational information, not legal, tax, or financial advice. Review current platform rules and seek professional advice when your situation requires it.</p>
            </div>
          </div>
        </article>
      </main>
    </MarketingShell>
  );
}
