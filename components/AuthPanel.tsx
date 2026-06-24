"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
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
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    supabase
      ? "Enter your email and password to sign in."
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
    setMessage("Signing you in...");

    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInResult.error) {
      setIsSubmitting(false);
      setMessage("Signed in. Taking you to your dashboard...");
      router.replace("/dashboard");
      return;
    }

    const signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setIsSubmitting(false);
    if (signUpResult.error) {
      setMessage(signUpResult.error.message);
      return;
    }

    setMessage(
      "Account created. Sign in again with the same email and password if needed.",
    );
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
        <div>
          <label
            htmlFor="password"
            className="text-sm font-semibold text-[#101513]"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="field mt-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={!supabase || isSubmitting}
            required
            minLength={8}
          />
        </div>
        <button
          type="submit"
          disabled={!supabase || isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#007a4d] px-5 py-3 font-semibold text-white transition hover:bg-[#004d33] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Mail aria-hidden="true" size={18} />
          Sign in
        </button>
      </form>
      <p className="mt-5 text-sm leading-6 text-[#52615a]">{message}</p>
    </div>
  );
}
