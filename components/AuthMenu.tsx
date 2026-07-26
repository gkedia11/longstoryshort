"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [pinned, setPinned] = useState(false);
  const [email, setEmail] = useState<string | null>(auth?.currentUser?.email ?? null);
  const [authReady, setAuthReady] = useState(Boolean(auth?.currentUser) || !auth);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinnedRef = useRef(false);
  const signedIn = authReady && Boolean(email);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const pinPanel = useCallback((value: boolean) => {
    pinnedRef.current = value;
    setPinned(value);
  }, []);

  const closePanel = useCallback(() => {
    cancelClose();
    pinPanel(false);
    setOpen(false);
  }, [cancelClose, pinPanel]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    if (pinnedRef.current) return;
    closeTimer.current = setTimeout(() => {
      if (!pinnedRef.current) setOpen(false);
    }, 120);
  }, [cancelClose]);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      setEmail(user?.email ?? null);
      setAuthReady(true);
      closePanel();
    });
  }, [auth, closePanel]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsidePress(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) closePanel();
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closePanel();
    }
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, closePanel]);

  useEffect(() => () => cancelClose(), [cancelClose]);

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
          onClick={() => {
            if (mobile) {
              setOpen((current) => !current);
              return;
            }
            pinPanel(true);
            setOpen(true);
          }}
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
            : "absolute right-0 top-[calc(100%+0.4rem)] z-50 w-52 rounded-lg border border-white/20 bg-[#07110d]/96 p-1.5 text-white shadow-2xl backdrop-blur-xl"}
        >
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={closePanel}
            className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <LayoutDashboard aria-hidden="true" size={17} />
            My dashboard
          </Link>
        </div>
      ) : null}

      {open && !signedIn && mobile ? (
        <>
          <button
            type="button"
            aria-label="Close account panel"
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px]"
            onClick={closePanel}
          />
          <section
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label="Log in or create an account"
            className="fixed inset-x-4 top-3 z-50 max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-lg border border-white/25 bg-[#f3f6f2]/96 p-4 text-[#101513] shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#dbe5df] pb-3">
              <p className="font-semibold">Your account</p>
              <button
                type="button"
                aria-label="Close account panel"
                onClick={closePanel}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#dbe5df] text-[#101513] hover:bg-[#eef4f0]"
              >
                <X aria-hidden="true" size={19} />
              </button>
            </div>
            <AuthPanel compact />
          </section>
        </>
      ) : null}

      {open && !signedIn && !mobile ? (
        <section
          id={menuId}
          role="dialog"
          aria-label="Log in or create an account"
          data-pinned={pinned}
          onPointerDownCapture={() => pinPanel(true)}
          onFocusCapture={() => pinPanel(true)}
          className="absolute right-0 top-[calc(100%+0.4rem)] z-50 max-h-[calc(100svh-5.5rem)] w-80 overflow-y-auto rounded-lg border border-white/25 bg-[#eef3ef]/94 p-3 text-[#101513] shadow-[0_20px_55px_rgba(0,0,0,0.32)] backdrop-blur-xl"
        >
          <AuthPanel compact />
        </section>
      ) : null}
    </div>
  );
}
