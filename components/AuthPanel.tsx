"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import {
  getSupabaseBrowserClient,
  getSupabaseBrowserConfigError,
} from "@/lib/supabase/client";

export function AuthPanel() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const configError = getSupabaseBrowserConfigError();
  const fallbackEmail = process.env.NEXT_PUBLIC_TEST_EMAIL ?? "";
  const [email, setEmail] = useState(fallbackEmail);
  const [message, setMessage] = useState(
    supabase
      ? "Enter your email to receive a secure sign-in link."
      : (configError ?? "Supabase browser keys are not configured yet."),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
      }
    });
  }, [router, supabase]);

  async function handleEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setIsSubmitting(true);
    setMessage("Sending secure sign-in link...");

    const redirectTo = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setIsSubmitting(false);
    setMessage(
      error
        ? error.message
        : "Check your email for the sign-in link, then return to your dashboard.",
    );
  }

  async function handleGoogle() {
    if (!supabase) return;
    setMessage("Opening Google sign-in...");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <div className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8">
      <form onSubmit={handleEmail} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="text-sm font-semibold text-[#101513]"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="field mt-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={!supabase || isSubmitting}
            required
          />
        </div>
        <button
          type="submit"
          disabled={!supabase || isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#007a4d] px-5 py-3 font-semibold text-white transition hover:bg-[#004d33] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Mail aria-hidden="true" size={18} />
          Send sign-in link
        </button>
      </form>
      <div className="my-6 h-px bg-[#dbe5df]" />
      <button
        type="button"
        onClick={handleGoogle}
        disabled={!supabase}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#dbe5df] bg-white px-5 py-3 font-semibold text-[#101513] transition hover:border-[#007a4d] disabled:cursor-not-allowed disabled:opacity-55"
      >
        Continue with Google
        <ArrowRight aria-hidden="true" size={18} />
      </button>
      <p className="mt-5 text-sm leading-6 text-[#52615a]">{message}</p>
    </div>
  );
}
