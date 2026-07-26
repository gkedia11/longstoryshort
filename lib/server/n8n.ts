import { site } from "@/lib/site";
import { getStoryOrder, updateStoryOrder } from "@/lib/server/firebase";

type PaymentDetails = {
  amountCents?: number;
  receiptUrl?: string;
  squareOrderId?: string;
};

export async function sendStoryOrderToN8n(
  orderId: string,
  paymentId: string,
  paymentDetails: PaymentDetails = {},
) {
  const order = await getStoryOrder(orderId);
  if (!order) throw new Error("Order not found for n8n delivery");

  const priorResponse = order.n8n_response as { ok?: boolean } | null;
  if (order.story_status === "sent_to_n8n" || priorResponse?.ok) {
    return { duplicate: true };
  }

  const paidAmount = paymentDetails.amountCents ?? site.priceCents;
  const payload = {
    event_type: "payment_completed",
    order_id: order.id,
    book_id: order.id,
    square_order_id: paymentDetails.squareOrderId ?? order.stripe_checkout_session_id,
    square_payment_id: paymentId,
    square_receipt_url: paymentDetails.receiptUrl ?? order.square_receipt_url ?? null,
    user_id: order.user_id,
    name: order.name,
    email: order.email,
    genre: order.genre,
    summary: order.summary,
    paid_amount: paidAmount,
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
    story_status: "submitted",
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
