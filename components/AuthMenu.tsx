"use client";

import { useEffect, useRef, useState } from "react";
import { LogIn, X } from "lucide-react";
import { AuthPanel } from "./AuthPanel";

type AuthMenuProps = {
  mobile?: boolean;
};

export function AuthMenu({ mobile = false }: AuthMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  }

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
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={mobile ? "mobile-auth-menu" : "desktop-auth-menu"}
        onClick={() => mobile ? setOpen((current) => !current) : setOpen(true)}
        className={mobile
          ? "mt-1 flex min-h-11 w-full items-center gap-2 rounded-md border-t border-white/12 px-3 pt-2 text-left text-base font-semibold text-white hover:bg-white/10"
          : "inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-base font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] transition hover:bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"}
      >
        <LogIn aria-hidden="true" size={mobile ? 18 : 16} />
        Log in / Sign up
      </button>

      {open && mobile ? (
        <>
          <button
            type="button"
            aria-label="Close account panel"
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <section
            id="mobile-auth-menu"
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

      {open && !mobile ? (
        <>
          <button
            type="button"
            aria-label="Close account panel"
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <section
            id="desktop-auth-menu"
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