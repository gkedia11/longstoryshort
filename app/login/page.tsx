import type { Metadata } from "next";
import Link from "next/link";
import { AuthPanel } from "@/components/AuthPanel";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Log In or Create Account",
  description:
    "Sign in to manage your Longstory Short Story novel manuscript orders.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f7faf7] px-4 py-8 text-[#101513] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Logo compact />
        <Link
          href="/"
          className="rounded-full border border-[#dbe5df] bg-white px-4 py-2 text-sm font-semibold text-[#101513] hover:border-[#007a4d]"
        >
          Home
        </Link>
      </div>
      <section className="mx-auto grid max-w-6xl gap-10 py-16 lg:grid-cols-[1fr_0.86fr] lg:items-center">
        <div>
          <h1 className="text-4xl font-semibold leading-[1.05] sm:text-6xl">
            Log in or create an account.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#52615a]">
            View your Book IDs, continue orders that still need payment, and
            follow each novel manuscript from order to delivery.
          </p>
        </div>
        <AuthPanel />
      </section>
    </main>
  );
}
