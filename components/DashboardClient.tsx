"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, RefreshCw } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { StripePaymentElement } from "@/components/StripePaymentElement";

type StoryOrder = {
  id: string;
  name: string;
  email: string;
  genre: string;
  summary: string;
  stripe_payment_status: string | null;
  story_status: string;
  created_at: string;
};

const badge: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending_payment: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  submitted: "bg-green-100 text-green-800",
  sent_to_n8n: "bg-green-100 text-green-800",
  failed: "bg-rose-100 text-rose-800",
};

const label: Record<string, string> = {
  draft: "draft",
  pending_payment: "pending payment",
  paid: "paid",
  submitted: "story submitted",
  sent_to_n8n: "story submitted",
  failed: "needs attention",
};

export function DashboardClient() {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const [orders, setOrders] = useState<StoryOrder[]>([]);
  const [message, setMessage] = useState("Loading your novel manuscript orders...");
  const [loading, setLoading] = useState(true);
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(auth?.currentUser?.uid ?? null);

  const loadOrders = useCallback(async (uid: string) => {
    if (!db) return;
    setLoading(true);
    try {
      const snapshot = await getDocs(
        query(collection(db, "story_orders"), where("user_id", "==", uid)),
      );
      const data = snapshot.docs
        .map((item) => item.data() as StoryOrder)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      setOrders(data);
      const requestedCheckoutId = new URLSearchParams(window.location.search).get("checkout");
      const requestedOrder = data.find((order) =>
        order.id === requestedCheckoutId &&
        order.story_status === "pending_payment" &&
        order.stripe_payment_status !== "paid"
      );
      if (requestedOrder) {
        setCheckoutOrderId(requestedOrder.id);
        setMessage("Enter your payment details below. You will stay on this page.");
        window.history.replaceState(null, "", "/dashboard");
        window.requestAnimationFrame(() => {
          document.getElementById(`checkout-${requestedOrder.id}`)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      } else {
        setMessage(
          data.length
            ? "Your latest novel manuscript orders are below."
            : "No novel manuscript orders yet.",
        );
      }
    } catch {
      setMessage("We could not refresh your novel manuscript orders.");
    } finally {
      setLoading(false);
    }
  }, [db]);

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

  function openCheckout(orderId: string) {
    setCheckoutOrderId(orderId);
    setMessage("Enter your payment details below. You will stay on this page.");
  }

  function closeCheckout() {
    setCheckoutOrderId(null);
    setMessage("Your latest novel manuscript orders are below.");
  }

  function paymentSucceeded(orderId: string) {
    setOrders((current) => current.map((order) =>
      order.id === orderId
        ? { ...order, stripe_payment_status: "paid", story_status: "submitted" }
        : order
    ));
    setMessage("Payment successful. Your story has been submitted.");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 border-b border-[#dbe5df] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-[#101513]">Novel manuscript dashboard</h1>
          <p role="status" className="mt-3 max-w-2xl leading-7 text-[#52615a]">{message}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => userId && void loadOrders(userId)} disabled={loading || !userId} className="inline-flex items-center gap-2 rounded-full border border-[#dbe5df] bg-white px-5 py-3 font-semibold text-[#101513] disabled:opacity-55">
            <RefreshCw size={18} />Refresh
          </button>
          <Link href="/new-story" className="inline-flex items-center gap-2 rounded-full bg-[#007a4d] px-5 py-3 font-semibold text-white">
            New story<ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {orders.length ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-[#dbe5df] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#dbe5df] text-left text-sm">
              <thead className="bg-[#f7faf7] text-[#52615a]">
                <tr>
                  <th className="px-5 py-4">Story</th><th className="px-5 py-4">Genre</th><th className="px-5 py-4">Payment</th><th className="px-5 py-4">Story status</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe5df]">
                {orders.map((order) => {
                  const paymentNeeded = order.story_status === "pending_payment" && order.stripe_payment_status !== "paid";
                  const checkoutOpen = checkoutOrderId === order.id;
                  return (
                    <Fragment key={order.id}>
                      <tr>
                        <td className="max-w-md px-5 py-4">
                          <p className="font-semibold">{order.name}</p>
                          <p className="mt-1 font-mono text-xs text-[#6f7d76]">Book ID {order.id}</p>
                          <p className="mt-1 line-clamp-2 text-[#52615a]">{order.summary}</p>
                        </td>
                        <td className="px-5 py-4">{order.genre}</td>
                        <td className="px-5 py-4">{order.stripe_payment_status === "paid" ? "Paid" : "Payment needed"}</td>
                        <td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge[order.story_status] ?? badge.draft}`}>{label[order.story_status] ?? order.story_status.replaceAll("_", " ")}</span></td>
                        <td className="px-5 py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          {paymentNeeded ? (
                            <button type="button" onClick={() => checkoutOpen ? closeCheckout() : openCheckout(order.id)} className="inline-flex items-center gap-2 rounded-full bg-[#007a4d] px-4 py-2 text-sm font-semibold text-white">
                              <CreditCard size={16} />{checkoutOpen ? "Close" : "Pay now"}
                            </button>
                          ) : <span className="text-sm text-[#6f7d76]">No action needed</span>}
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
          <h2 className="text-2xl font-semibold">Start your first novel manuscript.</h2>
          <Link href="/new-story" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#007a4d] px-5 py-3 font-semibold text-white">Create order<ArrowRight size={18} /></Link>
        </div>
      ) : null}
    </div>
  );
}
