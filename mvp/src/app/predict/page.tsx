import { getTournamentSnapshot } from "@/lib/data";
import { PredictClient } from "./predict-client";

export default async function PredictPage() {
  const snapshot = await getTournamentSnapshot();

  const sortedForecasts = [...snapshot.teamForecasts].sort(
    (a, b) => b.championProbability - a.championProbability,
  );
  const teamsById = new Map(snapshot.teams.map((t) => [t.id, t]));

  // Derive Lab's picks from forecast data
  const championForecast  = sortedForecasts[0];
  const finalistForecast  = sortedForecasts.find(
    (f, i) => i > 0 && f.teamId !== championForecast?.teamId,
  ) ?? sortedForecasts[1];

  const championTeam  = teamsById.get(championForecast?.teamId ?? "");
  const finalistTeam  = teamsById.get(finalistForecast?.teamId ?? "");

  // Player forecasts
  const topScorerForecast  = [...snapshot.playerForecasts].sort(
    (a, b) => b.topScorerProbability - a.topScorerProbability,
  )[0];
  const topAssistForecast  = [...snapshot.playerForecasts].sort(
    (a, b) => b.topAssistProbability - a.topAssistProbability,
  )[0];

  const playersById = new Map(snapshot.players.map((p) => [p.id, p]));

  if (!championTeam || !finalistTeam) {
    return (
      <div style={{ padding: "3rem 0", textAlign: "center" }}>
        <p style={{ color: "var(--text-400)" }}>Unable to load tournament data. Check the data provider.</p>
      </div>
    );
  }

  const lab = {
    champion:  { team: championTeam,  prob: championForecast.championProbability },
    finalist:  { team: finalistTeam,  prob: finalistForecast.finalistProbability },
    topScorer: topScorerForecast
      ? { player: playersById.get(topScorerForecast.playerId)!, prob: topScorerForecast.topScorerProbability }
      : null,
    topAssist: topAssistForecast
      ? { player: playersById.get(topAssistForecast.playerId)!, prob: topAssistForecast.topAssistProbability }
      : null,
  };

  // Filter out null player entries (player may not be in snapshot)
  const labSafe = {
    ...lab,
    topScorer: lab.topScorer?.player ? lab.topScorer as NonNullable<typeof lab.topScorer> : null,
    topAssist: lab.topAssist?.player ? lab.topAssist as NonNullable<typeof lab.topAssist> : null,
  };

  return (
    <PredictClient
      fixtures={snapshot.fixtures}
      teams={snapshot.teams}
      forecasts={snapshot.teamForecasts}
      players={snapshot.players}
      playerForecasts={snapshot.playerForecasts}
      lab={labSafe}
    />
  );
}
