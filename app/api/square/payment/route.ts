import { getStoryOrderForUser, getUserFromAuthorization, updateStoryOrder } from "@/lib/server/firebase";
import { sendStoryOrderToN8n } from "@/lib/server/n8n";
import { checkRateLimit, getClientKey } from "@/lib/server/rate-limit";
import {
  createSquareCardPayment,
  createSquareOrder,
  settleZeroSquareOrder,
} from "@/lib/server/square";

function customerMessage(error: unknown) {
  const detail = error instanceof Error ? error.message : "";
  if (detail.toLowerCase().includes("discount")) return detail;
  if (detail.toLowerCase().includes("card")) {
    return "The card could not be charged. Check the details or try another card.";
  }
  return "Payment could not be completed. Please try again.";
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`square-payment:${getClientKey(request)}`, 6);
  if (!rateLimit.ok) {
    return Response.json({ error: "Too many payment attempts. Please wait a moment." }, { status: 429 });
  }

  try {
    const user = await getUserFromAuthorization(request.headers.get("authorization"));
    const body = (await request.json()) as {
      order_id?: string;
      source_id?: string;
      coupon_code?: string;
    };
    if (!body.order_id) {
      return Response.json({ error: "Order is required." }, { status: 400 });
    }

    const storyOrder = await getStoryOrderForUser(body.order_id, user.id);
    if (!storyOrder) return Response.json({ error: "Order not found." }, { status: 404 });
    if (
      storyOrder.stripe_payment_status === "paid" ||
      storyOrder.story_status === "submitted" ||
      storyOrder.story_status === "sent_to_n8n"
    ) {
      return Response.json({ error: "This order has already been submitted." }, { status: 409 });
    }

    const squareOrder = await createSquareOrder({
      storyOrderId: storyOrder.id,
      couponCode: body.coupon_code,
    });
    const totalCents = squareOrder.total_money?.amount;
    if (typeof totalCents !== "number") throw new Error("Square order total is missing");

    let paymentId = `discounted-${squareOrder.id}`;
    let receiptUrl: string | undefined;
    let lastFour: string | undefined;

    if (totalCents === 0) {
      await settleZeroSquareOrder(squareOrder.id);
    } else {
      if (!body.source_id) {
        return Response.json({ error: "Card details are required." }, { status: 400 });
      }
      const payment = await createSquareCardPayment({
        sourceId: body.source_id,
        squareOrderId: squareOrder.id,
        storyOrderId: storyOrder.id,
        amountCents: totalCents,
        customerEmail: storyOrder.email,
      });
      paymentId = payment.id;
      receiptUrl = payment.receipt_url;
      lastFour = payment.card_details?.card?.last_4;
    }

    await updateStoryOrder(storyOrder.id, {
      stripe_checkout_session_id: squareOrder.id,
      stripe_payment_status: "paid",
      square_payment_id: paymentId,
      square_receipt_url: receiptUrl ?? null,
      story_status: "submitted",
      updated_at: new Date().toISOString(),
    });

    try {
      await sendStoryOrderToN8n(storyOrder.id, paymentId, {
        amountCents: totalCents,
        receiptUrl,
        squareOrderId: squareOrder.id,
      });
    } catch (error) {
      console.error("Paid order submission needs retry", error);
    }

    return Response.json({
      success: true,
      status: "submitted",
      total_cents: totalCents,
      receipt_url: receiptUrl ?? null,
      card_last_four: lastFour ?? null,
    });
  } catch (error) {
    console.error("Square card payment failed", error);
    return Response.json({ error: customerMessage(error) }, { status: 400 });
  }
}
