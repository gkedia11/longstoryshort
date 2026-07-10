import { site } from "@/lib/site";

type SquarePaymentLinkResponse = {
  payment_link?: {
    id: string;
    order_id?: string;
    url?: string;
    long_url?: string;
  };
  errors?: Array<{ detail?: string; code?: string }>;
};

export type SquareOrder = {
  id: string;
  state?: string;
  total_money?: { amount?: number; currency?: string };
  net_amount_due_money?: { amount?: number; currency?: string };
  tenders?: Array<{
    id?: string;
    payment_id?: string;
    amount_money?: { amount?: number; currency?: string };
  }>;
};

type SquareOrderResponse = {
  order?: SquareOrder;
  errors?: Array<{ detail?: string; code?: string }>;
};

function required(name: string) {
  const value = process.env[name];
  if (!value || value.includes("REPLACE_WITH")) {
    throw new Error(`${name} is not configured`);
  }
  return value;
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

export async function createSquarePaymentLink(input: {
  orderId: string;
  appUrl: string;
  customerEmail: string;
}) {
  const accessToken = required("SQUARE_ACCESS_TOKEN");
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
    },
    pre_populated_data: {
      buyer_email: input.customerEmail,
    },
    description: `Longstory Short Story novel manuscript order ${input.orderId}`,
    payment_note: `story_order_id=${input.orderId}; application_id=${applicationId}`,
  };

  const response = await fetch(
    "https://connect.squareup.com/v2/online-checkout/payment-links",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": "2025-06-18",
      },
      body: JSON.stringify(body),
    },
  );

  const payload = (await response.json()) as SquarePaymentLinkResponse;

  if (!response.ok || !payload.payment_link?.url) {
    const detail = payload.errors?.[0]?.detail ?? "Square checkout failed";
    throw new Error(detail);
  }

  return {
    id: payload.payment_link.order_id ?? payload.payment_link.id,
    paymentLinkId: payload.payment_link.id,
    url: payload.payment_link.url,
    payment_status: "pending",
  };
}

export async function retrieveSquareOrder(squareOrderId: string) {
  const accessToken = required("SQUARE_ACCESS_TOKEN");
  const response = await fetch(
    `https://connect.squareup.com/v2/orders/${encodeURIComponent(squareOrderId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": "2025-06-18",
      },
    },
  );
  const payload = (await response.json()) as SquareOrderResponse;

  if (!response.ok || !payload.order) {
    const detail = payload.errors?.[0]?.detail ?? "Square order lookup failed";
    throw new Error(detail);
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
  const binarySecret =
    typeof atob === "function" ? atob(normalizedSecret) : Buffer.from(normalizedSecret, "base64").toString("binary");
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
  const signature =
    request.headers.get("x-square-hmacsha256-signature") ||
    request.headers.get("X-Square-HmacSha256-Signature");
  const valid = await parseSquareSignature(signature, notificationUrl, rawBody);

  if (!valid) {
    throw new Error("Square signature verification failed");
  }

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
