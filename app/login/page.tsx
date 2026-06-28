import Link from "next/link";
import { AuthPanel } from "@/components/AuthPanel";
import { Logo } from "@/components/Logo";

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
          <h1 className="text-5xl font-semibold leading-[1.05] sm:text-6xl">
            Sign in to manage your manuscripts.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#52615a]">
            Use your email and password to access submitted orders, checkout
            state, payment status, and manuscript progress.
          </p>
        </div>
        <AuthPanel />
      </section>
    </main>
  );
}
