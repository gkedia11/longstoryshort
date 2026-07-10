import { site } from "@/lib/site";
import { verifyStripeWebhook } from "@/lib/server/stripe";
import { getStoryOrder, updateStoryOrder } from "@/lib/server/supabase";

async function sendToN8n(orderId: string, stripeSessionId: string) {
  const order = await getStoryOrder(orderId);
  if (!order) {
    throw new Error("Order not found for n8n delivery");
  }

  if (order.story_status === "sent_to_n8n") {
    return { duplicate: true };
  }

  const payload = {
    order_id: order.id,
    book_id: order.id,
    stripe_checkout_session_id: stripeSessionId,
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

  try {
    const event = await verifyStripeWebhook(request, rawBody);

    if (event.type !== "checkout.session.completed") {
      return Response.json({ received: true, ignored: event.type });
    }

    const session = event.data.object;
    const orderId = session.metadata?.order_id;
    if (!orderId) {
      throw new Error("Stripe session is missing metadata.order_id");
    }

    await updateStoryOrder(orderId, {
      stripe_checkout_session_id: session.id,
      stripe_payment_status: session.payment_status ?? "paid",
      story_status: session.payment_status === "paid" ? "paid" : "pending_payment",
    });

    if (session.payment_status !== "paid") {
      return Response.json({ received: true, waiting_for_payment: true });
    }

    await sendToN8n(orderId, session.id);
    return Response.json({ received: true });
  } catch (error) {
    console.error("Legacy payment notification failed", error);
    return Response.json({ error: "Payment notification could not be processed." }, { status: 400 });
  }
}
