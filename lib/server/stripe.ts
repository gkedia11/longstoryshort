import { site } from "@/lib/site";

type StripeError = {
  error?: { message?: string };
};

export type StripePaymentIntent = {
  id: string;
  amount: number;
  client_secret: string | null;
  currency: string;
  latest_charge?: string | { id?: string; receipt_url?: string | null } | null;
  metadata?: Record<string, string>;
  receipt_email?: string | null;
  status: string;
};

type StripeCoupon = {
  id: string;
  amount_off?: number | null;
  currency?: string | null;
  name?: string | null;
  percent_off?: number | null;
  valid?: boolean;
};

type StripePromotionCode = {
  id: string;
  active: boolean;
  code: string;
  coupon?: StripeCoupon;
  promotion?: {
    coupon?: string | StripeCoupon;
    type?: string;
  };
};

type StripePromotionCodeList = StripeError & {
  data?: StripePromotionCode[];
};

export type StripeQuote = {
  coupon: { code: string; name: string } | null;
  currency: string;
  discountCents: number;
  promotionCodeId: string | null;
  subtotalCents: number;
  totalCents: number;
};

function required(name: string) {
  const value = process.env[name];
  if (!value || value.includes("REPLACE_WITH")) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function stripeHeaders(idempotencyKey?: string) {
  return {
    Authorization: `Bearer ${required("STRIPE_SECRET_KEY")}`,
    "Content-Type": "application/x-www-form-urlencoded",
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
  };
}

async function readStripeResponse<T>(response: Response) {
  const payload = (await response.json()) as T & StripeError;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Stripe request failed");
  }
  return payload;
}

export function getStripeBrowserConfig() {
  return {
    publishableKey: required("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
    priceCents: site.priceCents,
    currency: site.currency.toUpperCase(),
  };
}

async function retrieveCoupon(couponId: string) {
  const response = await fetch(
    `https://api.stripe.com/v1/coupons/${encodeURIComponent(couponId)}`,
    { headers: stripeHeaders() },
  );
  return readStripeResponse<StripeCoupon>(response);
}

async function resolvePromotionCode(code?: string) {
  const normalizedCode = code?.trim().toUpperCase();
  if (!normalizedCode) return null;

  const params = new URLSearchParams({
    code: normalizedCode,
    active: "true",
    limit: "10",
  });
  params.append("expand[]", "data.promotion.coupon");

  const response = await fetch(
    `https://api.stripe.com/v1/promotion_codes?${params.toString()}`,
    { headers: stripeHeaders() },
  );
  const payload = await readStripeResponse<StripePromotionCodeList>(response);
  const promotionCode = payload.data?.find(
    (item) => item.active && item.code.toUpperCase() === normalizedCode,
  );
  if (!promotionCode) {
    throw new Error("That discount code is not valid.");
  }

  const couponReference =
    promotionCode.coupon ?? promotionCode.promotion?.coupon;
  const coupon = typeof couponReference === "string"
    ? await retrieveCoupon(couponReference)
    : couponReference;
  if (!coupon || coupon.valid === false) {
    throw new Error("That discount code is no longer valid.");
  }

  return { promotionCode, coupon };
}

export async function quoteStripePayment(couponCode?: string): Promise<StripeQuote> {
  const promotion = await resolvePromotionCode(couponCode);
  let discountCents = 0;

  if (promotion?.coupon.percent_off) {
    discountCents = Math.round(
      site.priceCents * (promotion.coupon.percent_off / 100),
    );
  } else if (promotion?.coupon.amount_off) {
    if (
      promotion.coupon.currency &&
      promotion.coupon.currency.toLowerCase() !== site.currency.toLowerCase()
    ) {
      throw new Error("That discount code cannot be used for this currency.");
    }
    discountCents = promotion.coupon.amount_off;
  }

  discountCents = Math.min(site.priceCents, Math.max(0, discountCents));
  const normalizedCode = couponCode?.trim().toUpperCase() ?? "";

  return {
    subtotalCents: site.priceCents,
    discountCents,
    totalCents: site.priceCents - discountCents,
    currency: site.currency.toUpperCase(),
    coupon: promotion
      ? {
          code: normalizedCode,
          name: promotion.coupon.name || `${normalizedCode} promotion`,
        }
      : null,
    promotionCodeId: promotion?.promotionCode.id ?? null,
  };
}

export async function createStripePaymentIntent(input: {
  orderId: string;
  customerEmail: string;
  customerName: string;
  couponCode?: string;
}) {
  const quote = await quoteStripePayment(input.couponCode);
  if (quote.totalCents === 0) {
    return { paymentIntent: null, quote };
  }

  const params = new URLSearchParams();
  params.set("amount", String(quote.totalCents));
  params.set("currency", site.currency.toLowerCase());
  params.set("automatic_payment_methods[enabled]", "true");
  params.set("description", `Long Story Short novel manuscript ${input.orderId}`);
  params.set("receipt_email", input.customerEmail);
  params.set("metadata[order_id]", input.orderId);
  params.set("metadata[book_id]", input.orderId);
  params.set("metadata[customer_name]", input.customerName);
  params.set("metadata[brand]", site.name);
  if (quote.coupon) {
    params.set("metadata[promotion_code]", quote.coupon.code);
    params.set("metadata[stripe_promotion_code_id]", quote.promotionCodeId ?? "");
  }

  const couponKey = quote.coupon?.code ?? "standard";
  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: stripeHeaders(`lss-payment-${input.orderId}-${couponKey}`),
    body: params,
  });
  const paymentIntent = await readStripeResponse<StripePaymentIntent>(response);
  if (!paymentIntent.client_secret) {
    throw new Error("Stripe did not return secure payment details.");
  }
  return { paymentIntent, quote };
}

export async function retrieveStripePaymentIntent(paymentIntentId: string) {
  const params = new URLSearchParams();
  params.append("expand[]", "latest_charge");
  const response = await fetch(
    `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}?${params.toString()}`,
    { headers: stripeHeaders() },
  );
  return readStripeResponse<StripePaymentIntent>(response);
}

function parseStripeSignature(header: string | null) {
  if (!header) throw new Error("Missing Stripe signature");
  const parts = header.split(",").reduce<Record<string, string[]>>((acc, item) => {
    const [key, value] = item.split("=");
    if (!key || !value) return acc;
    acc[key] = [...(acc[key] ?? []), value];
    return acc;
  }, {});
  const timestamp = parts.t?.[0];
  const signatures = parts.v1 ?? [];
  if (!timestamp || signatures.length === 0) {
    throw new Error("Malformed Stripe signature");
  }
  return { timestamp, signatures };
}

async function hmacSha256Hex(secret: string, message: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export async function verifyStripeWebhook(request: Request, rawBody: string) {
  const secret = required("STRIPE_WEBHOOK_SECRET");
  const { timestamp, signatures } = parseStripeSignature(
    request.headers.get("stripe-signature"),
  );
  const timestampSeconds = Number(timestamp);
  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(Date.now() / 1000 - timestampSeconds) > 300
  ) {
    throw new Error("Stripe signature timestamp is outside the allowed window");
  }
  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  const valid = signatures.some((signature) => timingSafeEqual(signature, expected));
  if (!valid) throw new Error("Stripe signature verification failed");

  return JSON.parse(rawBody) as {
    type: string;
    data: { object: StripePaymentIntent };
  };
}
