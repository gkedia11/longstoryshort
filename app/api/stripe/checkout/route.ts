import { checkRateLimit, getClientKey } from "@/lib/server/rate-limit";
import { createCheckoutSession } from "@/lib/server/stripe";
import { createSquarePaymentLink, isSquareConfigured } from "@/lib/server/square";
import {
  getStoryOrderForUser,
  getUserFromAuthorization,
  updateStoryOrder,
} from "@/lib/server/supabase";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`checkout:${getClientKey(request)}`, 8);
  if (!rateLimit.ok) {
    return Response.json({ error: "Too many checkout attempts." }, { status: 429 });
  }

  try {
    const authorization = request.headers.get("authorization");
    const user = await getUserFromAuthorization(authorization);
    const body = (await request.json()) as { order_id?: string };
    if (!body.order_id) {
      return Response.json({ error: "order_id is required." }, { status: 400 });
    }

    const order = await getStoryOrderForUser(body.order_id, authorization ?? "");
    if (!order || order.user_id !== user.id) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.story_status === "sent_to_n8n") {
      return Response.json(
        { error: "This order has already been sent to the manuscript workflow." },
        { status: 409 },
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      new URL(request.url).origin.replace(/\/$/, "");
    if (isSquareConfigured()) {
      const checkout = await createSquarePaymentLink({
        orderId: order.id,
        customerEmail: order.email,
        appUrl,
      });

      await updateStoryOrder(order.id, {
        stripe_checkout_session_id: checkout.id,
        stripe_payment_status: checkout.payment_status,
        story_status: "pending_payment",
      });

      return Response.json({ checkout_url: checkout.url });
    }

    const checkout = await createCheckoutSession({
      orderId: order.id,
      customerEmail: order.email,
      appUrl,
    });

    await updateStoryOrder(order.id, {
      stripe_checkout_session_id: checkout.id,
      stripe_payment_status: checkout.payment_status ?? "unpaid",
      story_status: "pending_payment",
    });

    return Response.json({ checkout_url: checkout.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout could not be created.";
    return Response.json({ error: message }, { status: 500 });
  }
}
