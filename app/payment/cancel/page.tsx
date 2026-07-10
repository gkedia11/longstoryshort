import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";
import { AppNav } from "@/components/AppNav";

export const metadata: Metadata = {
  title: "Checkout Canceled",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PaymentCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#f7faf7]">
      <AppNav />
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <CreditCard
          aria-hidden="true"
          className="mx-auto text-[#007a4d]"
          size={54}
        />
        <h1 className="mt-6 text-4xl font-semibold text-[#101513] sm:text-5xl">
          Checkout was canceled.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#52615a]">
          Your story order remains saved as pending payment. You can return to
          your dashboard and continue payment when you are ready.
        </p>
        {params.order_id ? (
          <p className="mt-5 font-mono text-sm text-[#6f7d76]">
            Book ID {params.order_id}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#007a4d] px-6 py-3.5 font-semibold text-white transition hover:bg-[#004d33]"
          >
            Return to dashboard
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[#dbe5df] bg-white px-6 py-3.5 font-semibold text-[#101513] transition hover:border-[#007a4d]"
          >
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
