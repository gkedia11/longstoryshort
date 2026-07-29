import {
  getStoryOrderForUser,
  getUserFromAuthorization,
  updateStoryOrder,
} from "@/lib/server/firebase";
import { checkRateLimit, getClientKey } from "@/lib/server/rate-limit";
import { createStripePaymentIntent } from "@/lib/server/stripe";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`stripe-intent:${getClientKey(request)}`, 8);
  if (!rateLimit.ok) {
    return Response.json({ error: "Too many payment attempts." }, { status: 429 });
  }

  try {
    const user = await getUserFromAuthorization(
      request.headers.get("authorization"),
    );
    const body = (await request.json()) as {
      order_id?: string;
      coupon_code?: string;
    };
    if (!body.order_id) {
      return Response.json({ error: "Order is required." }, { status: 400 });
    }

    const order = await getStoryOrderForUser(body.order_id, user.id);
    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.stripe_payment_status === "paid") {
      return Response.json({ error: "This order is already paid." }, { status: 409 });
    }

    const result = await createStripePaymentIntent({
      orderId: order.id,
      customerEmail: order.email,
      customerName: order.name,
      couponCode: body.coupon_code,
    });

    if (result.paymentIntent) {
      await updateStoryOrder(order.id, {
        stripe_checkout_session_id: result.paymentIntent.id,
        stripe_payment_status: result.paymentIntent.status,
        story_status: "pending_payment",
        updated_at: new Date().toISOString(),
      });
    }

    return Response.json({
      client_secret: result.paymentIntent?.client_secret ?? null,
      payment_intent_id: result.paymentIntent?.id ?? null,
      quote: result.quote,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("Stripe Payment Intent creation failed", error);
    return Response.json(
      {
        error: message.toLowerCase().includes("discount code")
          ? message
          : "Secure payment could not be prepared. Please try again.",
      },
      { status: 400 },
    );
  }
}
