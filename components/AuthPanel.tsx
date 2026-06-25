"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail } from "lucide-react";
import {
  getSupabaseBrowserClient,
  getSupabaseBrowserConfigError,
} from "@/lib/supabase/client";

type AuthMode = "signIn" | "resetRequest" | "updatePassword";

export function AuthPanel() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const configError = getSupabaseBrowserConfigError();
  const fallbackEmail = process.env.NEXT_PUBLIC_TEST_EMAIL ?? "";
  const [email, setEmail] = useState(fallbackEmail);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [message, setMessage] = useState(
    supabase
      ? "Enter your email and password to sign in."
      : (configError ?? "Supabase browser keys are not configured yet."),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const isRecoveryUrl =
      window.location.hash.includes("type=recovery") ||
      window.location.search.includes("type=recovery") ||
      window.location.search.includes("code=");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("updatePassword");
        setMessage("Choose a new password for your account.");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !isRecoveryUrl) {
        router.replace("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
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

    setIsSubmitting(false);
    setMessage(
      "Login did not work. Check your email and password, or reset your password if you forgot it.",
    );
  }

  async function handleCreateAccount() {
    if (!supabase) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Enter a valid email address before creating an account.");
      return;
    }
    if (password.length < 8) {
      setMessage("Enter a password with at least 8 characters before creating an account.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Creating your account...");

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

    setMode("signIn");
    setMessage("Your account is ready. Sign in with your email and password.");
  }

  async function handlePasswordResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setIsSubmitting(true);
    setMessage("Sending password reset email...");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setIsSubmitting(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password reset email sent. Open the email to choose a new password.");
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    if (newPassword !== confirmPassword) {
      setMessage("The new passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Updating your password...");
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setIsSubmitting(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password changed. Taking you to your dashboard...");
    router.replace("/dashboard");
  }

  function showSignIn() {
    setMode("signIn");
    setMessage("Enter your email and password to sign in.");
  }

  if (mode === "updatePassword") {
    return (
      <div className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8">
        <form onSubmit={handlePasswordUpdate} className="space-y-5">
          <div>
            <label
              htmlFor="new-password"
              className="text-sm font-semibold text-[#101513]"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              className="field mt-2"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={!supabase || isSubmitting}
              required
              minLength={8}
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="text-sm font-semibold text-[#101513]"
            >
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              className="field mt-2"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
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
            <KeyRound aria-hidden="true" size={18} />
            Change password
          </button>
        </form>
        <p className="mt-5 text-sm leading-6 text-[#52615a]">{message}</p>
      </div>
    );
  }

  if (mode === "resetRequest") {
    return (
      <div className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8">
        <form onSubmit={handlePasswordResetRequest} className="space-y-5">
          <div>
            <label
              htmlFor="reset-email"
              className="text-sm font-semibold text-[#101513]"
            >
              Email address
            </label>
            <input
              id="reset-email"
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
            Send reset email
          </button>
        </form>
        <button
          type="button"
          onClick={showSignIn}
          className="mt-4 text-sm font-semibold text-[#007a4d] hover:text-[#004d33]"
        >
          Back to sign in
        </button>
        <p className="mt-5 text-sm leading-6 text-[#52615a]">{message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8">
      <form onSubmit={handleSignIn} className="space-y-5">
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
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() => {
            setMode("resetRequest");
            setMessage("Enter your email to receive a password reset link.");
          }}
          className="text-[#007a4d] hover:text-[#004d33]"
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={handleCreateAccount}
          disabled={!supabase || isSubmitting}
          className="text-[#007a4d] hover:text-[#004d33] disabled:cursor-not-allowed disabled:opacity-55"
        >
          Create account
        </button>
      </div>
      <p className="mt-5 text-sm leading-6 text-[#52615a]">{message}</p>
    </div>
  );
}
