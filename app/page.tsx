import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  LockKeyhole,
  Mail,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { site } from "@/lib/site";

const steps = [
  {
    title: "Describe the book you want",
    text: "Choose a genre, add your premise, and tell us the story beats you care about.",
    icon: PenLine,
  },
  {
    title: "Checkout once",
    text: "Pay $29.99 through Stripe Checkout. Promotion codes are supported.",
    icon: CreditCard,
  },
  {
    title: "Receive the manuscript",
    text: "After payment clears, the manuscript workflow starts and delivery goes to your inbox.",
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
  "One complete fiction manuscript",
  "Stripe-secured checkout",
  "Dashboard order tracking",
  "Server-side workflow trigger",
  "Email delivery",
];

const faqs = [
  {
    question: "What do I receive?",
    answer:
      "A complete fiction manuscript based on the genre and story summary you submit. The finished draft is delivered by email.",
  },
  {
    question: "When does generation start?",
    answer:
      "Only after Stripe confirms payment through the webhook. Your story summary is saved first so the order can be recovered.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "The service message is about 45 minutes. Actual timing can vary if the workflow provider is under heavy load.",
  },
  {
    question: "Is this a subscription?",
    answer:
      "No. Longstory Short Story uses a single $29.99 checkout for each manuscript order.",
  },
];

export default function Home() {
  return (
    <MarketingShell>
      <main>
        <section className="relative min-h-[86svh] overflow-hidden bg-[#07110d] text-white">
          <Image
            src="/hero-manuscript.png"
            alt=""
            aria-hidden="true"
            fill
            unoptimized
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,13,0.96)_0%,rgba(7,17,13,0.78)_42%,rgba(7,17,13,0.28)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(0deg,#f7faf7_0%,rgba(247,250,247,0)_100%)]" />
          <div className="relative mx-auto flex min-h-[86svh] max-w-7xl items-center px-4 pb-24 pt-28 sm:px-6 lg:px-8">
            <div className="max-w-3xl motion-safe-rise">
              <h1 className="text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
                Longstory Short Story
              </h1>
              <p className="mt-7 max-w-2xl text-xl leading-8 text-white/82 sm:text-2xl sm:leading-9">
                Give us a genre and a story idea. Get a complete fiction
                manuscript emailed in {site.delivery} for {site.price}, with no
                subscription.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/new-story"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-semibold text-[#07110d] shadow-lg shadow-black/20 transition hover:bg-[#d9f4e9]"
                >
                  Start your manuscript
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
                <Link
                  href="/#how-it-works"
                  className="inline-flex items-center justify-center rounded-full border border-white/28 px-6 py-3.5 text-base font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
                >
                  See how it works
                </Link>
              </div>
              <dl className="mt-10 grid max-w-2xl gap-5 text-sm text-white/72 sm:grid-cols-3">
                <div>
                  <dt className="text-2xl font-semibold text-white">
                    {site.price}
                  </dt>
                  <dd className="mt-1">one-time payment</dd>
                </div>
                <div>
                  <dt className="text-2xl font-semibold text-white">45 min</dt>
                  <dd className="mt-1">target email delivery</dd>
                </div>
                <div>
                  <dt className="text-2xl font-semibold text-white">1</dt>
                  <dd className="mt-1">complete manuscript</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="bg-[#f7faf7] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
            {[
              {
                title: "Built for serious drafts",
                text: "Prompts ask for premise, genre, and direction before the workflow starts.",
                icon: BookOpen,
              },
              {
                title: "Payment-gated workflow",
                text: "The manuscript workflow only fires after Stripe confirms a completed checkout.",
                icon: ShieldCheck,
              },
              {
                title: "Recoverable orders",
                text: "Story summaries are saved before payment so dashboard status stays visible.",
                icon: Clock,
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm"
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
          className="bg-white px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-semibold text-[#101513] sm:text-5xl">
                From idea to inbox.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#52615a]">
                The flow is intentionally simple: capture the story, collect
                payment, trigger the manuscript workflow, and keep order status
                visible in the dashboard.
              </p>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-lg border border-[#dbe5df] bg-[#f7faf7] p-7"
                >
                  <div className="flex items-center justify-between">
                    <step.icon aria-hidden="true" className="text-[#007a4d]" />
                    <span className="font-mono text-sm text-[#7a8a82]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-8 text-2xl font-semibold text-[#101513]">
                    {step.title}
                  </h3>
                  <p className="mt-4 leading-7 text-[#52615a]">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="examples"
          className="bg-[#07110d] px-4 py-20 text-white sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div>
              <h2 className="text-4xl font-semibold sm:text-5xl">
                Bring a premise. Leave with a draft.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/70">
                Use the summary field to define characters, twists, tone,
                setting, ending preferences, or constraints. The more specific
                the idea, the better the manuscript direction.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-white/72">
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
          className="bg-[#f7faf7] px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-4xl font-semibold text-[#101513] sm:text-5xl">
                One manuscript. One price.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#52615a]">
                Longstory Short Story is built for a clean transaction:
                describe the book, pay once, and receive the manuscript by
                email.
              </p>
            </div>
            <div className="rounded-lg border border-[#dbe5df] bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase text-[#007a4d]">
                    Complete manuscript
                  </p>
                  <p className="mt-4 text-6xl font-semibold text-[#101513]">
                    {site.price}
                  </p>
                  <p className="mt-3 text-[#52615a]">No tiers. No renewal.</p>
                </div>
                <Link
                  href="/new-story"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#007a4d] px-6 py-3.5 font-semibold text-white transition hover:bg-[#004d33]"
                >
                  Start checkout
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
              </div>
              <div className="mt-8 grid gap-3 border-t border-[#dbe5df] pt-6 text-sm text-[#52615a] sm:grid-cols-2">
                <p>Stripe Checkout with promotion-code support.</p>
                <p>Order status remains visible in your dashboard.</p>
                <p>Workflow trigger stays server-side after payment.</p>
                <p>Support at {site.supportEmail}.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  quote:
                    "The order flow is clear enough for first-time authors and strict enough for paid delivery.",
                  name: "Beta reader",
                },
                {
                  quote:
                    "The premise-first prompt makes the output feel directed instead of generic.",
                  name: "Genre reviewer",
                },
                {
                  quote:
                    "A simple way to turn a stalled story idea into something substantial.",
                  name: "Draft customer",
                },
              ].map((testimonial) => (
                <figure
                  key={testimonial.name}
                  className="rounded-lg border border-[#dbe5df] bg-[#f7faf7] p-6"
                >
                  <blockquote className="leading-7 text-[#34423c]">
                    “{testimonial.quote}”
                  </blockquote>
                  <figcaption className="mt-5 text-sm font-semibold text-[#007a4d]">
                    {testimonial.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7faf7] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-4xl font-semibold text-[#101513]">
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

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 border-y border-[#dbe5df] py-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-[#101513]">
                Ready to shape your manuscript?
              </h2>
              <p className="mt-3 text-[#52615a]">
                Sign in, submit your story summary, and continue to checkout.
              </p>
            </div>
            <Link
              href="/new-story"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07110d] px-6 py-3.5 font-semibold text-white transition hover:bg-[#004d33]"
            >
              Create an order
              <Sparkles aria-hidden="true" size={18} />
            </Link>
          </div>
        </section>

        <section className="bg-[#07110d] px-4 py-10 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 text-sm text-white/70 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <LockKeyhole aria-hidden="true" size={18} />
              Secret keys stay server-side.
            </div>
            <div className="flex items-center gap-3">
              <FileText aria-hidden="true" size={18} />
              Story orders are stored before payment.
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck aria-hidden="true" size={18} />
              RLS keeps users scoped to their own orders.
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
