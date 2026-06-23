import { MarketingShell } from "@/components/MarketingShell";
import { site } from "@/lib/site";

export default function TermsPage() {
  return (
    <MarketingShell>
      <main>
        <section className="bg-[#07110d] px-4 pb-16 pt-32 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-5xl font-semibold sm:text-6xl">
              Terms of Service
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
              These terms describe the manuscript ordering service and checkout
              expectations.
            </p>
          </div>
        </section>
        <section className="bg-[#f7faf7] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-8 rounded-lg border border-[#dbe5df] bg-white p-8 leading-8 text-[#52615a] shadow-sm">
            <section>
              <h2 className="text-2xl font-semibold text-[#101513]">
                Service
              </h2>
              <p className="mt-3">
                Longstory Short Story creates a complete fiction manuscript from
                the genre and story summary submitted by the customer.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-[#101513]">
                Price and payment
              </h2>
              <p className="mt-3">
                Each manuscript order costs {site.price}. Payment is processed
                through Stripe Checkout before the manuscript workflow begins.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-[#101513]">
                Delivery
              </h2>
              <p className="mt-3">
                The expected delivery message is {site.delivery} by email after
                payment confirmation. Delivery can vary due to third-party
                provider availability.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-[#101513]">
                Support
              </h2>
              <p className="mt-3">
                Questions about an order can be sent to {site.supportEmail}.
              </p>
            </section>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
