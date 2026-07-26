"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";

type Props = { orderId?: string };

export function PaymentSuccessStatus({ orderId }: Props) {
  const auth = getFirebaseAuth();
  const [message, setMessage] = useState(orderId ? "Confirming your order..." : "");

  useEffect(() => {
    if (!orderId || !auth) return;
    let cancelled = false;

    void (async () => {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) {
        if (!cancelled) setMessage("Sign in to view the latest order status on your dashboard.");
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/checkout/reconcile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order_id: orderId }),
        });
        const payload = await response.json() as { status?: string };
        if (!cancelled) {
          setMessage(
            response.ok && payload.status !== "pending_payment"
              ? "Your order is confirmed."
              : "Payment confirmation is taking a little longer than expected. Refresh your dashboard in a moment.",
          );
        }
      } catch {
        if (!cancelled) {
          setMessage("Payment confirmation is taking a little longer than expected. Refresh your dashboard in a moment.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth, orderId]);

  return message ? (
    <p role="status" aria-live="polite" className="mt-4 text-sm text-[#52615a]">
      {message}
    </p>
  ) : null;
}