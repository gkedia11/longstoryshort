import {
  findStoryOrderByCheckoutId,
  getStoryOrderDocument,
  patchStoryOrderDocument,
  verifyFirebaseAuthorization,
} from "@/lib/server/firestore-rest";

export type StoryOrder = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  genre: string;
  summary: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_status: string | null;
  story_status: "draft" | "pending_payment" | "paid" | "submitted" | "sent_to_n8n" | "failed";
  payment_receipt_url?: string | null;
  stripe_payment_intent_id?: string | null;
  n8n_response: unknown | null;
  created_at: string;
  updated_at: string;
};

export async function getUserFromAuthorization(authorization: string | null) {
  return verifyFirebaseAuthorization(authorization);
}

function normalizeOrder(data: Record<string, unknown> | null): StoryOrder | null {
  return data as StoryOrder | null;
}

export async function getStoryOrderForUser(orderId: string, userId: string) {
  const order = normalizeOrder(await getStoryOrderDocument(orderId));
  return order?.user_id === userId ? order : null;
}

export async function getStoryOrder(orderId: string) {
  return normalizeOrder(await getStoryOrderDocument(orderId));
}

export async function getStoryOrderByCheckoutId(checkoutId: string) {
  return normalizeOrder(await findStoryOrderByCheckoutId(checkoutId));
}

export async function updateStoryOrder(orderId: string, payload: Partial<StoryOrder>) {
  return normalizeOrder(
    await patchStoryOrderDocument(orderId, payload as Record<string, unknown>),
  );
}
