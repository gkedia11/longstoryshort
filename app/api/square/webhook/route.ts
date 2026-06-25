import { sendStoryOrderToN8n } from "@/lib/server/n8n";
import { verifySquareWebhook } from "@/lib/server/square";
import {
  getStoryOrder,
  getStoryOrderByCheckoutId,
  updateStoryOrder,
} from "@/lib/server/supabase";

function getStoryOrderIdFromNote(note?: string) {
  return note?.match(/story_order_id=([^;\s]+)/)?.[1] ?? null;
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

    if (payment?.status && payment.status !== "COMPLETED") {
      return Response.json({
        received: true,
        ignored: `${eventType}:${payment.status}`,
      });
    }

    const squareOrderId = payment?.order_id;
    if (!squareOrderId) {
      throw new Error("Square event is missing payment.order_id");
    }

    const storyOrderId = getStoryOrderIdFromNote(payment?.note);
    const order =
      (await getStoryOrderByCheckoutId(squareOrderId)) ??
      (storyOrderId ? await getStoryOrder(storyOrderId) : null);
    if (!order) {
      throw new Error("Story order not found for Square payment");
    }

    await updateStoryOrder(order.id, {
      stripe_checkout_session_id: squareOrderId,
      stripe_payment_status: "paid",
      story_status: "paid",
    });

    const n8nResult = await sendStoryOrderToN8n(order.id, paymentId);
    return Response.json({ received: true, n8n: n8nResult });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook could not be processed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
