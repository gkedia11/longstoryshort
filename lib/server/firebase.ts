import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

export type StoryOrder = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  genre: string;
  summary: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_status: string | null;
  story_status: "draft" | "pending_payment" | "paid" | "sent_to_n8n" | "failed";
  n8n_response: unknown | null;
  created_at: string;
  updated_at: string;
};

type FirebaseUser = { id: string; email?: string };

function required(name: string) {
  const value = process.env[name];
  if (!value || value.includes("REPLACE_WITH")) throw new Error(`${name} is not configured`);
  return value;
}

function getAdminApp() {
  if (getApps().length) return getApps()[0]!;
  const serviceAccount = JSON.parse(required("FIREBASE_SERVICE_ACCOUNT_JSON"));
  return initializeApp({ credential: cert(serviceAccount) });
}

function database() {
  return getFirestore(getAdminApp());
}

export async function getUserFromAuthorization(authorization: string | null): Promise<FirebaseUser> {
  if (!authorization?.startsWith("Bearer ")) throw new Error("Missing Firebase access token");
  const token = authorization.replace(/^Bearer\s+/i, "");
  const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
  return { id: decoded.uid, email: decoded.email };
}

function normalizeOrder(id: string, data: Record<string, unknown> | undefined): StoryOrder | null {
  if (!data) return null;
  return { id, ...data } as StoryOrder;
}

export async function getStoryOrderForUser(orderId: string, userId: string) {
  const snapshot = await database().collection("story_orders").doc(orderId).get();
  const order = normalizeOrder(snapshot.id, snapshot.data());
  return order?.user_id === userId ? order : null;
}

export async function getStoryOrder(orderId: string) {
  const snapshot = await database().collection("story_orders").doc(orderId).get();
  return normalizeOrder(snapshot.id, snapshot.data());
}

export async function getStoryOrderByCheckoutId(checkoutId: string) {
  const snapshot = await database().collection("story_orders")
    .where("stripe_checkout_session_id", "==", checkoutId).limit(1).get();
  const doc = snapshot.docs[0];
  return doc ? normalizeOrder(doc.id, doc.data()) : null;
}

export async function updateStoryOrder(orderId: string, payload: Partial<StoryOrder>) {
  const ref = database().collection("story_orders").doc(orderId);
  await ref.set({ ...payload, updated_at: new Date().toISOString(), updated_at_server: FieldValue.serverTimestamp() }, { merge: true });
  const snapshot = await ref.get();
  return normalizeOrder(snapshot.id, snapshot.data());
}