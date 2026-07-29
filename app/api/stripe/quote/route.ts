import {
  getStoryOrderForUser,
  getUserFromAuthorization,
} from "@/lib/server/firebase";
import { checkRateLimit, getClientKey } from "@/lib/server/rate-limit";
import { quoteStripePayment } from "@/lib/server/stripe";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`stripe-quote:${getClientKey(request)}`, 12);
  if (!rateLimit.ok) {
    return Response.json({ error: "Too many discount attempts." }, { status: 429 });
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
    return Response.json(await quoteStripePayment(body.coupon_code));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("Stripe quote failed", error);
    return Response.json(
      {
        error: message.toLowerCase().includes("discount code")
          ? message
          : "The discount could not be applied.",
      },
      { status: 400 },
    );
  }
}
