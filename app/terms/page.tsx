import type { Metadata } from "next";
import { MarketingShell } from "@/components/MarketingShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Review the Longstory Short Story terms for novel manuscript orders, payment, delivery, permitted use, and support.",
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    title: "Service",
    body: `Longstory Short Story is a service of ${site.legalName}. We create a complete novel manuscript from the genre, premise, story summary, and creative preferences a customer submits. Our structured process may use technology-assisted writing and editorial tools, followed by preparation and proofreading for delivery.`,
  },
  {
    title: "Customer submissions",
    body: "You must have the right to submit the names, ideas, text, and other material in your order. Do not submit unlawful, infringing, defamatory, or harmful material. You remain responsible for reviewing the completed novel manuscript before publishing or sharing it.",
  },
  {
    title: "Price and payment",
    body: `Each novel manuscript order costs ${site.price} unless a valid promotion changes the checkout total. Payment is processed through secure checkout before work begins. Because each order is a customized digital product, sales are final and refunds are not available except where required by law.`,
  },
  {
    title: "Delivery",
    body: `Our target delivery time is ${site.delivery} after payment confirmation, but timing can vary. If your novel manuscript has not arrived within 24 hours, email ${site.supportEmail} and include the Book ID shown with your order. You are responsible for providing a working email address and checking spam or filtered folders.`,
  },
  {
    title: "Use of the completed work",
    body: "You may edit, publish, and commercially use the novel manuscript delivered for your order, subject to applicable law and any third-party rights. We do not promise that a novel manuscript will qualify for copyright registration in a particular jurisdiction or meet the rules of any publisher, retailer, or platform.",
  },
  {
    title: "No outcome guarantees",
    body: "Creative and commercial results vary. We do not guarantee publication acceptance, sales, rankings, reviews, bestseller status, income, or any other business result. References to publishing opportunities describe possible next steps, not promised outcomes.",
  },
  {
    title: "Service availability",
    body: "We may update, pause, or discontinue parts of the service when reasonably necessary. We are not responsible for delays caused by events or providers outside our reasonable control, but we will use the Book ID and order details to investigate delivery issues.",
  },
  {
    title: "Limitation of liability",
    body: "To the fullest extent allowed by law, the service is provided without warranties beyond those expressly stated here. Long Story Short LLC will not be liable for indirect, incidental, special, or consequential losses arising from use of the service. Any direct liability is limited to the amount paid for the affected order.",
  },
  {
    title: "Contact",
    body: `Questions about these terms or an order can be sent to ${site.supportEmail}.`,
  },
];

export default function TermsPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-[#07110d] px-4 pb-16 pt-32 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-semibold sm:text-6xl">Terms of Service</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
              The terms that apply when you order a novel manuscript from Longstory Short Story.
            </p>
            <p className="mt-4 text-sm text-white/55">Effective July 10, 2026</p>
          </div>
        </section>
        <section className="bg-[#f7faf7] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-8 rounded-lg border border-[#dbe5df] bg-white p-6 leading-8 text-[#52615a] shadow-sm sm:p-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-semibold text-[#101513]">{section.title}</h2>
                <p className="mt-3">{section.body}</p>
              </section>
            ))}
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
