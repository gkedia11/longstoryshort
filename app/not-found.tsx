import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-[#07110d] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Logo compact />
        <p className="mt-14 text-sm font-semibold uppercase text-[#d9b56c]">Page not found</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight sm:text-7xl">This page is not part of the story.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">The address may have changed, or the page may no longer exist. Return home or begin a new novel manuscript order.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#07110d] hover:bg-[#d9f4e9]"><Home aria-hidden="true" size={18} /> Home</Link>
          <Link href="/new-story" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 font-semibold hover:bg-white/10">Start a novel manuscript <ArrowRight aria-hidden="true" size={18} /></Link>
        </div>
      </div>
    </main>
  );
}
