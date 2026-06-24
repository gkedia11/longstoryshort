import { site } from "@/lib/site";
import { verifySquareWebhook } from "@/lib/server/square";
import { getStoryOrder, updateStoryOrder } from "@/lib/server/supabase";

async function sendToN8n(orderId: string, squarePaymentId: string) {
  const order = await getStoryOrder(orderId);
  if (!order) {
    throw new Error("Order not found for n8n delivery");
  }

  if (order.story_status === "sent_to_n8n") {
    return { duplicate: true };
  }

  const payload = {
    order_id: order.id,
    square_payment_id: squarePaymentId,
    user_id: order.user_id,
    name: order.name,
    email: order.email,
    genre: order.genre,
    summary: order.summary,
    paid_amount: site.priceCents,
    currency: site.currency,
    brand: site.name,
  };

  const url = process.env.N8N_WEBHOOK_URL || site.n8nUrl;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responseBody = await response.text();

  await updateStoryOrder(order.id, {
    story_status: response.ok ? "sent_to_n8n" : "failed",
    n8n_response: {
      ok: response.ok,
      status: response.status,
      body: responseBody.slice(0, 2000),
      at: new Date().toISOString(),
    },
  });

  if (!response.ok) {
    throw new Error(`n8n workflow failed with status ${response.status}`);
  }

  return { duplicate: false };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const notificationUrl =
    process.env.SQUARE_WEBHOOK_NOTIFICATION_URL ??
    `${new URL(request.url).origin.replace(/\/$/, "")}/api/square/webhook`;

  try {
    const event = await verifySquareWebhook(request, rawBody, notificationUrl);
    const eventType = event.type ?? "";

    if (!eventType.startsWith("payment.")) {
      return Response.json({ received: true, ignored: eventType });
    }

    const payment = event.data.object?.payment;
    const paymentId = payment?.id ?? event.data.id;
    if (!paymentId) {
      throw new Error("Square event is missing payment id");
    }

    const orderId = payment?.order_id;
    if (!orderId) {
      throw new Error("Square event is missing payment.order_id");
    }

    await updateStoryOrder(orderId, {
      stripe_checkout_session_id: paymentId,
      stripe_payment_status: "paid",
      story_status: "paid",
    });

    const n8nResult = await sendToN8n(orderId, paymentId);
    return Response.json({ received: true, n8n: n8nResult });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook could not be processed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
