import { site } from "@/lib/site";

const SQUARE_VERSION = "2026-07-15";

type SquareError = { detail?: string; code?: string };

type SquarePaymentLinkResponse = {
  payment_link?: {
    id: string;
    order_id?: string;
    url?: string;
    long_url?: string;
  };
  errors?: SquareError[];
};

export type SquareOrder = {
  id: string;
  version?: number;
  state?: string;
  total_money?: { amount?: number; currency?: string };
  net_amount_due_money?: { amount?: number; currency?: string };
  tenders?: Array<{
    id?: string;
    payment_id?: string;
    amount_money?: { amount?: number; currency?: string };
  }>;
};

type SquarePayment = {
  id: string;
  status?: string;
  order_id?: string;
  receipt_url?: string;
  receipt_number?: string;
  amount_money?: { amount?: number; currency?: string };
  card_details?: {
    card?: { last_4?: string; card_brand?: string };
  };
};

type SquareOrderResponse = {
  order?: SquareOrder;
  errors?: SquareError[];
};

type SquarePaymentResponse = {
  payment?: SquarePayment;
  errors?: SquareError[];
};

type SquareDiscount = {
  code: string;
  name: string;
  percentage?: number;
  amountCents?: number;
};

type SquareCatalogResponse = {
  objects?: Array<{
    type?: string;
    discount_data?: {
      name?: string;
      percentage?: string;
      amount_money?: { amount?: number; currency?: string };
    };
  }>;
  cursor?: string;
  errors?: SquareError[];
};

function required(name: string) {
  const value = process.env[name];
  if (!value || value.includes("REPLACE_WITH")) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function squareHeaders() {
  return {
    Authorization: `Bearer ${required("SQUARE_ACCESS_TOKEN")}`,
    "Content-Type": "application/json",
    "Square-Version": SQUARE_VERSION,
  };
}

export function getSquareConfigError() {
  const missing = [
    "SQUARE_APPLICATION_ID",
    "SQUARE_ACCESS_TOKEN",
    "SQUARE_LOCATION_ID",
  ].filter((name) => {
    const value = process.env[name];
    return !value || value.includes("REPLACE_WITH");
  });

  return missing.length ? `${missing[0]} is not configured` : null;
}

export function isSquareConfigured() {
  return getSquareConfigError() === null;
}

export function getSquareBrowserConfig() {
  return {
    applicationId: required("SQUARE_APPLICATION_ID"),
    locationId: required("SQUARE_LOCATION_ID"),
    priceCents: site.priceCents,
    currency: site.currency.toUpperCase(),
  };
}

function parsePrivateCoupons(): Record<string, SquareDiscount> {
  const raw = process.env.SQUARE_COUPONS_JSON;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<
      string,
      number | { percentage?: number; amount_cents?: number; name?: string }
    >;
    const coupons: Record<string, SquareDiscount> = {};

    for (const [rawCode, value] of Object.entries(parsed)) {
      const code = rawCode.trim().toUpperCase();
      if (!code) continue;
      if (typeof value === "number") {
        coupons[code] = {
          code,
          name: code,
          percentage: Math.max(0, Math.min(100, value)),
        };
        continue;
      }

      const percentage = typeof value.percentage === "number"
        ? Math.max(0, Math.min(100, value.percentage))
        : undefined;
      const amountCents = typeof value.amount_cents === "number"
        ? Math.max(0, Math.round(value.amount_cents))
        : undefined;
      if (percentage === undefined && amountCents === undefined) continue;
      coupons[code] = {
        code,
        name: value.name?.trim() || code,
        percentage,
        amountCents,
      };
    }

    return coupons;
  } catch {
    throw new Error("SQUARE_COUPONS_JSON is not valid JSON");
  }
}

async function findCatalogDiscount(code: string): Promise<SquareDiscount | null> {
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({ types: "DISCOUNT" });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(
      `https://connect.squareup.com/v2/catalog/list?${params.toString()}`,
      { headers: squareHeaders() },
    );
    const payload = (await response.json()) as SquareCatalogResponse;
    if (!response.ok) {
      throw new Error(payload.errors?.[0]?.detail ?? "Square discount lookup failed");
    }

    const match = payload.objects?.find((object) =>
      object.type === "DISCOUNT" &&
      object.discount_data?.name?.trim().toUpperCase() === code
    );
    if (match?.discount_data) {
      const percentage = Number.parseFloat(match.discount_data.percentage ?? "");
      const amount = match.discount_data.amount_money?.amount;
      if (Number.isFinite(percentage)) {
        return {
          code,
          name: match.discount_data.name ?? code,
          percentage: Math.max(0, Math.min(100, percentage)),
        };
      }
      if (typeof amount === "number") {
        return {
          code,
          name: match.discount_data.name ?? code,
          amountCents: Math.max(0, amount),
        };
      }
      throw new Error("This Square discount needs a fixed percentage or amount.");
    }

    cursor = payload.cursor;
  } while (cursor);

  return null;
}

export async function resolveSquareCoupon(couponCode?: string) {
  const code = couponCode?.trim().toUpperCase();
  if (!code) return null;
  return parsePrivateCoupons()[code] ?? findCatalogDiscount(code);
}

export async function quoteSquarePayment(couponCode?: string) {
  const coupon = await resolveSquareCoupon(couponCode);
  if (couponCode?.trim() && !coupon) {
    throw new Error("That discount code is not valid.");
  }

  const discountCents = coupon?.percentage !== undefined
    ? Math.round(site.priceCents * (coupon.percentage / 100))
    : Math.min(site.priceCents, coupon?.amountCents ?? 0);

  return {
    subtotalCents: site.priceCents,
    discountCents,
    totalCents: Math.max(0, site.priceCents - discountCents),
    currency: site.currency.toUpperCase(),
    coupon: coupon ? { code: coupon.code, name: coupon.name } : null,
  };
}

export async function createSquareOrder(input: {
  storyOrderId: string;
  couponCode?: string;
}) {
  const coupon = await resolveSquareCoupon(input.couponCode);
  if (input.couponCode?.trim() && !coupon) {
    throw new Error("That discount code is not valid.");
  }

  const discounts = coupon
    ? [{
        uid: "customer-discount",
        name: coupon.name,
        scope: "ORDER",
        ...(coupon.percentage !== undefined
          ? { percentage: String(coupon.percentage) }
          : {
              amount_money: {
                amount: Math.min(site.priceCents, coupon.amountCents ?? 0),
                currency: site.currency.toUpperCase(),
              },
            }),
      }]
    : undefined;

  const response = await fetch("https://connect.squareup.com/v2/orders", {
    method: "POST",
    headers: squareHeaders(),
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      order: {
        location_id: required("SQUARE_LOCATION_ID"),
        reference_id: input.storyOrderId,
        source: { name: site.name },
        line_items: [{
          name: "Complete novel manuscript",
          quantity: "1",
          base_price_money: {
            amount: site.priceCents,
            currency: site.currency.toUpperCase(),
          },
        }],
        discounts,
      },
    }),
  });
  const payload = (await response.json()) as SquareOrderResponse;
  if (!response.ok || !payload.order) {
    throw new Error(payload.errors?.[0]?.detail ?? "Square order could not be created");
  }
  return payload.order;
}

export async function createSquareCardPayment(input: {
  sourceId: string;
  squareOrderId: string;
  storyOrderId: string;
  amountCents: number;
  customerEmail: string;
}) {
  const response = await fetch("https://connect.squareup.com/v2/payments", {
    method: "POST",
    headers: squareHeaders(),
    body: JSON.stringify({
      source_id: input.sourceId,
      idempotency_key: crypto.randomUUID(),
      amount_money: {
        amount: input.amountCents,
        currency: site.currency.toUpperCase(),
      },
      autocomplete: true,
      location_id: required("SQUARE_LOCATION_ID"),
      order_id: input.squareOrderId,
      reference_id: input.storyOrderId,
      buyer_email_address: input.customerEmail,
      note: `story_order_id=${input.storyOrderId}`,
    }),
  });
  const payload = (await response.json()) as SquarePaymentResponse;
  if (!response.ok || !payload.payment || payload.payment.status !== "COMPLETED") {
    throw new Error(payload.errors?.[0]?.detail ?? "The card payment was not completed");
  }
  return payload.payment;
}

export async function settleZeroSquareOrder(squareOrderId: string) {
  const response = await fetch(
    `https://connect.squareup.com/v2/orders/${encodeURIComponent(squareOrderId)}/pay`,
    {
      method: "POST",
      headers: squareHeaders(),
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        payment_ids: [],
      }),
    },
  );
  const payload = (await response.json()) as SquareOrderResponse;
  if (!response.ok || !payload.order) {
    throw new Error(payload.errors?.[0]?.detail ?? "The discounted order could not be completed");
  }
  return payload.order;
}

export async function createSquarePaymentLink(input: {
  orderId: string;
  appUrl: string;
  customerEmail: string;
}) {
  const locationId = required("SQUARE_LOCATION_ID");
  const applicationId = required("SQUARE_APPLICATION_ID");
  const body = {
    idempotency_key: `${input.orderId}-${crypto.randomUUID()}`,
    quick_pay: {
      name: `${site.name} order`,
      price_money: {
        amount: site.priceCents,
        currency: site.currency.toUpperCase(),
      },
      location_id: locationId,
    },
    checkout_options: {
      redirect_url: `${input.appUrl}/payment/success?order_id=${input.orderId}`,
      ask_for_shipping_address: false,
      enable_coupon: true,
      merchant_support_email: site.supportEmail,
    },
    pre_populated_data: { buyer_email: input.customerEmail },
    description: `Longstory Short Story novel manuscript order ${input.orderId}`,
    payment_note: `story_order_id=${input.orderId}; application_id=${applicationId}`,
  };

  const response = await fetch(
    "https://connect.squareup.com/v2/online-checkout/payment-links",
    { method: "POST", headers: squareHeaders(), body: JSON.stringify(body) },
  );
  const payload = (await response.json()) as SquarePaymentLinkResponse;
  if (!response.ok || !payload.payment_link?.url) {
    throw new Error(payload.errors?.[0]?.detail ?? "Square checkout failed");
  }

  return {
    id: payload.payment_link.order_id ?? payload.payment_link.id,
    paymentLinkId: payload.payment_link.id,
    url: payload.payment_link.url,
    payment_status: "pending",
  };
}

export async function retrieveSquareOrder(squareOrderId: string) {
  const response = await fetch(
    `https://connect.squareup.com/v2/orders/${encodeURIComponent(squareOrderId)}`,
    { headers: squareHeaders() },
  );
  const payload = (await response.json()) as SquareOrderResponse;
  if (!response.ok || !payload.order) {
    throw new Error(payload.errors?.[0]?.detail ?? "Square order lookup failed");
  }
  return payload.order;
}

export function isSquareOrderPaid(order: SquareOrder) {
  const netDue = order.net_amount_due_money?.amount;
  const hasTender = Boolean(order.tenders?.some((tender) => tender.payment_id));
  const isClosedEnough = order.state === "OPEN" || order.state === "COMPLETED";
  return hasTender || (isClosedEnough && netDue === 0);
}

function parseSquareSignature(
  signature: string | null,
  notificationUrl: string,
  rawBody: string,
) {
  if (!signature) return false;
  const secret = required("SQUARE_WEBHOOK_SIGNATURE_KEY");
  const normalizedSecret = secret.replace(/-/g, "+").replace(/_/g, "/");
  const binarySecret = typeof atob === "function"
    ? atob(normalizedSecret)
    : Buffer.from(normalizedSecret, "base64").toString("binary");
  const encoder = new TextEncoder();

  return crypto.subtle
    .importKey(
      "raw",
      encoder.encode(binarySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    )
    .then((key) =>
      crypto.subtle.sign("HMAC", key, encoder.encode(notificationUrl + rawBody)),
    )
    .then((buffer) => {
      const expected = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      return timingSafeEqual(signature, expected);
    });
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export async function verifySquareWebhook(
  request: Request,
  rawBody: string,
  notificationUrl: string,
) {
  const signature = request.headers.get("x-square-hmacsha256-signature") ||
    request.headers.get("X-Square-HmacSha256-Signature");
  const valid = await parseSquareSignature(signature, notificationUrl, rawBody);
  if (!valid) throw new Error("Square signature verification failed");

  return JSON.parse(rawBody) as {
    type: string;
    event_id: string;
    data: {
      id?: string;
      object?: {
        payment?: {
          id?: string;
          order_id?: string;
          status?: string;
          note?: string;
        };
      };
    };
  };
}
