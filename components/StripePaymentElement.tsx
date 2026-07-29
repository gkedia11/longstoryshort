"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  Tag,
  X,
} from "lucide-react";
import {
  loadStripe,
  type Stripe,
  type StripeElements,
  type StripePaymentElement as StripePaymentElementInstance,
} from "@stripe/stripe-js";
import { getFirebaseAuth } from "@/lib/firebase/client";

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

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function StripePaymentElement({
  orderId,
  customerName,
  customerEmail,
  onCancel,
  onSuccess,
}: Props) {
  const auth = getFirebaseAuth();
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<StripePaymentElementInstance | null>(null);
  const publishableKeyRef = useRef("");
  const activeRef = useRef(true);
  const [paymentReady, setPaymentReady] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [quotedCode, setQuotedCode] = useState("");
  const [quote, setQuote] = useState<Quote>(baseQuote);
  const [message, setMessage] = useState("Loading secure payment options...");
  const [couponMessage, setCouponMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<PaymentResult | null>(null);
  const paymentElementId = `stripe-payment-${orderId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  async function authorizedPost(path: string, body: Record<string, unknown>) {
    const user = auth?.currentUser;
    if (!user) throw new Error("Please sign in again.");
    const token = await user.getIdToken();
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json() as Record<string, unknown> & {
      error?: string;
    };
    if (!response.ok) {
      throw new Error(payload.error ?? "Secure payment could not be prepared.");
    }
    return payload;
  }

  function destroyPaymentElement() {
    paymentElementRef.current?.destroy();
    paymentElementRef.current = null;
    elementsRef.current = null;
    setPaymentReady(false);
  }

  async function mountPaymentElement(clientSecret: string) {
    destroyPaymentElement();
    let stripe = stripeRef.current;
    if (!stripe) {
      stripe = await loadStripe(publishableKeyRef.current);
      if (!stripe) throw new Error("Stripe could not load.");
      stripeRef.current = stripe;
    }
    if (!activeRef.current) return;

    const elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          borderRadius: "6px",
          colorPrimary: "#007a4d",
          colorText: "#101513",
          colorDanger: "#be123c",
          fontFamily: "Arial, Helvetica, sans-serif",
          spacingUnit: "4px",
        },
      },
      loader: "auto",
    });
    const paymentElement = elements.create("payment", {
      layout: { type: "tabs", defaultCollapsed: false },
      defaultValues: {
        billingDetails: {
          email: customerEmail,
          name: customerName,
        },
      },
    });
    paymentElement.on("ready", () => {
      if (!activeRef.current) return;
      setPaymentReady(true);
      setMessage("Choose a payment method and enter the requested details.");
    });
    paymentElement.on("change", (event) => {
      if (!activeRef.current || !event.value?.type) return;
      setMessage(
        event.complete
          ? "Payment details are ready."
          : "Complete the requested payment details.",
      );
    });
    elementsRef.current = elements;
    paymentElementRef.current = paymentElement;
    paymentElement.mount(`#${paymentElementId}`);
  }

  async function preparePayment(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    setPaymentReady(false);
    setMessage("Preparing secure payment options...");
    const payload = await authorizedPost("/api/stripe/payment-intent", {
      order_id: orderId,
      coupon_code: normalizedCode || undefined,
    });
    const nextQuote = payload.quote as Quote;
    setQuote(nextQuote);
    setQuotedCode(normalizedCode);

    const clientSecret = payload.client_secret;
    if (nextQuote.totalCents === 0) {
      destroyPaymentElement();
      setPaymentReady(true);
      setMessage("No payment details are needed for this order.");
    } else if (typeof clientSecret === "string" && clientSecret) {
      await mountPaymentElement(clientSecret);
    } else {
      throw new Error("Stripe did not return secure payment details.");
    }
    return nextQuote;
  }

  useEffect(() => {
    activeRef.current = true;

    async function initialize() {
      try {
        const response = await fetch("/api/stripe/config", {
          headers: { "Cache-Control": "no-store" },
        });
        const config = await response.json() as {
          publishableKey?: string;
          priceCents?: number;
          currency?: string;
          error?: string;
        };
        if (!response.ok || !config.publishableKey) {
          throw new Error(config.error ?? "Secure payment is unavailable.");
        }
        publishableKeyRef.current = config.publishableKey;
        setQuote((current) => ({
          ...current,
          subtotalCents: config.priceCents ?? current.subtotalCents,
          totalCents: config.priceCents ?? current.totalCents,
          currency: config.currency ?? current.currency,
        }));
        await preparePayment("");
      } catch (error) {
        if (!activeRef.current) return;
        console.error("Stripe Payment Element failed", error);
        setMessage(
          error instanceof Error
            ? error.message
            : "Secure payment options could not load. Refresh and try again.",
        );
      }
    }

    void initialize();
    return () => {
      activeRef.current = false;
      paymentElementRef.current?.destroy();
      paymentElementRef.current = null;
      elementsRef.current = null;
    };
    // The checkout row is remounted for a different order.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function applyCoupon() {
    setCouponMessage("");
    setBusy(true);
    try {
      const nextQuote = await preparePayment(couponCode);
      setCouponMessage(
        nextQuote.coupon
          ? `${nextQuote.coupon.name} applied. You save ${money(nextQuote.discountCents)}.`
          : "Enter a discount code to apply it.",
      );
    } catch (error) {
      setCouponMessage(
        error instanceof Error ? error.message : "The discount could not be applied.",
      );
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
    setMessage(quote.totalCents === 0 ? "Submitting your order..." : "Processing your secure payment...");
    try {
      const normalizedCode = couponCode.trim().toUpperCase();
      const currentQuote = normalizedCode === quotedCode
        ? quote
        : await preparePayment(normalizedCode);

      let result: PaymentResult;
      if (currentQuote.totalCents === 0) {
        result = await authorizedPost("/api/stripe/free-order", {
          order_id: orderId,
          coupon_code: normalizedCode,
        }) as PaymentResult;
      } else {
        const stripe = stripeRef.current;
        const elements = elementsRef.current;
        if (!stripe || !elements || !paymentReady) {
          throw new Error("Secure payment options are not ready yet.");
        }
        const confirmation = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/dashboard`,
          },
          redirect: "if_required",
        });
        if (confirmation.error) {
          throw new Error(
            confirmation.error.message ?? "Stripe could not complete the payment.",
          );
        }
        if (!confirmation.paymentIntent) {
          throw new Error("Stripe has not confirmed the payment.");
        }
        result = await authorizedPost("/api/stripe/finalize", {
          order_id: orderId,
          payment_intent_id: confirmation.paymentIntent.id,
        }) as PaymentResult;
      }

      setSuccess(result);
      setMessage("Payment successful. Your story has been submitted.");
      onSuccess(result);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Payment could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    const paid = (success.total_cents ?? 0) > 0;
    return (
      <div className="flex flex-col gap-4 rounded-md border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={24} />
          <div>
            <h3 className="font-semibold text-emerald-950">
              {paid ? "Payment successful" : "Order submitted"}
            </h3>
            <p className="mt-1 text-sm leading-6 text-emerald-900">
              {paid
                ? `Your story has been submitted. Check ${customerEmail} for the receipt.`
                : "Your story has been submitted. No payment was required."}
            </p>
          </div>
        </div>
        {success.receipt_url ? (
          <a
            href={success.receipt_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-300 bg-white px-5 text-sm font-semibold text-emerald-900"
          >
            View receipt
          </a>
        ) : null}
      </div>
    );
  }

  const couponDirty = couponCode.trim().toUpperCase() !== quotedCode;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <div className={quote.totalCents === 0 ? "hidden" : ""}>
          <label className="text-sm font-semibold text-[#101513]">
            Payment method
          </label>
          <div
            id={paymentElementId}
            className="mt-2 min-h-24 rounded-md bg-white p-3"
          />
        </div>
        <p role="status" className="text-xs leading-5 text-[#6f7d76]">
          {message}
        </p>

        <div>
          <label
            htmlFor={`coupon-${orderId}`}
            className="text-sm font-semibold text-[#101513]"
          >
            Discount coupon{" "}
            <span className="font-normal text-[#6f7d76]">(optional)</span>
          </label>
          <div className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <Tag
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7d76]"
                size={17}
              />
              <input
                id={`coupon-${orderId}`}
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value);
                  setCouponMessage("");
                }}
                className="field field-compact pl-10"
                autoComplete="off"
                placeholder="Enter code"
              />
            </div>
            <button
              type="button"
              onClick={() => void applyCoupon()}
              disabled={busy || !couponCode.trim()}
              className="min-h-11 rounded-full border border-[#cbd8d1] bg-white px-5 text-sm font-semibold disabled:opacity-50"
            >
              Apply
            </button>
          </div>
          {couponMessage ? (
            <p
              role="status"
              className={`mt-2 text-xs ${quote.coupon ? "text-emerald-700" : "text-rose-700"}`}
            >
              {couponMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col justify-end rounded-md border border-[#dbe5df] bg-white p-5">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4 text-[#52615a]">
            <span>Subtotal</span><span>{money(quote.subtotalCents)}</span>
          </div>
          {quote.discountCents ? (
            <div className="flex justify-between gap-4 text-emerald-700">
              <span>Discount</span><span>-{money(quote.discountCents)}</span>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-[#dbe5df] pt-4">
          <span className="text-xs font-semibold uppercase text-[#52615a]">
            Order total
          </span>
          <span className="text-2xl font-semibold text-[#101513]">
            {money(quote.totalCents)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void pay()}
          disabled={busy || !paymentReady || couponDirty}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#007a4d] px-5 font-semibold text-white disabled:opacity-55"
        >
          {busy
            ? <LoaderCircle className="animate-spin" size={18} />
            : <CreditCard size={18} />}
          {busy
            ? "Processing..."
            : quote.totalCents === 0
              ? "Submit order"
              : "Pay securely"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 text-sm font-semibold text-[#52615a] disabled:opacity-55"
        >
          <X size={16} />Cancel
        </button>
      </div>
    </div>
  );
}

