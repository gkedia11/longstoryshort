"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PaymentSuccessStatusProps = {
  orderId?: string;
};

export function PaymentSuccessStatus({ orderId }: PaymentSuccessStatusProps) {
  const supabase = getSupabaseBrowserClient();
  const [message, setMessage] = useState(
    orderId ? "Confirming your order..." : "",
  );

  useEffect(() => {
    if (!orderId || !supabase) return;

    let isActive = true;

    async function reconcilePayment() {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        if (isActive) {
          setMessage("Sign in to view the latest order status on your dashboard.");
        }
        return;
      }

      const response = await fetch("/api/checkout/reconcile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: orderId }),
      });
      const payload = (await response.json()) as {
        status?: string;
        error?: string;
      };

      if (!isActive) return;

      if (!response.ok) {
        setMessage(
          "Payment confirmation is taking a little longer than expected. Your dashboard will update automatically.",
        );
        return;
      }

      setMessage(
        payload.status === "pending_payment"
          ? "Payment is still being confirmed. Refresh your dashboard in a moment."
          : "Your order is confirmed.",
      );
    }

    void reconcilePayment();

    return () => {
      isActive = false;
    };
  }, [orderId, supabase]);

  if (!message) return null;

  if (!supabase) {
    return (
      <p role="status" aria-live="polite" className="mt-4 text-sm text-[#52615a]">
        Sign in to view the latest order status on your dashboard.
      </p>
    );
  }

  return <p role="status" aria-live="polite" className="mt-4 text-sm text-[#52615a]">{message}</p>;
}
