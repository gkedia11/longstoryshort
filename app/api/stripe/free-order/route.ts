import {
  getStoryOrderForUser,
  getUserFromAuthorization,
  updateStoryOrder,
} from "@/lib/server/firebase";
import { sendStoryOrderToN8n } from "@/lib/server/n8n";
import { quoteStripePayment } from "@/lib/server/stripe";

export async function POST(request: Request) {
  try {
    const user = await getUserFromAuthorization(
      request.headers.get("authorization"),
    );
    const body = (await request.json()) as {
      order_id?: string;
      coupon_code?: string;
    };
    if (!body.order_id || !body.coupon_code) {
      return Response.json({ error: "A discount code is required." }, { status: 400 });
    }
    const order = await getStoryOrderForUser(body.order_id, user.id);
    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.stripe_payment_status === "paid") {
      return Response.json({ error: "This order is already submitted." }, { status: 409 });
    }

    const quote = await quoteStripePayment(body.coupon_code);
    if (quote.totalCents !== 0 || !quote.coupon) {
      return Response.json(
        { error: "That discount does not cover the full order." },
        { status: 400 },
      );
    }

    const reference = `promo-${quote.coupon.code}-${order.id}`;
    await updateStoryOrder(order.id, {
      stripe_checkout_session_id: reference,
      stripe_payment_status: "paid",
      story_status: "submitted",
      updated_at: new Date().toISOString(),
    });

    try {
      await sendStoryOrderToN8n(order.id, reference, {
        amountCents: 0,
        stripePaymentIntentId: reference,
      });
    } catch (error) {
      console.error("Promotional order submission needs retry", error);
    }

    return Response.json({
      success: true,
      receipt_url: null,
      status: "submitted",
      total_cents: 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("Stripe promotional order failed", error);
    return Response.json(
      {
        error: message.toLowerCase().includes("discount")
          ? message
          : "The promotional order could not be completed.",
      },
      { status: 400 },
    );
  }
}
