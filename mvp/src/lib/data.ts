import { withTtlCache } from "@/lib/cache";
import { fixtures as mockFixtures, players as mockPlayers, seedInsights, teams as mockTeams } from "@/lib/mock-data";
import { buildPlayerForecasts, buildStandings, buildTeamForecasts } from "@/lib/prediction";
import { fetchApiFootballSnapshot } from "@/lib/providers/apiFootball";
import { fetchFootballDataSnapshot } from "@/lib/providers/footballData";
import { createProviderDiagnostic } from "@/lib/providers/shared";
import { AgentInsight, Player, ProviderDiagnostic, ProviderPreference, Team, TournamentSnapshot } from "@/lib/types";

const DEFAULT_TTL_MS = 1000 * 60 * 10;

const normalizeProviderPreference = (value: string | undefined): ProviderPreference => {
  if (value === "mock" || value === "api-football" || value === "football-data" || value === "hybrid") {
    return value;
  }

  return "hybrid";
};

const buildInsights = (teams: Team[]): AgentInsight[] => {
  const sorted = [...teams].sort((a, b) => b.powerIndex - a.powerIndex);

  const topTwo = sorted.slice(0, 2).map((team) => team.name).join(" and ");

  return [
    {
      id: "auto-insight-1",
      agent: "Strength Agent",
      severity: "info",
      createdAt: new Date().toISOString(),
      summary: `${topTwo} drive the top of the baseline power curve.`,
      impact: "Champion probability remains concentrated unless group-stage upsets shift path difficulty.",
    },
    {
      id: "auto-insight-2",
      agent: "Scenario Agent",
      severity: "warning",
      createdAt: new Date().toISOString(),
      summary: "Two matches in each group can swing qualification odds by double digits.",
      impact: "Scenario picks around the final matchday produce the highest forecast movement.",
    },
    {
      id: "auto-insight-3",
      agent: "Risk Agent",
      severity: "critical",
      createdAt: new Date().toISOString(),
      summary: "Discipline pressure is elevated for lower-ranked teams chasing points.",
      impact: "Card accumulation risk can materially affect semifinal probability confidence.",
    },
  ];
};

const buildSnapshot = (
  source: TournamentSnapshot["source"],
  teams: Team[],
  players: Player[],
  fixtures: TournamentSnapshot["fixtures"],
  insights: AgentInsight[],
  diagnostics: TournamentSnapshot["diagnostics"],
): TournamentSnapshot => {
  const standings = buildStandings(teams, fixtures);
  const teamForecasts = buildTeamForecasts(teams, standings);
  const playerForecasts = buildPlayerForecasts(players, teams, teamForecasts);

  return {
    generatedAt: new Date().toISOString(),
    source,
    teams,
    players,
    fixtures,
    standings,
    teamForecasts,
    playerForecasts,
    agentInsights: insights,
    diagnostics,
  };
};

const fetchSnapshot = async (cacheTtlMinutes: number): Promise<TournamentSnapshot> => {
  const providerPreference = normalizeProviderPreference(process.env.DATA_PROVIDER);
  const attempts: ProviderDiagnostic[] = [];

  const buildDiagnostics = (
    selectedProvider: TournamentSnapshot["source"],
    nextAttempts: ProviderDiagnostic[],
  ): TournamentSnapshot["diagnostics"] => ({
    providerPreference,
    selectedProvider,
    cacheTtlMinutes,
    attempts: nextAttempts,
  });

  if (providerPreference === "api-football" || providerPreference === "hybrid") {
    const apiFootball = await fetchApiFootballSnapshot();
    attempts.push(apiFootball.diagnostic);
    if (apiFootball.ok && apiFootball.data) {
      return buildSnapshot(
        "api-football",
        apiFootball.data.teams,
        apiFootball.data.players,
        apiFootball.data.fixtures,
        buildInsights(apiFootball.data.teams),
        buildDiagnostics("api-football", attempts),
      );
    }
  }

  if (providerPreference === "football-data" || providerPreference === "hybrid") {
    const footballData = await fetchFootballDataSnapshot();
    attempts.push(footballData.diagnostic);
    if (footballData.ok && footballData.data) {
      return buildSnapshot(
        "football-data",
        footballData.data.teams,
        footballData.data.players,
        footballData.data.fixtures,
        buildInsights(footballData.data.teams),
        buildDiagnostics("football-data", attempts),
      );
    }
  }

  const mockStatus = providerPreference === "mock" ? "success" : "fallback";
  const mockMessage =
    providerPreference === "mock"
      ? "Using bundled mock dataset."
      : "Falling back to bundled mock dataset after provider failure or skip.";

  attempts.push(
    createProviderDiagnostic("mock", mockStatus, mockMessage, {
      teamCount: mockTeams.length,
      fixtureCount: mockFixtures.length,
      playerCount: mockPlayers.length,
    }),
  );

  return buildSnapshot(
    "mock",
    mockTeams,
    mockPlayers,
    mockFixtures,
    seedInsights,
    buildDiagnostics("mock", attempts),
  );
};

export const getTournamentSnapshot = async (): Promise<TournamentSnapshot> => {
  const ttlMinutes = Number(process.env.DATA_CACHE_TTL_MINUTES ?? "10");
  const cacheTtlMinutes = Number.isFinite(ttlMinutes) ? Math.max(1, ttlMinutes) : DEFAULT_TTL_MS / 60 / 1000;
  const ttlMs = cacheTtlMinutes * 60 * 1000;

  return withTtlCache("tournament-snapshot", ttlMs, () => fetchSnapshot(cacheTtlMinutes));
};
