"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CreditCard, RefreshCw } from "lucide-react";
import {
  getSupabaseBrowserClient,
  getSupabaseBrowserConfigError,
} from "@/lib/supabase/client";

type StoryOrder = {
  id: string;
  name: string;
  email: string;
  genre: string;
  summary: string;
  stripe_payment_status: string | null;
  story_status: string;
  created_at: string;
  updated_at: string;
};

const badgeClass: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending_payment: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  sent_to_n8n: "bg-green-100 text-green-800",
  failed: "bg-rose-100 text-rose-800",
};

export function DashboardClient() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const configError = getSupabaseBrowserConfigError();
  const [orders, setOrders] = useState<StoryOrder[]>([]);
  const [message, setMessage] = useState(
    supabase
      ? "Loading your manuscript orders..."
      : (configError ?? "Supabase browser keys are not configured yet."),
  );
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  const hasOrders = useMemo(() => orders.length > 0, [orders]);

  async function loadOrders() {
    if (!supabase) return;
    setIsLoading(true);
    setMessage("Loading your manuscript orders...");
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("story_orders")
      .select(
        "id,name,email,genre,summary,stripe_payment_status,story_status,created_at,updated_at",
      )
      .order("created_at", { ascending: false });

    setIsLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setOrders((data ?? []) as StoryOrder[]);
    setMessage(
      data?.length
        ? "Your latest manuscript orders are below."
        : "No manuscript orders yet.",
    );
  }

  useEffect(() => {
    if (!supabase) return;
    let isActive = true;

    async function loadInitialOrders() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!isActive) return;

      if (!sessionData.session) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("story_orders")
        .select(
          "id,name,email,genre,summary,stripe_payment_status,story_status,created_at,updated_at",
        )
        .order("created_at", { ascending: false });

      if (!isActive) return;
      setIsLoading(false);
      if (error) {
        setMessage(error.message);
        return;
      }

      setOrders((data ?? []) as StoryOrder[]);
      setMessage(
        data?.length
          ? "Your latest manuscript orders are below."
          : "No manuscript orders yet.",
      );
    }

    void loadInitialOrders();
    return () => {
      isActive = false;
    };
  }, [supabase]);

  async function handlePayNow(orderId: string) {
    if (!supabase) return;

    setPayingOrderId(orderId);
    setMessage("Opening secure checkout...");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    });
    const payload = (await response.json()) as {
      checkout_url?: string;
      error?: string;
    };

    if (!response.ok || !payload.checkout_url) {
      setPayingOrderId(null);
      setMessage(payload.error ?? "Could not open checkout.");
      return;
    }

    router.push(payload.checkout_url);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 border-b border-[#dbe5df] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-[#101513]">
            Manuscript dashboard
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-[#52615a]">{message}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadOrders}
            disabled={!supabase || isLoading}
            className="inline-flex items-center gap-2 rounded-full border border-[#dbe5df] bg-white px-5 py-3 font-semibold text-[#101513] transition hover:border-[#007a4d] disabled:opacity-55"
          >
            <RefreshCw aria-hidden="true" size={18} />
            Refresh
          </button>
          <Link
            href="/new-story"
            className="inline-flex items-center gap-2 rounded-full bg-[#007a4d] px-5 py-3 font-semibold text-white transition hover:bg-[#004d33]"
          >
            New story
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </div>

      {hasOrders ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-[#dbe5df] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#dbe5df] text-left text-sm">
              <thead className="bg-[#f7faf7] text-[#52615a]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Story</th>
                  <th className="px-5 py-4 font-semibold">Genre</th>
                  <th className="px-5 py-4 font-semibold">Payment</th>
                  <th className="px-5 py-4 font-semibold">Story status</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe5df]">
                {orders.map((order) => {
                  const canPay =
                    order.story_status === "pending_payment" ||
                    order.stripe_payment_status === "unpaid";

                  return (
                    <tr key={order.id} className="align-top">
                      <td className="max-w-md px-5 py-4">
                        <p className="font-semibold text-[#101513]">
                          {order.name}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[#52615a]">
                          {order.summary}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-[#34423c]">
                        {order.genre}
                      </td>
                      <td className="px-5 py-4 text-[#34423c]">
                        {order.stripe_payment_status ?? "unpaid"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                            badgeClass[order.story_status] ??
                              "bg-slate-100 text-slate-700",
                          ].join(" ")}
                        >
                          {order.story_status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#52615a]">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        {canPay ? (
                          <button
                            type="button"
                            onClick={() => handlePayNow(order.id)}
                            disabled={payingOrderId === order.id}
                            className="inline-flex items-center gap-2 rounded-full bg-[#007a4d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#004d33] disabled:cursor-not-allowed disabled:opacity-55"
                          >
                            <CreditCard aria-hidden="true" size={16} />
                            {payingOrderId === order.id ? "Opening..." : "Pay now"}
                          </button>
                        ) : (
                          <span className="text-sm text-[#6f7d76]">Done</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-[#dbe5df] bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#101513]">
            Start your first manuscript.
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-[#52615a]">
            Submit a premise, save the order, and continue to the secured
            checkout flow.
          </p>
          <Link
            href="/new-story"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#007a4d] px-5 py-3 font-semibold text-white transition hover:bg-[#004d33]"
          >
            Create order
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      )}
    </div>
  );
}
