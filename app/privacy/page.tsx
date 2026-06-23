import { MarketingShell } from "@/components/MarketingShell";
import { site } from "@/lib/site";

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-[#07110d] px-4 pb-16 pt-32 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-5xl font-semibold sm:text-6xl">
              Privacy Policy
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
              This policy explains what the service collects to create and
              deliver manuscript orders.
            </p>
          </div>
        </section>
        <section className="bg-[#f7faf7] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-8 rounded-lg border border-[#dbe5df] bg-white p-8 leading-8 text-[#52615a] shadow-sm">
            <section>
              <h2 className="text-2xl font-semibold text-[#101513]">
                Information collected
              </h2>
              <p className="mt-3">
                We collect account email, name, selected genre, story summary,
                Stripe checkout identifiers, payment status, and workflow
                status needed to fulfill manuscript orders.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-[#101513]">
                How information is used
              </h2>
              <p className="mt-3">
                Order details are used to save your request, process payment,
                trigger the manuscript workflow after payment confirmation, and
                email the completed manuscript.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-[#101513]">
                Payment and workflow providers
              </h2>
              <p className="mt-3">
                Payments are processed by Stripe. After successful payment, the
                manuscript payload is sent server-side to the configured
                workflow endpoint.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-[#101513]">
                Contact
              </h2>
              <p className="mt-3">
                Privacy questions can be sent to {site.supportEmail}.
              </p>
            </section>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
