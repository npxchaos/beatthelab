import { getTournamentSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getTournamentSnapshot();
  const attemptSummary = snapshot.diagnostics.attempts
    .map((attempt) => `${attempt.provider}:${attempt.status}`)
    .join(",");

  return Response.json(snapshot, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      "X-Snapshot-Source": snapshot.source,
      "X-Provider-Preference": snapshot.diagnostics.providerPreference,
      "X-Provider-Attempts": attemptSummary,
    },
  });
}
