import { timingSafeEqual } from "node:crypto";
import { getStoryOrder, updateStoryOrder } from "@/lib/server/firebase";

const allowedStatuses = new Set([
  "writing",
  "proofreading",
  "completed",
  "delivered",
  "failed",
]);

function authorized(authorization: string | null) {
  const expected = process.env.N8N_STATUS_UPDATE_SECRET;
  if (!expected || !authorization?.startsWith("Bearer ")) return false;
  const actual = authorization.slice("Bearer ".length);
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length
    && timingSafeEqual(actualBytes, expectedBytes);
}

export async function POST(request: Request) {
  if (!process.env.N8N_STATUS_UPDATE_SECRET) {
    return Response.json({ error: "Status updates are not configured." }, { status: 503 });
  }
  if (!authorized(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json() as { book_id?: unknown; status?: unknown };
    const bookId = typeof body.book_id === "string" ? body.book_id.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "";

    if (!bookId || !allowedStatuses.has(status)) {
      return Response.json({ error: "Invalid Book ID or status." }, { status: 400 });
    }

    const order = await getStoryOrder(bookId);
    if (!order) {
      return Response.json({ error: "Book not found." }, { status: 404 });
    }

    await updateStoryOrder(bookId, {
      story_status: status as typeof order.story_status,
    });

    return Response.json({ updated: true, book_id: bookId, status });
  } catch {
    return Response.json({ error: "Status update could not be processed." }, { status: 400 });
  }
}