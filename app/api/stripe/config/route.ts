import { getStripeBrowserConfig } from "@/lib/server/stripe";

export async function GET() {
  try {
    return Response.json(getStripeBrowserConfig(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Stripe browser configuration failed", error);
    return Response.json(
      { error: "Secure payment is not configured." },
      { status: 503 },
    );
  }
}
