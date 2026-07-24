"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, Mail, UserPlus } from "lucide-react";
import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithRedirect,
  updateProfile,
  verifyPasswordResetCode,
} from "firebase/auth";
import { getFirebaseAuth, getFirebaseBrowserConfigError, googleProvider } from "@/lib/firebase/client";

type AuthMode = "signIn" | "signUp" | "resetRequest" | "updatePassword";

export function AuthPanel() {
  const router = useRouter();
  const auth = getFirebaseAuth();
  const unavailable = getFirebaseBrowserConfigError();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [message, setMessage] = useState(unavailable ? "Account access is temporarily unavailable. Please try again later." : "Enter your email and password to sign in.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const code = new URLSearchParams(window.location.search).get("oobCode");
    const reset = new URLSearchParams(window.location.search).get("mode") === "resetPassword";
    if (reset && code) {
      void verifyPasswordResetCode(auth, code).then((address) => { setEmail(address); setMode("updatePassword"); setMessage("Choose a new password for your account."); }).catch(() => setMessage("That password reset link is no longer valid. Request a new one."));
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => { if (user && !reset) router.replace("/dashboard"); });
    return unsubscribe;
  }, [auth, router]);

  async function submitSignIn(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!auth) return; setIsSubmitting(true); try { await signInWithEmailAndPassword(auth, email, password); router.replace("/dashboard"); } catch { setMessage("Login did not work. Check your email and password, or reset your password if you forgot it."); setIsSubmitting(false); } }
  async function submitSignUp(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!auth) return; if (password !== confirmPassword) return setMessage("The passwords do not match."); setIsSubmitting(true); try { const result = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(result.user, { displayName: fullName.trim() }); router.replace("/dashboard"); } catch { setMessage("We could not create the account. Check your details or try signing in if you already have an account."); setIsSubmitting(false); } }
  async function google() { if (!auth) return; setIsSubmitting(true); setMessage("Opening Google sign-in..."); try { await signInWithRedirect(auth, googleProvider); } catch { setMessage("Google sign-in could not be started. Please try again."); setIsSubmitting(false); } }
  async function reset(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!auth) return; setIsSubmitting(true); try { await sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/login` }); setMessage("Password reset email sent. Open it to choose a new password."); } catch { setMessage("We could not send the reset email. Check the address and try again."); } setIsSubmitting(false); }
  async function changePassword(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!auth) return; if (password !== confirmPassword) return setMessage("The new passwords do not match."); const code = new URLSearchParams(window.location.search).get("oobCode"); if (!code) return setMessage("That password reset link is no longer valid. Request a new one."); setIsSubmitting(true); try { await confirmPasswordReset(auth, code, password); setMessage("Password changed. Please log in."); setMode("signIn"); } catch { setMessage("We could not change your password. Please try the reset link again."); } setIsSubmitting(false); }
  const disabled = !auth || isSubmitting;
  const status = <p role="status" aria-live="polite" className="mt-5 text-sm leading-6 text-[#52615a]">{message}</p>;
  const field = (id: string, label: string, value: string, setValue: (value: string) => void, type = "password") => <div><label htmlFor={id} className="text-sm font-semibold text-[#101513]">{label}</label><input id={id} type={type} className="field mt-2" value={value} onChange={(event) => setValue(event.target.value)} disabled={disabled} required minLength={type === "password" ? 8 : undefined} /></div>;
  const action = (label: string, icon: typeof KeyRound) => { const Icon = icon; return <button type="submit" disabled={disabled} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#007a4d] px-5 py-3 font-semibold text-white transition hover:bg-[#004d33] disabled:cursor-not-allowed disabled:opacity-55"><Icon aria-hidden="true" size={18} />{label}</button>; };

  if (mode === "updatePassword") return <div className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8"><form onSubmit={changePassword} className="space-y-5">{field("new-password", "New password", password, setPassword)}{field("confirm-password", "Confirm new password", confirmPassword, setConfirmPassword)}{action("Change password", KeyRound)}</form>{status}</div>;
  if (mode === "resetRequest") return <div className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8"><form onSubmit={reset} className="space-y-5">{field("reset-email", "Email address", email, setEmail, "email")}{action("Send reset email", Mail)}</form><button type="button" onClick={() => setMode("signIn")} className="mt-4 min-h-11 text-sm font-semibold text-[#007a4d] hover:text-[#004d33]">Back to sign in</button>{status}</div>;
  return <div className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8"><div className="grid grid-cols-2 rounded-md bg-[#eef4f0] p-1"><button type="button" onClick={() => { setMode("signIn"); setMessage("Enter your email and password to sign in."); }} className={`min-h-11 rounded px-3 text-sm font-semibold ${mode === "signIn" ? "bg-white text-[#101513] shadow-sm" : "text-[#52615a]"}`}>Log in</button><button type="button" onClick={() => { setMode("signUp"); setMessage("Create an account to place and track novel manuscript orders."); }} className={`min-h-11 rounded px-3 text-sm font-semibold ${mode === "signUp" ? "bg-white text-[#101513] shadow-sm" : "text-[#52615a]"}`}>Sign up</button></div><button type="button" onClick={google} disabled={disabled} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-[#dbe5df] bg-white px-5 py-3 font-semibold text-[#101513] disabled:opacity-55"><span className="inline-flex size-6 items-center justify-center rounded-full border border-[#dbe5df] text-sm font-bold text-[#1a73e8]">G</span>Continue with Google</button><div className="my-6 flex items-center gap-3 text-xs font-medium uppercase text-[#7a8a82]"><span className="h-px flex-1 bg-[#dbe5df]" /><span>or use email and password</span><span className="h-px flex-1 bg-[#dbe5df]" /></div><form onSubmit={mode === "signUp" ? submitSignUp : submitSignIn} className="space-y-5">{mode === "signUp" ? field("full-name", "Name", fullName, setFullName, "text") : null}{field("email", "Email address", email, setEmail, "email")}{field("password", "Password", password, setPassword)}{mode === "signUp" ? field("confirm-password", "Confirm password", confirmPassword, setConfirmPassword) : null}{action(mode === "signUp" ? "Create account" : "Log in", mode === "signUp" ? UserPlus : LogIn)}</form>{mode === "signIn" ? <button type="button" onClick={() => { setMode("resetRequest"); setMessage("Enter your email to receive a password reset link."); }} className="mt-4 min-h-11 text-sm font-semibold text-[#007a4d] hover:text-[#004d33]">Forgot password?</button> : null}{status}</div>;
}