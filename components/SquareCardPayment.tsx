"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CreditCard, LoaderCircle, Tag, X } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/client";

type TokenResult = {
  status: string;
  token?: string;
  errors?: Array<{ message?: string }>;
};

type SquareCard = {
  attach(selector: string): Promise<void>;
  tokenize(details: {
    amount: string;
    billingContact: { email: string; givenName: string; countryCode: string };
    currencyCode: string;
    intent: "CHARGE";
    customerInitiated: boolean;
    sellerKeyedIn: boolean;
  }): Promise<TokenResult>;
  destroy(): Promise<void>;
};

type SquarePayments = { card(): Promise<SquareCard> };

declare global {
  interface Window {
    Square?: {
      payments(applicationId: string, locationId: string): SquarePayments;
    };
  }
}

type Quote = {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  coupon: { code: string; name: string } | null;
};

type PaymentResult = {
  success?: boolean;
  total_cents?: number;
  receipt_url?: string | null;
  card_last_four?: string | null;
  error?: string;
};

type Props = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  onCancel: () => void;
  onSuccess: (result: PaymentResult) => void;
};

const baseQuote: Quote = {
  subtotalCents: 2999,
  discountCents: 0,
  totalCents: 2999,
  currency: "USD",
  coupon: null,
};

let squareScriptPromise: Promise<void> | null = null;

function loadSquareScript() {
  if (window.Square) return Promise.resolve();
  if (squareScriptPromise) return squareScriptPromise;

  squareScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://web.squarecdn.com/v1/square.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Square could not load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://web.squarecdn.com/v1/square.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Square could not load"));
    document.head.appendChild(script);
  });

  return squareScriptPromise;
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function SquareCardPayment({
  orderId,
  customerName,
  customerEmail,
  onCancel,
  onSuccess,
}: Props) {
  const auth = getFirebaseAuth();
  const cardRef = useRef<SquareCard | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [quotedCode, setQuotedCode] = useState("");
  const [quote, setQuote] = useState<Quote>(baseQuote);
  const [message, setMessage] = useState("Loading secure card fields...");
  const [couponMessage, setCouponMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<PaymentResult | null>(null);
  const cardElementId = `square-card-${orderId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const configResponse = await fetch("/api/square/config");
        const config = await configResponse.json() as {
          applicationId?: string;
          locationId?: string;
          priceCents?: number;
          currency?: string;
          error?: string;
        };
        if (!configResponse.ok || !config.applicationId || !config.locationId) {
          throw new Error(config.error ?? "Secure payment is unavailable");
        }
        setQuote((current) => ({
          ...current,
          subtotalCents: config.priceCents ?? current.subtotalCents,
          totalCents: config.priceCents ?? current.totalCents,
          currency: config.currency ?? current.currency,
        }));

        await loadSquareScript();
        if (!active || !window.Square) return;
        const payments = window.Square.payments(config.applicationId, config.locationId);
        const card = await payments.card();
        await card.attach(`#${cardElementId}`);
        if (!active) {
          await card.destroy();
          return;
        }
        cardRef.current = card;
        setCardReady(true);
        setMessage("Card information is encrypted and handled securely by Square.");
      } catch (error) {
        if (!active) return;
        console.error("Square card form failed", error);
        setMessage("Secure card fields could not load. Refresh the page and try again.");
      }
    }

    void initialize();
    return () => {
      active = false;
      const card = cardRef.current;
      cardRef.current = null;
      if (card) void card.destroy();
    };
  }, [cardElementId]);

  async function requestQuote(code: string) {
    const user = auth?.currentUser;
    if (!user) throw new Error("Please sign in again.");
    const token = await user.getIdToken();
    const response = await fetch("/api/square/quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id: orderId, coupon_code: code || undefined }),
    });
    const payload = await response.json() as Quote & { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "The discount could not be applied.");
    setQuote(payload);
    setQuotedCode(code.trim().toUpperCase());
    return payload;
  }

  async function applyCoupon() {
    setCouponMessage("");
    setBusy(true);
    try {
      const nextQuote = await requestQuote(couponCode);
      setCouponMessage(
        nextQuote.coupon
          ? `${nextQuote.coupon.name} applied. You save ${money(nextQuote.discountCents)}.`
          : "Enter a discount code to apply it.",
      );
    } catch (error) {
      setQuote(baseQuote);
      setQuotedCode("");
      setCouponMessage(error instanceof Error ? error.message : "The discount could not be applied.");
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    const user = auth?.currentUser;
    if (!user) {
      setMessage("Please sign in again before paying.");
      return;
    }

    setBusy(true);
    setMessage("Processing your secure payment...");
    try {
      const normalizedCode = couponCode.trim().toUpperCase();
      const currentQuote = normalizedCode === quotedCode
        ? quote
        : await requestQuote(normalizedCode);

      let sourceId: string | undefined;
      if (currentQuote.totalCents > 0) {
        if (!cardRef.current || !cardReady) throw new Error("Secure card fields are not ready yet.");
        const firstName = customerName.trim().split(/\s+/)[0] || "Customer";
        const tokenResult = await cardRef.current.tokenize({
          amount: (currentQuote.totalCents / 100).toFixed(2),
          billingContact: {
            email: customerEmail,
            givenName: firstName,
            countryCode: "US",
          },
          currencyCode: currentQuote.currency,
          intent: "CHARGE",
          customerInitiated: true,
          sellerKeyedIn: false,
        });
        if (tokenResult.status !== "OK" || !tokenResult.token) {
          throw new Error(tokenResult.errors?.[0]?.message ?? "Check the card details and try again.");
        }
        sourceId = tokenResult.token;
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/square/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          source_id: sourceId,
          coupon_code: normalizedCode || undefined,
        }),
      });
      const result = await response.json() as PaymentResult;
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Payment could not be completed.");
      }

      setSuccess(result);
      setMessage("Payment successful. Your story has been submitted.");
      onSuccess(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payment could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 rounded-md border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={24} />
          <div>
            <h3 className="font-semibold text-emerald-950">Payment successful</h3>
            <p className="mt-1 text-sm leading-6 text-emerald-900">
              Your story has been submitted. Check your email address ({customerEmail}) for the receipt.
            </p>
            {success.card_last_four ? <p className="mt-1 text-xs text-emerald-800">Card ending in {success.card_last_four}</p> : null}
          </div>
        </div>
        {success.receipt_url ? (
          <a href={success.receipt_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-300 bg-white px-5 text-sm font-semibold text-emerald-900">View receipt</a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-[#101513]">Card details</label>
          <div id={cardElementId} className="mt-2 min-h-14 rounded-md bg-white" />
          <p className="mt-2 text-xs leading-5 text-[#6f7d76]">{message}</p>
        </div>

        <div>
          <label htmlFor={`coupon-${orderId}`} className="text-sm font-semibold text-[#101513]">Discount coupon <span className="font-normal text-[#6f7d76]">(optional)</span></label>
          <div className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <Tag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7d76]" size={17} />
              <input
                id={`coupon-${orderId}`}
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value);
                  setCouponMessage("");
                  setQuotedCode("");
                  setQuote(baseQuote);
                }}
                className="field field-compact pl-10"
                autoComplete="off"
                placeholder="Enter code"
              />
            </div>
            <button type="button" onClick={() => void applyCoupon()} disabled={busy || !couponCode.trim()} className="min-h-11 rounded-full border border-[#cbd8d1] bg-white px-5 text-sm font-semibold disabled:opacity-50">Apply</button>
          </div>
          {couponMessage ? <p role="status" className={`mt-2 text-xs ${quote.coupon ? "text-emerald-700" : "text-rose-700"}`}>{couponMessage}</p> : null}
        </div>
      </div>

      <div className="flex flex-col justify-end rounded-md border border-[#dbe5df] bg-white p-5">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4 text-[#52615a]"><span>Subtotal</span><span>{money(quote.subtotalCents)}</span></div>
          {quote.discountCents ? <div className="flex justify-between gap-4 text-emerald-700"><span>Discount</span><span>-{money(quote.discountCents)}</span></div> : null}
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-[#dbe5df] pt-4">
          <span className="text-xs font-semibold uppercase text-[#52615a]">Order total</span>
          <span className="text-2xl font-semibold text-[#101513]">{money(quote.totalCents)}</span>
        </div>
        <button type="button" onClick={() => void pay()} disabled={busy || (quote.totalCents > 0 && !cardReady)} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#007a4d] px-5 font-semibold text-white disabled:opacity-55">
          {busy ? <LoaderCircle className="animate-spin" size={18} /> : <CreditCard size={18} />}
          {busy ? "Processing..." : quote.totalCents === 0 ? "Submit order" : "Pay securely"}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 text-sm font-semibold text-[#52615a] disabled:opacity-55"><X size={16} />Cancel</button>
      </div>
    </div>
  );
}
