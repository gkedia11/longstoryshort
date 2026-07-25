"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogIn, UserRound, X } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { AuthPanel } from "./AuthPanel";

type AuthMenuProps = {
  mobile?: boolean;
};

export function AuthMenu({ mobile = false }: AuthMenuProps) {
  const auth = getFirebaseAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(auth?.currentUser?.email ?? null);
  const [authReady, setAuthReady] = useState(Boolean(auth?.currentUser) || !auth);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signedIn = authReady && Boolean(email);

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  }

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      setEmail(user?.email ?? null);
      setAuthReady(true);
      setOpen(false);
    });
  }, [auth]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsidePress(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => () => cancelClose(), []);

  const menuId = mobile ? "mobile-account-menu" : "desktop-account-menu";

  return (
    <div
      ref={rootRef}
      className={mobile ? "w-full" : "relative"}
      onMouseEnter={mobile ? undefined : () => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={mobile ? undefined : scheduleClose}
      onFocus={mobile ? undefined : () => {
        cancelClose();
        setOpen(true);
      }}
      onBlur={mobile ? undefined : (event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleClose();
      }}
    >
      {!authReady ? (
        <span
          aria-label="Checking account status"
          className={mobile
            ? "mt-1 block min-h-11 w-full animate-pulse rounded-md border-t border-white/12 bg-white/8"
            : "block h-11 w-36 animate-pulse rounded-full bg-black/15"}
        />
      ) : (
        <button
          type="button"
          aria-haspopup={signedIn ? "menu" : "dialog"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => mobile ? setOpen((current) => !current) : setOpen(true)}
          className={mobile
            ? "mt-1 flex min-h-11 w-full items-center gap-2 rounded-md border-t border-white/12 px-3 pt-2 text-left text-base font-semibold text-white hover:bg-white/10"
            : "inline-flex min-h-11 max-w-64 items-center gap-2 rounded-full px-4 py-2 text-base font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] transition hover:bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"}
        >
          {signedIn ? <UserRound aria-hidden="true" size={mobile ? 18 : 16} /> : <LogIn aria-hidden="true" size={mobile ? 18 : 16} />}
          <span className="min-w-0 truncate">{signedIn ? email : "Log in / Sign up"}</span>
          {signedIn ? <ChevronDown aria-hidden="true" className="ml-auto shrink-0" size={16} /> : null}
        </button>
      )}

      {open && signedIn ? (
        <div
          id={menuId}
          role="menu"
          className={mobile
            ? "mt-2 rounded-md border border-white/12 bg-white/8 p-1.5 text-white"
            : "absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-lg border border-white/20 bg-[#07110d]/96 p-2 text-white shadow-2xl backdrop-blur-xl"}
        >
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <LayoutDashboard aria-hidden="true" size={18} />
            My dashboard
          </Link>
        </div>
      ) : null}

      {open && !signedIn && mobile ? (
        <>
          <button
            type="button"
            aria-label="Close account panel"
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <section
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label="Log in or create an account"
            className="fixed inset-x-4 top-3 z-50 max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-lg border border-white/25 bg-[#f3f6f2]/96 p-4 text-[#101513] shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-[#dbe5df] pb-3">
              <div>
                <p className="text-lg font-semibold">Your account</p>
                <p className="mt-1 text-xs leading-5 text-[#52615a]">Log in or create an account without leaving this page.</p>
              </div>
              <button
                type="button"
                aria-label="Close account panel"
                onClick={() => setOpen(false)}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-[#dbe5df] text-[#101513] hover:bg-[#eef4f0]"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <AuthPanel compact />
          </section>
        </>
      ) : null}

      {open && !signedIn && !mobile ? (
        <>
          <button
            type="button"
            aria-label="Close account panel"
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <section
            id={menuId}
            role="dialog"
            aria-label="Log in or create an account"
            className="absolute right-0 top-[calc(100%+0.6rem)] z-50 max-h-[calc(100svh-6.5rem)] w-[21.5rem] overflow-y-auto rounded-lg border border-white/25 bg-[#f3f6f2]/96 p-4 text-[#101513] shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl"
          >
            <div className="mb-3 border-b border-[#dbe5df] pb-3">
              <p className="font-semibold">Your account</p>
              <p className="mt-1 text-xs leading-5 text-[#52615a]">Log in or create an account without leaving this page.</p>
            </div>
            <AuthPanel compact />
          </section>
        </>
      ) : null}
    </div>
  );
}