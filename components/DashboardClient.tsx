"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, Download, RefreshCw } from "lucide-react";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { StripePaymentElement } from "@/components/StripePaymentElement";
import {
  customerStoryStatusLabel,
  customerStoryStatusMessage,
  isManuscriptReady,
  type StoryStatusHistoryEntry,
} from "@/lib/story-progress";

type StoryOrder = {
  id: string;
  name: string;
  email: string;
  genre: string;
  summary: string;
  stripe_payment_status: string | null;
  story_status: string;
  customer_status_message?: string | null;
  status_history?: StoryStatusHistoryEntry[];
  delivery?: {
    provider: "google_drive";
    file_id: string;
    file_name: string;
    mime_type: string;
    ready_at: string;
  } | null;
  created_at: string;
};

const badge: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending_payment: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  submitted: "bg-green-100 text-green-800",
  sent_to_n8n: "bg-green-100 text-green-800",
  story_submitted: "bg-green-100 text-green-800",
  plan_ready: "bg-sky-100 text-sky-800",
  writing_proofreading_complete: "bg-violet-100 text-violet-800",
  ready: "bg-emerald-100 text-emerald-800",
  delivered: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800",
};

function sortedOrders(snapshot: Awaited<ReturnType<typeof getDocs>>) {
  return snapshot.docs
    .map((item) => item.data() as StoryOrder)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function DashboardClient() {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const [orders, setOrders] = useState<StoryOrder[]>([]);
  const [message, setMessage] = useState(
    "Loading your novel manuscript orders...",
  );
  const [loading, setLoading] = useState(true);
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(
    null,
  );
  const [userId, setUserId] = useState<string | null>(
    auth?.currentUser?.uid ?? null,
  );

  const loadOrders = useCallback(
    async (uid: string) => {
      if (!db) return;
      setLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, "story_orders"), where("user_id", "==", uid)),
        );
        const data = sortedOrders(snapshot);
        setOrders(data);
        const requestedCheckoutId = new URLSearchParams(
          window.location.search,
        ).get("checkout");
        const requestedOrder = data.find(
          (order) =>
            order.id === requestedCheckoutId &&
            order.story_status === "pending_payment" &&
            order.stripe_payment_status !== "paid",
        );
        if (requestedOrder) {
          setCheckoutOrderId(requestedOrder.id);
          setMessage(
            "Enter your payment details below. You will stay on this page.",
          );
          window.history.replaceState(null, "", "/dashboard");
          window.requestAnimationFrame(() => {
            document
              .getElementById(`checkout-${requestedOrder.id}`)
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        } else {
          setMessage(
            data.length
              ? "Your latest novel manuscript orders are below. Progress updates appear automatically."
              : "No novel manuscript orders yet.",
          );
        }
      } catch {
        setMessage("We could not refresh your novel manuscript orders.");
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.assign("/login");
        return;
      }
      setUserId(user.uid);
      void loadOrders(user.uid);
    });
  }, [auth, loadOrders]);

  useEffect(() => {
    if (!db || !userId) return;
    const ownedOrders = query(
      collection(db, "story_orders"),
      where("user_id", "==", userId),
    );
    return onSnapshot(
      ownedOrders,
      (snapshot) => {
        setOrders(sortedOrders(snapshot));
        setLoading(false);
      },
      () => setMessage("Live progress updates are temporarily unavailable."),
    );
  }, [db, userId]);

  useEffect(() => {
    if (!userId) return;
    const intervalId = window.setInterval(() => {
      void loadOrders(userId);
    }, 5 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [userId, loadOrders]);

  function openCheckout(orderId: string) {
    setCheckoutOrderId(orderId);
    setMessage("Enter your payment details below. You will stay on this page.");
  }

  function closeCheckout() {
    setCheckoutOrderId(null);
    setMessage("Your latest novel manuscript orders are below.");
  }

  function paymentSucceeded(orderId: string) {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              stripe_payment_status: "paid",
              story_status: "story_submitted",
              customer_status_message:
                "Your story has been submitted. We’re preparing your story plan and title.",
            }
          : order,
      ),
    );
    setMessage("Payment successful. Your story has been submitted.");
  }

  async function downloadManuscript(order: StoryOrder) {
    const user = auth?.currentUser;
    if (!user || !order.delivery) return;
    setDownloadingOrderId(order.id);
    setMessage("Preparing your private manuscript download...");
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `/api/manuscripts/${encodeURIComponent(order.id)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "The download could not be prepared.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = order.delivery.file_name || `manuscript-${order.id}.docx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("Your manuscript download has started.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The manuscript could not be downloaded. Please try again.",
      );
    } finally {
      setDownloadingOrderId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 border-b border-[#dbe5df] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-[#101513]">
            Novel manuscript dashboard
          </h1>
          <p
            role="status"
            aria-live="polite"
            className="mt-3 max-w-2xl leading-7 text-[#52615a]"
          >
            {message}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => userId && void loadOrders(userId)}
            disabled={loading || !userId}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dbe5df] bg-white px-5 py-3 font-semibold text-[#101513] disabled:opacity-55"
          >
            <RefreshCw aria-hidden="true" size={18} />
            Refresh
          </button>
          <Link
            href="/new-story"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#007a4d] px-5 py-3 font-semibold text-white"
          >
            New story
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </div>

      {orders.length ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-[#dbe5df] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#dbe5df] text-left text-sm">
              <thead className="bg-[#f7faf7] text-[#52615a]">
                <tr>
                  <th className="px-5 py-4">Story</th>
                  <th className="px-5 py-4">Genre</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="min-w-72 px-5 py-4">Story status</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe5df]">
                {orders.map((order) => {
                  const paymentNeeded =
                    order.story_status === "pending_payment" &&
                    order.stripe_payment_status !== "paid";
                  const checkoutOpen = checkoutOrderId === order.id;
                  const ready =
                    isManuscriptReady(order.story_status) && !!order.delivery;
                  const progressHistory = (order.status_history ?? []).filter(
                    (entry) => entry.status !== "pending_payment",
                  );
                  return (
                    <Fragment key={order.id}>
                      <tr>
                        <td className="max-w-md px-5 py-4 align-top">
                          <p className="font-semibold">{order.name}</p>
                          <p className="mt-1 font-mono text-xs text-[#6f7d76]">
                            Book ID {order.id}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[#52615a]">
                            {order.summary}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top">{order.genre}</td>
                        <td className="px-5 py-4 align-top">
                          {order.stripe_payment_status === "paid"
                            ? "Paid"
                            : "Payment needed"}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge[order.story_status] ?? badge.draft}`}
                          >
                            {customerStoryStatusLabel(order.story_status)}
                          </span>
                          <p className="mt-3 max-w-sm leading-6 text-[#52615a]">
                            {customerStoryStatusMessage(
                              order.story_status,
                              order.customer_status_message,
                            )}
                          </p>
                          {progressHistory.length > 1 ? (
                            <ol
                              aria-label="Order progress history"
                              className="mt-3 space-y-2 border-l border-[#b8c8bf] pl-3 text-xs leading-5 text-[#6f7d76]"
                            >
                              {progressHistory.slice(-4).map((entry) => (
                                <li key={`${entry.status}-${entry.at}`}>
                                  <span className="font-semibold text-[#34423c]">
                                    {customerStoryStatusLabel(entry.status)}
                                  </span>{" "}
                                  · {new Date(entry.at).toLocaleString()}
                                </li>
                              ))}
                            </ol>
                          ) : null}
                        </td>
                        <td className="px-5 py-4 align-top">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 align-top">
                          {paymentNeeded ? (
                            <button
                              type="button"
                              onClick={() =>
                                checkoutOpen
                                  ? closeCheckout()
                                  : openCheckout(order.id)
                              }
                              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#007a4d] px-4 py-2 text-sm font-semibold text-white"
                            >
                              <CreditCard aria-hidden="true" size={16} />
                              {checkoutOpen ? "Close" : "Pay now"}
                            </button>
                          ) : ready ? (
                            <button
                              type="button"
                              onClick={() => void downloadManuscript(order)}
                              disabled={downloadingOrderId === order.id}
                              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#007a4d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-55"
                            >
                              <Download aria-hidden="true" size={16} />
                              {downloadingOrderId === order.id
                                ? "Preparing..."
                                : "Download your manuscript"}
                            </button>
                          ) : (
                            <span className="text-sm text-[#6f7d76]">
                              {order.stripe_payment_status === "paid"
                                ? "Updates appear automatically"
                                : "No action needed"}
                            </span>
                          )}
                        </td>
                      </tr>
                      {checkoutOpen ? (
                        <tr id={`checkout-${order.id}`}>
                          <td colSpan={6} className="bg-[#f7faf7] px-5 py-5">
                            <StripePaymentElement
                              orderId={order.id}
                              customerName={order.name}
                              customerEmail={order.email}
                              onCancel={closeCheckout}
                              onSuccess={() => paymentSucceeded(order.id)}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : !loading ? (
        <div className="mt-8 rounded-lg border border-[#dbe5df] bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Start your first novel manuscript.
          </h2>
          <Link
            href="/new-story"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#007a4d] px-5 py-3 font-semibold text-white"
          >
            Create order
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
