import { site } from "@/lib/site";
import { getStoryOrder, updateStoryOrder } from "@/lib/server/supabase";

export async function sendStoryOrderToN8n(orderId: string, paymentId: string) {
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
    square_payment_id: paymentId,
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
