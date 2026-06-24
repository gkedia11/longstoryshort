"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CreditCard, LockKeyhole } from "lucide-react";
import { genres, site } from "@/lib/site";
import {
  getSupabaseBrowserClient,
  getSupabaseBrowserConfigError,
} from "@/lib/supabase/client";

type FormState = {
  name: string;
  email: string;
  genre: string;
  summary: string;
};

export function NewStoryForm() {
  const supabase = getSupabaseBrowserClient();
  const configError = getSupabaseBrowserConfigError();
  const fallbackEmail = process.env.NEXT_PUBLIC_TEST_EMAIL ?? "";
  const [form, setForm] = useState<FormState>({
    name: "",
    email: fallbackEmail,
    genre: genres[0],
    summary: "",
  });
  const [message, setMessage] = useState(
    supabase
      ? "Tell us the manuscript you want. Your summary is saved before checkout."
      : (configError ?? "Supabase browser keys are not configured yet."),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationMessage = useMemo(() => {
    if (configError) return configError;
    if (form.name.trim().length < 2) return "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Enter a valid email address.";
    }
    if (form.summary.trim().length < 40) {
      return "Add at least 40 characters to the story summary.";
    }
    return null;
  }, [configError, form]);

  const canSubmit = useMemo(() => {
    return (
      Boolean(supabase) &&
      !validationMessage &&
      !isSubmitting
    );
  }, [isSubmitting, supabase, validationMessage]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = "/login";
        return;
      }
      const sessionEmail = data.session.user.email;
      if (sessionEmail) {
        setForm((current) => ({ ...current, email: sessionEmail }));
      }
    });
  }, [supabase]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setIsSubmitting(true);
    setMessage("Saving your story summary...");

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("story_orders")
      .insert({
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
      setMessage(error?.message ?? "Could not save your order.");
      return;
    }

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
      setMessage(payload.error ?? "Could not create checkout session.");
      return;
    }

    window.location.href = payload.checkout_url;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[#dbe5df] bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
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
          placeholder="Describe the premise, main characters, setting, tone, ending preferences, and anything the manuscript should include."
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
            Your order is saved before checkout. The manuscript workflow starts
            only after payment confirmation.
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
      <p className="mt-5 text-sm leading-6 text-[#52615a]">
        {validationMessage ?? message}
      </p>
    </form>
  );
}
