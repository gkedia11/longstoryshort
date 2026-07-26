"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, RefreshCw, X } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";

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
  sent_to_n8n: "bg-green-100 text-green-800",
  failed: "bg-rose-100 text-rose-800",
};

const label: Record<string, string> = {
  draft: "draft",
  pending_payment: "pending payment",
  paid: "paid",
  sent_to_n8n: "being written",
  failed: "needs attention",
};

export function DashboardClient() {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const [orders, setOrders] = useState<StoryOrder[]>([]);
  const [message, setMessage] = useState("Loading your novel manuscript orders...");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
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
      setMessage(
        data.length
          ? "Your latest novel manuscript orders are below."
          : "No novel manuscript orders yet.",
      );
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
    setCouponCode("");
    setMessage("Review your order and continue to secure payment.");
  }

  function closeCheckout() {
    setCheckoutOrderId(null);
    setCouponCode("");
    setMessage("Your latest novel manuscript orders are below.");
  }

  async function startPayment(orderId: string) {
    const user = auth?.currentUser;
    if (!user) {
      window.location.assign("/login");
      return;
    }

    setPaying(orderId);
    setMessage("Opening secure payment...");
    const normalizedCoupon = couponCode.trim();
    if (normalizedCoupon && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(normalizedCoupon);
      } catch {
        // The code remains visible in the field if clipboard access is unavailable.
      }
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await response.json() as { checkout_url?: string };
      if (!response.ok || !data.checkout_url) throw new Error("checkout unavailable");
      window.location.assign(data.checkout_url);
    } catch {
      setPaying(null);
      setMessage("We could not open secure payment. Please try again in a moment.");
    }
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
                            <button type="button" onClick={() => checkoutOpen ? closeCheckout() : openCheckout(order.id)} disabled={paying === order.id} className="inline-flex items-center gap-2 rounded-full bg-[#007a4d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-55">
                              <CreditCard size={16} />{checkoutOpen ? "Close" : "Pay now"}
                            </button>
                          ) : <span className="text-sm text-[#6f7d76]">No action needed</span>}
                        </td>
                      </tr>
                      {checkoutOpen ? (
                        <tr>
                          <td colSpan={6} className="bg-[#f7faf7] px-5 py-4">
                            <form onSubmit={(event) => { event.preventDefault(); void startPayment(order.id); }} className="flex flex-col gap-4 lg:flex-row lg:items-end">
                              <div className="min-w-48">
                                <p className="text-xs font-semibold uppercase text-[#52615a]">Order total</p>
                                <p className="mt-1 text-2xl font-semibold text-[#101513]">$29.99</p>
                              </div>
                              <div className="w-full max-w-sm">
                                <label htmlFor={`coupon-${order.id}`} className="text-sm font-semibold text-[#101513]">Discount coupon <span className="font-normal text-[#6f7d76]">(optional)</span></label>
                                <input id={`coupon-${order.id}`} value={couponCode} onChange={(event) => setCouponCode(event.target.value)} className="field field-compact mt-1.5" autoComplete="off" />
                                <p className="mt-1.5 text-xs leading-5 text-[#6f7d76]">Your code is copied so you can paste it into Add coupon at secure checkout.</p>
                              </div>
                              <div className="flex flex-wrap gap-2 lg:ml-auto">
                                <button type="button" onClick={closeCheckout} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#cbd8d1] bg-white px-4 font-semibold text-[#101513]"><X size={16} />Cancel</button>
                                <button type="submit" disabled={paying === order.id} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#007a4d] px-5 font-semibold text-white disabled:opacity-55"><CreditCard size={16} />{paying === order.id ? "Opening..." : "Continue securely"}</button>
                              </div>
                            </form>
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