import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  CheckCircle2,
  CreditCard,
  FileText,
  LockKeyhole,
  LibraryBig,
  Mail,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const steps = [
  {
    title: "Describe the book you want",
    text: "Choose a genre, add your premise, and tell us the story beats you care about.",
    icon: PenLine,
  },
  {
    title: "Checkout once",
    text: "Pay $29.99 through secure checkout. Promotion codes are supported.",
    icon: CreditCard,
  },
  {
    title: "Receive the novel manuscript",
    text: "After checkout is complete, we prepare your novel manuscript and send it to your inbox.",
    icon: Mail,
  },
];

const examples = [
  "A cozy mystery about an archivist who finds a confession hidden in a town ledger.",
  "A romantic fantasy where rival cartographers map a kingdom that rearranges overnight.",
  "A near-future thriller about a sleep clinic whose dreams begin predicting market crashes.",
  "A historical adventure following sisters who smuggle coded poems across a border.",
];

const assurances = [
  "No subscription",
  "One complete novel manuscript",
  "Secure checkout",
  "Dashboard order tracking",
  "Email delivery",
  "Book ID included for support",
];

const faqs = [
  {
    question: "What do I receive?",
    answer:
      "A complete novel manuscript based on the genre and story summary you submit, delivered by email.",
  },
  {
    question: "When do you start work on my book?",
    answer:
      "We begin after your order is complete. Your novel manuscript is then prepared and emailed in about 45 minutes.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "The expected delivery time is about 45 minutes. Actual timing can vary during unusually busy periods.",
  },
  {
    question: "Is this a subscription?",
    answer:
      "No. Longstory Short Story uses a single $29.99 checkout for each novel manuscript order.",
  },
];

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}/#organization`,
        name: site.legalName,
        alternateName: site.name,
        url: site.url,
        email: site.supportEmail,
        logo: `${site.url}/brand-icon-512.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        name: site.name,
        url: site.url,
        publisher: { "@id": `${site.url}/#organization` },
      },
      {
        "@type": "Service",
        "@id": `${site.url}/#service`,
        name: "Complete novel manuscript service",
        provider: { "@id": `${site.url}/#organization` },
        serviceType: "Novel manuscript writing service",
        description:
          "A service that turns a genre and story idea into a complete novel manuscript delivered by email.",
        areaServed: "US",
        offers: {
          "@type": "Offer",
          price: site.priceCents / 100,
          priceCurrency: site.currency.toUpperCase(),
          availability: "https://schema.org/InStock",
          url: `${site.url}/#pricing`,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${site.url}/#faq`,
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <MarketingShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main>
        <section className="relative isolate min-h-[76svh] overflow-hidden bg-[#07110d] text-white md:min-h-[92svh]">
          <div
            aria-hidden="true"
            className="absolute inset-0 scale-[1.18] bg-cover bg-center md:scale-100"
            style={{ backgroundImage: "url('/home-hero-library.jpg')" }}
          />
          <div className="absolute inset-0 bg-black/30 md:bg-black/20" />
          <div className="absolute inset-0 bg-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(0deg,#f7faf7_0%,rgba(247,250,247,0)_100%)]" />
          <div className="relative z-10 mx-auto flex min-h-[76svh] max-w-7xl items-center justify-center px-4 pb-16 pt-24 text-center sm:px-6 md:min-h-[92svh] md:pb-24 md:pt-28 lg:px-8">
            <div className="mx-auto max-w-5xl md:-translate-y-4">
              <h1 className="text-[2.4rem] font-black uppercase leading-[1.02] text-white drop-shadow-[0_5px_14px_rgba(0,0,0,0.62)] sm:text-6xl lg:text-7xl">
                Turn your idea into a complete novel
              </h1>
              <p className="mx-auto mt-4 max-w-[21rem] text-base leading-7 text-white/90 drop-shadow-[0_3px_10px_rgba(0,0,0,0.62)] sm:mt-5 sm:max-w-3xl sm:text-xl sm:leading-9">
                Share your genre and story idea. Receive a complete fiction
                novel manuscript by email for {site.price}, with no subscription.
              </p>
              <Link
                href="/new-story"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-[#07110d] shadow-lg shadow-black/20 transition hover:bg-[#d9f4e9]"
              >
                Start your novel manuscript
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[#f7faf7] px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
            {[
              {
                title: "Turn your idea into a finished book",
                text: "Move beyond notes and unfinished chapters with a complete novel manuscript shaped around your premise, genre, and creative direction.",
                icon: BookOpen,
              },
              {
                title: "Prepare for your publishing goals",
                text: "Build a complete novel manuscript you can refine for ebook or print platforms and share with the readers you want to reach.",
                icon: BadgeDollarSign,
              },
              {
                title: "Build your author catalog",
                text: "Create more books from the ideas you already have, giving readers more to discover and helping your author brand grow.",
                icon: LibraryBig,
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-[#dbe5df] bg-white p-5 shadow-sm sm:p-6"
              >
                <item.icon aria-hidden="true" className="text-[#007a4d]" />
                <h2 className="mt-5 text-xl font-semibold text-[#101513]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#52615a]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="bg-white px-4 py-12 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold text-[#101513] sm:text-5xl">
                From idea to finished novel.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#52615a] sm:mt-5 sm:text-lg sm:leading-8">
                Share your premise and creative preferences. We develop the
                plot, outline the story, write the complete novel manuscript,
                and proofread it before delivery.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-5 lg:grid-cols-3">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-lg border border-[#dbe5df] bg-[#f7faf7] p-5 sm:p-7"
                >
                  <div className="flex items-center justify-between">
                    <step.icon aria-hidden="true" className="text-[#007a4d]" />
                    <span className="font-mono text-sm text-[#7a8a82]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-[#101513] sm:mt-8 sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 leading-7 text-[#52615a] sm:mt-4">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="examples"
          className="bg-[#07110d] px-4 py-12 text-white sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-semibold sm:text-5xl">
                Bring a premise. Leave with a finished novel.
              </h2>
              <p className="mt-4 text-base leading-7 text-white/70 sm:mt-5 sm:text-lg sm:leading-8">
                Use the summary field to define characters, twists, tone,
                setting, ending preferences, or constraints. The more specific
                the idea, the better the book direction.
              </p>
              <div className="mt-6 grid gap-3 text-sm text-white/72 sm:mt-8 sm:grid-cols-2">
                {assurances.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2
                      aria-hidden="true"
                      size={16}
                      className="shrink-0 text-[#d9b56c]"
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              {examples.map((example) => (
                <article
                  key={example}
                  className="rounded-lg border border-white/12 bg-white/[0.06] p-5"
                >
                  <p className="leading-7 text-white/84">{example}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="bg-[#f7faf7] px-4 py-12 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold text-[#101513] sm:text-5xl">
                One novel manuscript. One price.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#52615a] sm:mt-5 sm:text-lg sm:leading-8">
                One payment covers every stage needed to turn your idea into a
                polished novel manuscript, from story development through
                proofreading.
              </p>
            </div>
            <div className="rounded-lg border border-[#dbe5df] bg-white p-5 shadow-sm sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase text-[#007a4d]">
                    Complete novel manuscript
                  </p>
                  <p className="mt-3 text-5xl font-semibold text-[#101513] sm:mt-4 sm:text-6xl">
                    {site.price}
                  </p>
                  <p className="mt-3 text-[#52615a]">One simple price</p>
                </div>
                <Link
                  href="/new-story"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#007a4d] px-6 py-3.5 font-semibold text-white transition hover:bg-[#004d33] sm:w-auto"
                >
                  Start checkout
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
              </div>
              <div className="mt-8 border-t border-[#dbe5df] pt-6">
                <p className="text-sm font-semibold uppercase text-[#101513]">
                  Included with every order
                </p>
                <div className="mt-4 grid gap-3 text-sm text-[#52615a] sm:grid-cols-2">
                  {[
                    "Plot and character development",
                    "Story structure and detailed outlining",
                    "Complete novel manuscript writing",
                    "Proofreading for clarity and consistency",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-[#007a4d]"
                        size={17}
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm leading-6 text-[#52615a]">
                  One payment covers the full process from your original idea to a
                  polished novel manuscript ready for your next publishing step.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold text-[#101513] sm:text-4xl">
                A practical next step for your story idea.
              </h2>
              <p className="mt-4 leading-7 text-[#52615a]">
                Whether your goal is to publish, build an author catalog, or
                finally finish the story you have been carrying, you leave with
                a complete novel manuscript to take forward.
              </p>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                {
                  title: "A coherent, complete story",
                  text: "Your premise is developed into a structured narrative with characters, pacing, and a satisfying ending.",
                  icon: BookOpen,
                },
                {
                  title: "A novel manuscript for your next step",
                  text: "Receive a full novel manuscript you can review, personalize, and prepare for your preferred publishing path.",
                  icon: FileText,
                },
                {
                  title: "More ideas turned into books",
                  text: "Move promising concepts out of your notes and into a growing catalog of finished creative work.",
                  icon: LibraryBig,
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-lg border border-[#dbe5df] bg-[#f7faf7] p-5 sm:p-6"
                >
                  <item.icon aria-hidden="true" className="text-[#007a4d]" />
                  <h3 className="mt-5 text-xl font-semibold text-[#101513]">{item.title}</h3>
                  <p className="mt-3 leading-7 text-[#52615a]">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7faf7] px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-3xl font-semibold text-[#101513] sm:text-4xl">
                Questions before you start.
              </h2>
              <p className="mt-5 leading-8 text-[#52615a]">
                For account or order help, contact{" "}
                <a
                  href={`mailto:${site.supportEmail}`}
                  className="font-semibold text-[#007a4d]"
                >
                  {site.supportEmail}
                </a>
                .
              </p>
            </div>
            <div className="grid gap-4">
              {faqs.map((faq) => (
                <article
                  key={faq.question}
                  className="rounded-lg border border-[#dbe5df] bg-white p-6"
                >
                  <h3 className="text-lg font-semibold text-[#101513]">
                    {faq.question}
                  </h3>
                  <p className="mt-3 leading-7 text-[#52615a]">{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 border-y border-[#dbe5df] py-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#101513] sm:text-3xl">
                Ready to shape your novel manuscript?
              </h2>
              <p className="mt-3 text-[#52615a]">
                Sign in, submit your story summary, and continue to checkout.
              </p>
            </div>
            <Link
              href="/new-story"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#07110d] px-6 py-3.5 font-semibold text-white transition hover:bg-[#004d33] sm:w-auto"
            >
              Create an order
              <Sparkles aria-hidden="true" size={18} />
            </Link>
          </div>
        </section>

        <section className="bg-[#07110d] px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 text-sm text-white/70 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <LockKeyhole aria-hidden="true" size={18} />
              Secure checkout.
            </div>
            <div className="flex items-center gap-3">
              <FileText aria-hidden="true" size={18} />
              Story details stay attached to your order.
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck aria-hidden="true" size={18} />
              Your dashboard shows your own orders.
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
