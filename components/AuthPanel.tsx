"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, Mail, UserPlus } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "signIn" | "signUp" | "resetRequest" | "updatePassword";

const unavailableMessage =
  "Account access is temporarily unavailable. Please try again later.";

export function AuthPanel() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [message, setMessage] = useState(
    supabase ? "Enter your email and password to sign in." : unavailableMessage,
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
      if (data.session && !isRecoveryUrl) router.replace("/dashboard");
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  function setAuthMode(nextMode: "signIn" | "signUp") {
    setMode(nextMode);
    setMessage(
      nextMode === "signIn"
        ? "Enter your email and password to sign in."
        : "Create an account to place and track novel manuscript orders.",
    );
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setIsSubmitting(true);
    setMessage("Signing you in...");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (error) {
      setMessage(
        "Login did not work. Check your email and password, or reset your password if you forgot it.",
      );
      return;
    }

    setMessage("Signed in. Taking you to your dashboard...");
    router.replace("/dashboard");
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Creating your account...");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName.trim() },
      },
    });
    setIsSubmitting(false);

    if (error) {
      setMessage(
        "We could not create the account. Check your details or try signing in if you already have an account.",
      );
      return;
    }

    if (data.session) {
      setMessage("Account created. Taking you to your dashboard...");
      router.replace("/dashboard");
      return;
    }

    setMessage("Check your email to confirm your account, then sign in.");
  }

  async function handleGoogleSignIn() {
    if (!supabase) return;
    setIsSubmitting(true);
    setMessage("Opening Google sign-in...");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setIsSubmitting(false);
      setMessage("Google sign-in could not be started. Please try again.");
    }
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
    setMessage(
      error
        ? "We could not send the reset email. Check the address and try again."
        : "Password reset email sent. Open it to choose a new password.",
    );
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
      setMessage("We could not change your password. Please try the reset link again.");
      return;
    }

    setMessage("Password changed. Taking you to your dashboard...");
    router.replace("/dashboard");
  }

  const status = (
    <p role="status" aria-live="polite" className="mt-5 text-sm leading-6 text-[#52615a]">
      {message}
    </p>
  );

  if (mode === "updatePassword") {
    return (
      <div className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8">
        <form onSubmit={handlePasswordUpdate} className="space-y-5">
          <PasswordField
            id="new-password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            disabled={!supabase || isSubmitting}
          />
          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            disabled={!supabase || isSubmitting}
          />
          <SubmitButton disabled={!supabase || isSubmitting} icon={KeyRound}>
            Change password
          </SubmitButton>
        </form>
        {status}
      </div>
    );
  }

  if (mode === "resetRequest") {
    return (
      <div className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8">
        <form onSubmit={handlePasswordResetRequest} className="space-y-5">
          <EmailField email={email} setEmail={setEmail} disabled={!supabase || isSubmitting} id="reset-email" />
          <SubmitButton disabled={!supabase || isSubmitting} icon={Mail}>
            Send reset email
          </SubmitButton>
        </form>
        <button
          type="button"
          onClick={() => setAuthMode("signIn")}
          className="mt-4 min-h-11 text-sm font-semibold text-[#007a4d] hover:text-[#004d33]"
        >
          Back to sign in
        </button>
        {status}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8">
      <div className="grid grid-cols-2 rounded-md bg-[#eef4f0] p-1" aria-label="Account access">
        {(["signIn", "signUp"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setAuthMode(item)}
            className={`min-h-11 rounded px-3 text-sm font-semibold transition ${
              mode === item ? "bg-white text-[#101513] shadow-sm" : "text-[#52615a]"
            }`}
          >
            {item === "signIn" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={!supabase || isSubmitting}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-[#dbe5df] bg-white px-5 py-3 font-semibold text-[#101513] transition hover:border-[#007a4d] hover:bg-[#f7faf7] disabled:cursor-not-allowed disabled:opacity-55"
      >
        <span
          aria-hidden="true"
          className="inline-flex size-6 items-center justify-center rounded-full border border-[#dbe5df] text-sm font-bold text-[#1a73e8]"
        >
          G
        </span>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase text-[#7a8a82]">
        <span className="h-px flex-1 bg-[#dbe5df]" />
        <span>or use email and password</span>
        <span className="h-px flex-1 bg-[#dbe5df]" />
      </div>

      <form onSubmit={mode === "signUp" ? handleSignUp : handleSignIn} className="space-y-5">
        {mode === "signUp" ? (
          <div>
            <label htmlFor="full-name" className="text-sm font-semibold text-[#101513]">Name</label>
            <input
              id="full-name"
              autoComplete="name"
              className="field mt-2"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={!supabase || isSubmitting}
              required
              minLength={2}
            />
          </div>
        ) : null}
        <EmailField email={email} setEmail={setEmail} disabled={!supabase || isSubmitting} id="email" />
        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          disabled={!supabase || isSubmitting}
          autoComplete={mode === "signUp" ? "new-password" : "current-password"}
        />
        {mode === "signUp" ? (
          <PasswordField
            id="confirm-password"
            label="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            disabled={!supabase || isSubmitting}
          />
        ) : null}
        <SubmitButton disabled={!supabase || isSubmitting} icon={mode === "signUp" ? UserPlus : LogIn}>
          {mode === "signUp" ? "Create account" : "Log in"}
        </SubmitButton>
      </form>

      {mode === "signIn" ? (
        <button
          type="button"
          onClick={() => {
            setMode("resetRequest");
            setMessage("Enter your email to receive a password reset link.");
          }}
          className="mt-4 min-h-11 text-sm font-semibold text-[#007a4d] hover:text-[#004d33]"
        >
          Forgot password?
        </button>
      ) : null}
      {status}
    </div>
  );
}

function EmailField({
  email,
  setEmail,
  disabled,
  id,
}: {
  email: string;
  setEmail: (value: string) => void;
  disabled: boolean;
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[#101513]">Email address</label>
      <input
        id={id}
        type="email"
        autoComplete="email"
        className="field mt-2"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={disabled}
        required
      />
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  disabled,
  autoComplete = "new-password",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  autoComplete?: "new-password" | "current-password";
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[#101513]">{label}</label>
      <input
        id={id}
        type="password"
        autoComplete={autoComplete}
        className="field mt-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required
        minLength={8}
      />
    </div>
  );
}

function SubmitButton({
  children,
  disabled,
  icon: Icon,
}: {
  children: React.ReactNode;
  disabled: boolean;
  icon: typeof KeyRound;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#007a4d] px-5 py-3 font-semibold text-white transition hover:bg-[#004d33] disabled:cursor-not-allowed disabled:opacity-55"
    >
      <Icon aria-hidden="true" size={18} />
      {children}
    </button>
  );
}
