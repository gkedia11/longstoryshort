import { getStoryOrderForUser, getUserFromAuthorization } from "@/lib/server/firebase";
import { quoteSquarePayment } from "@/lib/server/square";
import { checkRateLimit, getClientKey } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`square-quote:${getClientKey(request)}`, 12);
  if (!rateLimit.ok) {
    return Response.json({ error: "Too many attempts. Please wait a moment." }, { status: 429 });
  }

  try {
    const user = await getUserFromAuthorization(request.headers.get("authorization"));
    const body = (await request.json()) as { order_id?: string; coupon_code?: string };
    if (!body.order_id) {
      return Response.json({ error: "Order is required." }, { status: 400 });
    }

    const order = await getStoryOrderForUser(body.order_id, user.id);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    if (order.stripe_payment_status === "paid") {
      return Response.json({ error: "This order is already paid." }, { status: 409 });
    }

    const quote = await quoteSquarePayment(body.coupon_code);
    return Response.json(quote);
  } catch (error) {
    console.error("Square quote failed", error);
    const message = error instanceof Error && error.message.includes("discount")
      ? error.message
      : "We could not apply that discount code.";
    return Response.json({ error: message }, { status: 400 });
  }
}
