import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Longstory Short Story for novel manuscript order help, account questions, and delivery support.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-[#07110d] px-4 pb-16 pt-32 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-5xl font-semibold sm:text-6xl">Contact</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
              For order help, account questions, or delivery support, email the
              support team.
            </p>
          </div>
        </section>
        <section className="bg-[#f7faf7] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-lg border border-[#dbe5df] bg-white p-8 shadow-sm">
            <Mail aria-hidden="true" className="text-[#007a4d]" size={34} />
            <h2 className="mt-5 break-all text-base font-semibold text-[#101513] sm:text-3xl">
              <a href={`mailto:${site.supportEmail}`} className="hover:text-[#007a4d]">
                {site.supportEmail}
              </a>
            </h2>
            <p className="mt-4 leading-8 text-[#52615a]">
              If you do not receive your novel manuscript within 24 hours of
              ordering, include your Book ID in the email so our support team can
              locate your request.
            </p>
            <a
              href={`mailto:${site.supportEmail}`}
              className="mt-6 inline-flex rounded-full bg-[#007a4d] px-6 py-3 font-semibold text-white hover:bg-[#004d33]"
            >
              Email support
            </a>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
