import { sendStoryOrderToN8n } from "@/lib/server/n8n";
import { isSquareOrderPaid, retrieveSquareOrder } from "@/lib/server/square";
import {
  getStoryOrderForUser,
  getUserFromAuthorization,
  updateStoryOrder,
} from "@/lib/server/supabase";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const user = await getUserFromAuthorization(authorization);
    const body = (await request.json()) as { order_id?: string };
    if (!body.order_id) {
      return Response.json({ error: "order_id is required." }, { status: 400 });
    }

    const order = await getStoryOrderForUser(body.order_id, user.id);
    if (!order || order.user_id !== user.id) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.story_status === "sent_to_n8n") {
      return Response.json({ status: "being_written" });
    }

    const squareOrderId = order.stripe_checkout_session_id;
    if (!squareOrderId) {
      return Response.json(
        { status: "pending_payment", error: "No checkout has been started." },
        { status: 409 },
      );
    }

    const squareOrder = await retrieveSquareOrder(squareOrderId);
    if (!isSquareOrderPaid(squareOrder)) {
      return Response.json({ status: "pending_payment" });
    }

    await updateStoryOrder(order.id, {
      stripe_payment_status: "paid",
      story_status: "paid",
    });

    const tenderPaymentId = squareOrder.tenders?.find((tender) => tender.payment_id)
      ?.payment_id;
    await sendStoryOrderToN8n(
      order.id,
      tenderPaymentId ?? `square-order-${squareOrder.id}`,
    );

    return Response.json({ status: "being_written" });
  } catch (error) {
    console.error("Payment reconciliation failed", error);
    return Response.json(
      { error: "Payment confirmation is taking longer than expected." },
      { status: 500 },
    );
  }
}
