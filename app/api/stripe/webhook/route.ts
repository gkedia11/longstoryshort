import { getStoryOrder, updateStoryOrder } from "@/lib/server/firebase";
import { sendStoryOrderToN8n } from "@/lib/server/n8n";
import {
  retrieveStripePaymentIntent,
  verifyStripeWebhook,
} from "@/lib/server/stripe";

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    const event = await verifyStripeWebhook(request, rawBody);
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.order_id;

    if (!orderId) {
      return Response.json({ received: true, ignored: event.type });
    }
    const order = await getStoryOrder(orderId);
    if (!order) throw new Error("Order not found for Stripe payment");

    if (event.type === "payment_intent.payment_failed") {
      await updateStoryOrder(order.id, {
      stripe_checkout_session_id: paymentIntent.id,
      stripe_payment_intent_id: paymentIntent.id,
        stripe_payment_status: "failed",
        story_status: "pending_payment",
        updated_at: new Date().toISOString(),
      });
      return Response.json({ received: true });
    }

    if (event.type !== "payment_intent.succeeded") {
      return Response.json({ received: true, ignored: event.type });
    }

    const expanded = await retrieveStripePaymentIntent(paymentIntent.id);
    const charge = typeof expanded.latest_charge === "object"
      ? expanded.latest_charge
      : null;
    await updateStoryOrder(order.id, {
      stripe_checkout_session_id: expanded.id,
      stripe_payment_intent_id: expanded.id,
      stripe_payment_status: "paid",
      story_status: "submitted",
      payment_receipt_url: charge?.receipt_url ?? null,
      updated_at: new Date().toISOString(),
    });

    await sendStoryOrderToN8n(order.id, expanded.id, {
      amountCents: expanded.amount,
      receiptUrl: charge?.receipt_url ?? undefined,
      stripePaymentIntentId: expanded.id,
    });
    return Response.json({ received: true });
  } catch (error) {
    console.error("Stripe payment notification failed", error);
    return Response.json(
      { error: "Payment notification could not be processed." },
      { status: 400 },
    );
  }
}
