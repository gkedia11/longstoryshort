"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, Mail, UserPlus } from "lucide-react";
import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  verifyPasswordResetCode,
  type User,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import {
  getFirebaseAuth,
  getFirebaseBrowserConfigError,
  getFirebaseDb,
  googleProvider,
} from "@/lib/firebase/client";

type AuthMode = "signIn" | "signUp" | "resetRequest" | "updatePassword";

export function AuthPanel({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const unavailable = getFirebaseBrowserConfigError();
  const googleInProgress = useRef(false);
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !reset && !googleInProgress.current) router.replace("/dashboard");
    });
    return unsubscribe;
  }, [auth, router]);

  async function saveGoogleProfile(user: User) {
    if (!db) return;
    const updatedAt = new Date().toISOString();
    await setDoc(doc(db, "profiles", user.uid), {
      id: user.uid,
      email: user.email ?? "",
      full_name: user.displayName ?? user.email?.split("@")[0] ?? "",
      updated_at: updatedAt,
    }, { merge: true });
  }

  async function submitSignIn(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!auth) return; setIsSubmitting(true); try { await signInWithEmailAndPassword(auth, email, password); router.replace("/dashboard"); } catch { setMessage("Login did not work. Check your email and password, or reset your password if you forgot it."); setIsSubmitting(false); } }
  async function submitSignUp(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!auth) return; if (password !== confirmPassword) return setMessage("The passwords do not match."); setIsSubmitting(true); try { const result = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(result.user, { displayName: fullName.trim() }); router.replace("/dashboard"); } catch { setMessage("We could not create the account. Check your details or try signing in if you already have an account."); setIsSubmitting(false); } }
  async function google() {
    if (!auth) return;
    googleInProgress.current = true;
    setIsSubmitting(true);
    setMessage("Opening Google sign-in...");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      try {
        await saveGoogleProfile(result.user);
      } catch {
        // Authentication succeeded; profile details can be refreshed from Google later.
      }
      router.replace("/dashboard");
    } catch (error) {
      googleInProgress.current = false;
      const code = typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setMessage("Google sign-in was closed before it finished.");
      } else if (code === "auth/popup-blocked") {
        setMessage("Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.");
      } else if (code === "auth/account-exists-with-different-credential") {
        setMessage("An account already uses this email. Log in with your email and password, then try Google again.");
      } else {
        setMessage("Google sign-in did not work. Please try again.");
      }
      setIsSubmitting(false);
    }
  }
  async function reset(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!auth) return; setIsSubmitting(true); try { await sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/login` }); setMessage("Password reset email sent. Open it to choose a new password."); } catch { setMessage("We could not send the reset email. Check the address and try again."); } setIsSubmitting(false); }
  async function changePassword(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!auth) return; if (password !== confirmPassword) return setMessage("The new passwords do not match."); const code = new URLSearchParams(window.location.search).get("oobCode"); if (!code) return setMessage("That password reset link is no longer valid. Request a new one."); setIsSubmitting(true); try { await confirmPasswordReset(auth, code, password); setMessage("Password changed. Please log in."); setMode("signIn"); } catch { setMessage("We could not change your password. Please try the reset link again."); } setIsSubmitting(false); }
  const disabled = !auth || isSubmitting;
  const panelClass = compact ? "bg-transparent" : "rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8";
  const formSpacing = compact ? "space-y-2.5" : "space-y-5";
  const status = <p role="status" aria-live="polite" className={`${compact ? "mt-3 text-xs leading-5" : "mt-5 text-sm leading-6"} text-[#52615a]`}>{message}</p>;
  const field = (id: string, label: string, value: string, setValue: (value: string) => void, type = "password") => <div><label htmlFor={id} className={`${compact ? "text-xs" : "text-sm"} font-semibold text-[#101513]`}>{label}</label><input id={id} type={type} className={`field ${compact ? "field-compact mt-1.5 text-sm" : "mt-2"}`} value={value} onChange={(event) => setValue(event.target.value)} disabled={disabled} required minLength={type === "password" ? 8 : undefined} /></div>;
  const action = (label: string, icon: typeof KeyRound) => { const Icon = icon; return <button type="submit" disabled={disabled} className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#007a4d] font-semibold text-white transition hover:bg-[#004d33] disabled:cursor-not-allowed disabled:opacity-55 ${compact ? "min-h-11 px-4 py-2.5 text-sm" : "min-h-12 px-5 py-3"}`}><Icon aria-hidden="true" size={compact ? 16 : 18} />{label}</button>; };

  if (mode === "updatePassword") return <div className={panelClass}><form onSubmit={changePassword} className={formSpacing}>{field("new-password", "New password", password, setPassword)}{field("confirm-password", "Confirm new password", confirmPassword, setConfirmPassword)}{action("Change password", KeyRound)}</form>{status}</div>;
  if (mode === "resetRequest") return <div className={panelClass}><form onSubmit={reset} className={formSpacing}>{field("reset-email", "Email address", email, setEmail, "email")}{action("Send reset email", Mail)}</form><button type="button" onClick={() => setMode("signIn")} className="mt-4 min-h-11 text-sm font-semibold text-[#007a4d] hover:text-[#004d33]">Back to sign in</button>{status}</div>;
  return <div className={panelClass}><div className="grid grid-cols-2 rounded-md bg-[#e5ece7] p-1"><button type="button" onClick={() => { setMode("signIn"); setMessage("Enter your email and password to sign in."); }} className={`${compact ? "min-h-10 text-xs" : "min-h-11 text-sm"} rounded px-3 font-semibold ${mode === "signIn" ? "bg-white text-[#101513] shadow-sm" : "text-[#52615a]"}`}>Log in</button><button type="button" onClick={() => { setMode("signUp"); setMessage("Create an account to place and track novel manuscript orders."); }} className={`${compact ? "min-h-10 text-xs" : "min-h-11 text-sm"} rounded px-3 font-semibold ${mode === "signUp" ? "bg-white text-[#101513] shadow-sm" : "text-[#52615a]"}`}>Sign up</button></div><button type="button" onClick={google} disabled={disabled} className={`${compact ? "mt-3 min-h-11 px-4 py-2.5 text-sm" : "mt-6 min-h-12 px-5 py-3"} inline-flex w-full items-center justify-center gap-3 rounded-full border border-[#dbe5df] bg-white font-semibold text-[#101513] disabled:opacity-55`}><span className="inline-flex size-6 items-center justify-center rounded-full border border-[#dbe5df] text-sm font-bold text-[#1a73e8]">G</span>Continue with Google</button><div className={`${compact ? "my-3 gap-2 text-[10px]" : "my-6 gap-3 text-xs"} flex items-center font-medium uppercase text-[#7a8a82]`}><span className="h-px flex-1 bg-[#dbe5df]" /><span>or use email and password</span><span className="h-px flex-1 bg-[#dbe5df]" /></div><form onSubmit={mode === "signUp" ? submitSignUp : submitSignIn} className={formSpacing}>{mode === "signUp" ? field("full-name", "Name", fullName, setFullName, "text") : null}{field("email", "Email address", email, setEmail, "email")}{field("password", "Password", password, setPassword)}{mode === "signUp" ? field("confirm-password", "Confirm password", confirmPassword, setConfirmPassword) : null}{action(mode === "signUp" ? "Create account" : "Log in", mode === "signUp" ? UserPlus : LogIn)}</form>{mode === "signIn" ? <button type="button" onClick={() => { setMode("resetRequest"); setMessage("Enter your email to receive a password reset link."); }} className={`${compact ? "mt-2 min-h-10 text-xs" : "mt-4 min-h-11 text-sm"} font-semibold text-[#007a4d] hover:text-[#004d33]`}>Forgot password?</button> : null}{status}</div>;
}