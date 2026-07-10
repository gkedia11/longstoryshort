"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CreditCard, LockKeyhole } from "lucide-react";
import { genres, site } from "@/lib/site";
import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

type FormState = {
  bookId: string;
  name: string;
  email: string;
  genre: string;
  summary: string;
};

function createBookId() {
  return globalThis.crypto.randomUUID();
}

export function NewStoryForm() {
  const supabase = getSupabaseBrowserClient();
  const [form, setForm] = useState<FormState>({
    bookId: typeof window === "undefined" ? "" : createBookId(),
    name: "",
    email: "",
    genre: genres[0],
    summary: "",
  });
  const [message, setMessage] = useState(
    supabase
      ? "Tell us about the novel you want to create."
      : "Order access is temporarily unavailable. Please try again later.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationMessage = useMemo(() => {
    if (!supabase) return "Order access is temporarily unavailable. Please try again later.";
    if (form.name.trim().length < 2) return "Enter your name.";
    if (!form.bookId) return "Preparing your Book ID...";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Enter a valid email address.";
    }
    if (form.summary.trim().length < 40) {
      return "Add at least 40 characters to the story summary.";
    }
    return null;
  }, [form, supabase]);

  const canSubmit = useMemo(() => {
    return (
      Boolean(supabase) &&
      !validationMessage &&
      !isSubmitting
    );
  }, [isSubmitting, supabase, validationMessage]);

  useEffect(() => {
    if (!supabase) return;
    let isActive = true;

    async function loadIdentity() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!isActive) return;

      if (!session) {
        window.location.href = "/login";
        return;
      }

      const sessionEmail = session.user.email?.trim() ?? "";
      const sessionNameCandidates = [
        session.user.user_metadata?.full_name,
        session.user.user_metadata?.name,
        session.user.user_metadata?.display_name,
      ]
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean);

      const [{ data: profile }, { data: latestOrder }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name,email")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase
          .from("story_orders")
          .select("name,email")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!isActive) return;

      const profileName =
        typeof profile?.full_name === "string" ? profile.full_name.trim() : "";
      const profileEmail =
        typeof profile?.email === "string" ? profile.email.trim() : "";
      const orderName =
        typeof latestOrder?.name === "string" ? latestOrder.name.trim() : "";
      const orderEmail =
        typeof latestOrder?.email === "string" ? latestOrder.email.trim() : "";
      const fallbackName =
        sessionNameCandidates[0] ||
        orderName ||
        (sessionEmail ? sessionEmail.split("@")[0].replace(/[._-]+/g, " ") : "");

      setForm((current) => ({
        ...current,
        email:
          current.email
            ? current.email
            : profileEmail || orderEmail || sessionEmail || current.email,
        name: current.name || profileName || orderName || fallbackName,
      }));
    }

    void loadIdentity();
    return () => {
      isActive = false;
    };
  }, [supabase]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setIsSubmitting(true);
    setMessage("Saving your order...");

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("story_orders")
      .insert({
        id: form.bookId,
        user_id: session.user.id,
        name: form.name.trim(),
        email: form.email.trim(),
        genre: form.genre,
        summary: form.summary.trim(),
        stripe_payment_status: "unpaid",
        story_status: "pending_payment",
      })
      .select("id")
      .single();

    if (error || !data) {
      setIsSubmitting(false);
      setMessage("We could not save your order. Please try again or contact support.");
      setForm((current) => ({ ...current, bookId: createBookId() }));
      return;
    }

    void supabase.from("profiles").upsert(
      {
        id: session.user.id,
        email: form.email.trim(),
        full_name: form.name.trim(),
      },
      { onConflict: "id" },
    );

    setMessage("Opening secure checkout...");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ order_id: data.id }),
    });
    const payload = (await response.json()) as {
      checkout_url?: string;
      error?: string;
    };

    if (!response.ok || !payload.checkout_url) {
      setIsSubmitting(false);
      setMessage("We could not open secure payment. Please try again from your dashboard.");
      return;
    }

    window.location.href = payload.checkout_url;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <label
          htmlFor="book-id"
          className="text-sm font-semibold text-[#101513]"
        >
          Book ID
        </label>
        <input
          id="book-id"
          className="field mt-2 font-mono text-sm text-[#52615a]"
          value={form.bookId}
          readOnly
          suppressHydrationWarning
          aria-describedby="book-id-help"
        />
        <p id="book-id-help" className="mt-2 text-xs leading-5 text-[#6f7d76]">
          Keep this ID in case you do not receive your novel manuscript within
          one day of ordering.
        </p>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="text-sm font-semibold text-[#101513]"
          >
            Name
          </label>
          <input
            id="name"
            className="field mt-2"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            autoComplete="name"
            required
            minLength={2}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="text-sm font-semibold text-[#101513]"
          >
            Email
          </label>
          <input
            id="email"
            className="field mt-2"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            autoComplete="email"
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="genre"
          className="text-sm font-semibold text-[#101513]"
        >
          Novel genre
        </label>
        <select
          id="genre"
          className="field mt-2"
          value={form.genre}
          onChange={(event) => updateField("genre", event.target.value)}
          disabled={isSubmitting}
        >
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label
          htmlFor="summary"
          className="text-sm font-semibold text-[#101513]"
        >
          Story summary
        </label>
        <textarea
          id="summary"
          className="field mt-2 min-h-48 resize-y"
          value={form.summary}
          onChange={(event) => updateField("summary", event.target.value)}
          placeholder="Describe the premise, main characters, setting, tone, ending preferences, and anything the novel manuscript should include."
          minLength={40}
          maxLength={5000}
          required
          disabled={isSubmitting}
        />
        <p className="mt-2 text-xs text-[#6f7d76]">
          {form.summary.length}/5000 characters
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-4 border-t border-[#dbe5df] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 text-sm leading-6 text-[#52615a]">
          <LockKeyhole
            aria-hidden="true"
            size={18}
            className="mt-1 shrink-0 text-[#007a4d]"
          />
          <span>
            Your story details and Book ID stay with your order. Work on your
            novel manuscript begins after payment is confirmed.
          </span>
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#007a4d] px-6 py-3.5 font-semibold text-white transition hover:bg-[#004d33] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <CreditCard aria-hidden="true" size={18} />
          Continue to {site.price}
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-5 text-sm leading-6 text-[#52615a]">
        {validationMessage ?? message}
      </p>
    </form>
  );
}
