import { getTournamentSnapshot } from "@/lib/data";
import { generateSyntheticPlayers } from "@/lib/synthetic-players";
import { PredictClient } from "./predict-client";

export default async function PredictPage() {
  const snapshot = await getTournamentSnapshot();

  // Live provider (football-data.org) returns no player data.
  // Fall back to a curated synthetic roster so award pickers are populated.
  const players =
    snapshot.players.length > 0
      ? snapshot.players
      : generateSyntheticPlayers(snapshot.teams);

  const sortedForecasts = [...snapshot.teamForecasts].sort(
    (a, b) => b.championProbability - a.championProbability,
  );
  const teamsById = new Map(snapshot.teams.map((t) => [t.id, t]));

  const championForecast = sortedForecasts[0];
  const finalistForecast =
    sortedForecasts.find((f, i) => i > 0 && f.teamId !== championForecast?.teamId) ??
    sortedForecasts[1];

  const championTeam = teamsById.get(championForecast?.teamId ?? "");
  const finalistTeam = teamsById.get(finalistForecast?.teamId ?? "");

  const playersById = new Map(players.map((p) => [p.id, p]));

  // Derive Lab's player picks from synthetic player forecasts or first by power
  const playerForecasts = snapshot.playerForecasts;
  const topScorerForecast = [...playerForecasts].sort(
    (a, b) => b.topScorerProbability - a.topScorerProbability,
  )[0];
  const topAssistForecast = [...playerForecasts].sort(
    (a, b) => b.topAssistProbability - a.topAssistProbability,
  )[0];

  // When no player forecasts exist (live provider), pick Lab favorites by
  // team power — take top-rated player from the forecast-leading team.
  const topTeamId = championForecast?.teamId;
  const labScorerFallback = players.find((p) => p.teamId === topTeamId && p.position === "FWD")
    ?? players.find((p) => p.teamId === topTeamId)
    ?? players[0];

  const labAssistFallback = players.find(
    (p) => p.teamId === (sortedForecasts[1]?.teamId) && p.position === "MID",
  ) ?? players[1] ?? players[0];

  if (!championTeam || !finalistTeam) {
    return (
      <div style={{ padding: "3rem 0", textAlign: "center" }}>
        <p style={{ color: "var(--text-400)" }}>
          Unable to load tournament data. Check the data provider.
        </p>
      </div>
    );
  }

  const topScorerPlayer =
    (topScorerForecast ? playersById.get(topScorerForecast.playerId) : null) ?? labScorerFallback;
  const topAssistPlayer =
    (topAssistForecast ? playersById.get(topAssistForecast.playerId) : null) ?? labAssistFallback;

  const lab = {
    champion:  { team: championTeam, prob: championForecast.championProbability },
    finalist:  { team: finalistTeam, prob: finalistForecast.finalistProbability },
    topScorer: topScorerPlayer
      ? { player: topScorerPlayer, prob: topScorerForecast?.topScorerProbability ?? 0.15 }
      : null,
    topAssist: topAssistPlayer
      ? { player: topAssistPlayer, prob: topAssistForecast?.topAssistProbability ?? 0.12 }
      : null,
  };

  return (
    <PredictClient
      fixtures={snapshot.fixtures}
      teams={snapshot.teams}
      forecasts={snapshot.teamForecasts}
      players={players}
      playerForecasts={snapshot.playerForecasts}
      lab={lab}
    />
  );
}
