import type { Metadata } from "next";
import { MarketingShell } from "@/components/MarketingShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Long Story Short LLC collects, uses, protects, and shares information for Longstory Short Story orders.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Who we are",
    body: `Longstory Short Story is operated by ${site.legalName}. This policy explains how we handle personal information when you visit the website, create an account, place an order, or contact support.`,
  },
  {
    title: "Information we collect",
    body: "We collect the name and email address you provide, account information, Book ID, genre, story summary, creative instructions, order status, payment status, support messages, and basic technical information needed to operate and protect the website. We do not store full payment-card details.",
  },
  {
    title: "How we use information",
    body: "We use information to create and manage your account, save your request, process and reconcile payment, prepare and deliver your novel manuscript, provide support, prevent misuse, maintain service records, and improve the customer experience.",
  },
  {
    title: "Service providers",
    body: "We share only the information reasonably needed with providers that support account access, secure payment, hosting, order processing, manuscript preparation, email delivery, and website security. These providers process information under their own terms and privacy obligations.",
  },
  {
    title: "Cookies and account storage",
    body: "The website uses essential browser storage and authentication cookies to keep you signed in, protect your account, and remember the state of your order. We do not use this essential storage to sell personal information.",
  },
  {
    title: "Retention",
    body: "We retain account and order information for as long as reasonably needed to deliver the service, support customers, prevent fraud, maintain business records, and comply with legal obligations. Retention periods may differ by record type.",
  },
  {
    title: "Security",
    body: "We use reasonable administrative and technical safeguards designed to protect personal information. No online service can guarantee absolute security, so keep your password private and contact us if you believe your account has been compromised.",
  },
  {
    title: "Your choices",
    body: `You may ask to access, correct, or delete personal information associated with your account, subject to legal and operational recordkeeping requirements. Send requests to ${site.supportEmail}.`,
  },
  {
    title: "Children",
    body: "The service is not directed to children under 13, and we do not knowingly collect personal information from children under 13.",
  },
  {
    title: "Policy changes and contact",
    body: `We may update this policy as the service changes. The effective date will identify the latest version. Privacy questions can be sent to ${site.supportEmail}.`,
  },
];

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-[#07110d] px-4 pb-16 pt-32 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-semibold sm:text-6xl">Privacy Policy</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
              How we handle information used to create, manage, and deliver your novel manuscript order.
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
