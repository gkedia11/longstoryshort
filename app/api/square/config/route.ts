import { getSquareBrowserConfig } from "@/lib/server/square";

export async function GET() {
  try {
    return Response.json(getSquareBrowserConfig(), {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    console.error("Square browser configuration failed", error);
    return Response.json(
      { error: "Secure payment is temporarily unavailable." },
      { status: 503 },
    );
  }
}
