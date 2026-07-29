import {
  getStoryOrderForUser,
  getUserFromAuthorization,
  updateStoryOrder,
} from "@/lib/server/firebase";
import { sendStoryOrderToN8n } from "@/lib/server/n8n";
import { retrieveStripePaymentIntent } from "@/lib/server/stripe";

export async function POST(request: Request) {
  try {
    const user = await getUserFromAuthorization(
      request.headers.get("authorization"),
    );
    const body = (await request.json()) as {
      order_id?: string;
      payment_intent_id?: string;
    };
    if (!body.order_id || !body.payment_intent_id) {
      return Response.json({ error: "Payment details are required." }, { status: 400 });
    }

    const order = await getStoryOrderForUser(body.order_id, user.id);
    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    const paymentIntent = await retrieveStripePaymentIntent(
      body.payment_intent_id,
    );
    if (
      paymentIntent.status !== "succeeded" ||
      paymentIntent.metadata?.order_id !== order.id
    ) {
      return Response.json(
        { error: "Stripe has not confirmed this payment." },
        { status: 409 },
      );
    }

    const charge = typeof paymentIntent.latest_charge === "object"
      ? paymentIntent.latest_charge
      : null;
    await updateStoryOrder(order.id, {
      stripe_checkout_session_id: paymentIntent.id,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_payment_status: "paid",
      story_status: "submitted",
      payment_receipt_url: charge?.receipt_url ?? null,
      updated_at: new Date().toISOString(),
    });

    try {
      await sendStoryOrderToN8n(order.id, paymentIntent.id, {
        amountCents: paymentIntent.amount,
        receiptUrl: charge?.receipt_url ?? undefined,
        stripePaymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Paid Stripe order submission needs retry", error);
    }

    return Response.json({
      success: true,
      receipt_url: charge?.receipt_url ?? null,
      status: "submitted",
      total_cents: paymentIntent.amount,
    });
  } catch (error) {
    console.error("Stripe payment finalization failed", error);
    return Response.json(
      { error: "Payment confirmation could not be completed." },
      { status: 400 },
    );
  }
}
