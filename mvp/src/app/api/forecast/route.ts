import { getTournamentSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Simple cron security check
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  // A call to getTournamentSnapshot triggers the TTL cache logic.
  // We can just fetch it to warm the cache.
  const snapshot = await getTournamentSnapshot();

  return Response.json({
    success: true,
    message: "Cache warmed successfully",
    source: snapshot.source,
    generatedAt: snapshot.generatedAt,
  });
}
