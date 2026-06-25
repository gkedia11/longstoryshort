import Link from "next/link";
import { CheckCircle2, LayoutDashboard } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { PaymentSuccessStatus } from "@/components/PaymentSuccessStatus";
import { site } from "@/lib/site";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#f7faf7]">
      <AppNav />
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <CheckCircle2
          aria-hidden="true"
          className="mx-auto text-[#007a4d]"
          size={54}
        />
        <h1 className="mt-6 text-4xl font-semibold text-[#101513] sm:text-5xl">
          Payment received.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#52615a]">
          Thank you for your purchase. Your complete manuscript will be emailed
          in {site.delivery}. If you have any questions, please write to{" "}
          <a
            href={`mailto:${site.supportEmail}`}
            className="font-semibold text-[#007a4d]"
          >
            {site.supportEmail}
          </a>
          .
        </p>
        {params.order_id ? (
          <p className="mt-5 font-mono text-sm text-[#6f7d76]">
            Order {params.order_id}
          </p>
        ) : null}
        <PaymentSuccessStatus orderId={params.order_id} />
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#007a4d] px-6 py-3.5 font-semibold text-white transition hover:bg-[#004d33]"
        >
          <LayoutDashboard aria-hidden="true" size={18} />
          View dashboard
        </Link>
      </section>
    </main>
  );
}
