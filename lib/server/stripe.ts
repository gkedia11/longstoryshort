import { site } from "@/lib/site";

type StripeCheckoutSession = {
  id: string;
  url: string | null;
  payment_status?: string;
  customer_email?: string | null;
  metadata?: Record<string, string>;
};

function required(name: string) {
  const value = process.env[name];
  if (!value || value.includes("REPLACE_WITH")) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export async function createCheckoutSession(input: {
  orderId: string;
  customerEmail: string;
  appUrl: string;
}) {
  const stripeSecretKey = required("STRIPE_SECRET_KEY");
  const stripePriceId = required("STRIPE_PRICE_ID");
  const params = new URLSearchParams();

  params.set("mode", "payment");
  params.set("success_url", `${input.appUrl}/payment/success?order_id=${input.orderId}`);
  params.set("cancel_url", `${input.appUrl}/payment/cancel?order_id=${input.orderId}`);
  params.set("allow_promotion_codes", "true");
  params.set("customer_email", input.customerEmail);
  params.set("client_reference_id", input.orderId);
  params.set("line_items[0][price]", stripePriceId);
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[order_id]", input.orderId);
  params.set("metadata[brand]", site.name);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const payload = (await response.json()) as StripeCheckoutSession & {
    error?: { message?: string };
  };

  if (!response.ok || !payload.url) {
    throw new Error(payload.error?.message ?? "Stripe checkout failed");
  }

  return payload;
}

function parseStripeSignature(header: string | null) {
  if (!header) {
    throw new Error("Missing Stripe signature");
  }

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
  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  const valid = signatures.some((signature) => timingSafeEqual(signature, expected));

  if (!valid) {
    throw new Error("Stripe signature verification failed");
  }

  return JSON.parse(rawBody) as {
    type: string;
    data: { object: StripeCheckoutSession };
  };
}
