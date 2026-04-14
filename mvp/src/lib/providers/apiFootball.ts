import { Fixture, Player, Team } from "@/lib/types";
import { createProviderDiagnostic, isRecord, ProviderFetchResult, slugify } from "@/lib/providers/shared";

type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
  };
  league: {
    round: string;
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

type ApiFootballStanding = {
  rank: number;
  points: number;
  goalsDiff: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  team: {
    id: number;
    name: string;
  };
};

type ApiFootballTopPlayer = {
  playerId: number;
  name: string;
  injured: boolean;
  teamId: number;
  position: string | null;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
};

export interface ApiFootballNormalized {
  source: "api-football";
  teams: Team[];
  fixtures: Fixture[];
  players: Player[];
}

const isApiFootballFixture = (value: unknown): value is ApiFootballFixture => {
  if (!isRecord(value) || !isRecord(value.fixture) || !isRecord(value.league) || !isRecord(value.teams) || !isRecord(value.goals)) {
    return false;
  }

  const home = value.teams.home;
  const away = value.teams.away;

  return (
    typeof value.fixture.id === "number" &&
    typeof value.fixture.date === "string" &&
    isRecord(value.fixture.status) &&
    typeof value.fixture.status.short === "string" &&
    typeof value.league.round === "string" &&
    isRecord(home) &&
    typeof home.id === "number" &&
    typeof home.name === "string" &&
    isRecord(away) &&
    typeof away.id === "number" &&
    typeof away.name === "string" &&
    (typeof value.goals.home === "number" || value.goals.home === null) &&
    (typeof value.goals.away === "number" || value.goals.away === null)
  );
};

const isApiFootballStanding = (value: unknown): value is ApiFootballStanding => {
  if (!isRecord(value) || !isRecord(value.all) || !isRecord(value.team)) {
    return false;
  }

  return (
    typeof value.rank === "number" &&
    typeof value.points === "number" &&
    typeof value.goalsDiff === "number" &&
    typeof value.all.played === "number" &&
    typeof value.all.win === "number" &&
    typeof value.all.draw === "number" &&
    typeof value.all.lose === "number" &&
    isRecord(value.all.goals) &&
    typeof value.all.goals.for === "number" &&
    typeof value.all.goals.against === "number" &&
    typeof value.team.id === "number" &&
    typeof value.team.name === "string"
  );
};

const parseStandings = (payload: unknown): ApiFootballStanding[] | null => {
  if (!isRecord(payload) || !Array.isArray(payload.response)) {
    return null;
  }

  const leagueEntry = payload.response[0];
  if (!isRecord(leagueEntry) || !isRecord(leagueEntry.league) || !Array.isArray(leagueEntry.league.standings)) {
    return null;
  }

  const flattened = leagueEntry.league.standings.flatMap((group) => (Array.isArray(group) ? group : []));
  return flattened.every(isApiFootballStanding) ? flattened : null;
};

const parseFixtures = (payload: unknown): ApiFootballFixture[] | null => {
  if (!isRecord(payload) || !Array.isArray(payload.response)) {
    return null;
  }

  return payload.response.every(isApiFootballFixture) ? payload.response : null;
};

const parseTopPlayers = (payload: unknown): ApiFootballTopPlayer[] | null => {
  if (!isRecord(payload) || !Array.isArray(payload.response)) {
    return null;
  }

  const rows: ApiFootballTopPlayer[] = [];

  for (const item of payload.response) {
    if (!isRecord(item) || !isRecord(item.player) || !Array.isArray(item.statistics)) {
      continue;
    }

    const playerId = item.player.id;
    const name = item.player.name;
    const injured = item.player.injured;

    if (typeof playerId !== "number" || typeof name !== "string") {
      continue;
    }

    for (const stat of item.statistics) {
      if (!isRecord(stat) || !isRecord(stat.team) || !isRecord(stat.games) || !isRecord(stat.goals) || !isRecord(stat.cards)) {
        continue;
      }

      const teamId = stat.team.id;
      if (typeof teamId !== "number") {
        continue;
      }

      rows.push({
        playerId,
        name,
        injured: injured === true,
        teamId,
        position: typeof stat.games.position === "string" ? stat.games.position : null,
        goals: typeof stat.goals.total === "number" ? stat.goals.total : 0,
        assists: typeof stat.goals.assists === "number" ? stat.goals.assists : 0,
        yellowCards: typeof stat.cards.yellow === "number" ? stat.cards.yellow : 0,
        redCards: typeof stat.cards.red === "number" ? stat.cards.red : 0,
      });
    }
  }

  return rows;
};

const stageFromRound = (round: string): Fixture["stage"] => {
  const lower = round.toLowerCase();
  if (lower.includes("group")) {
    return "group";
  }
  if (lower.includes("round of 16")) {
    return "round_of_16";
  }
  if (lower.includes("quarter")) {
    return "quarter";
  }
  if (lower.includes("semi")) {
    return "semi";
  }
  return "final";
};

const statusFromShort = (short: string): Fixture["status"] => {
  if (short === "FT" || short === "AET" || short === "PEN") {
    return "finished";
  }
  if (short === "NS" || short === "TBD") {
    return "scheduled";
  }
  return "live";
};

const positionFromApiFootball = (value: string | null): Player["position"] => {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("goal")) {
    return "GK";
  }
  if (normalized.includes("def")) {
    return "DEF";
  }
  if (normalized.includes("mid")) {
    return "MID";
  }
  return "FWD";
};

const fetchOptionalTopPlayers = async (
  url: string,
  headers: Record<string, string>,
): Promise<ApiFootballTopPlayer[] | null> => {
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return parseTopPlayers(payload);
  } catch {
    return null;
  }
};

const mergePlayers = (
  feeds: Array<ApiFootballTopPlayer[] | null>,
  teamByApiId: Map<number, string>,
): Player[] => {
  const players = new Map<string, Player>();

  for (const feed of feeds) {
    if (!feed) {
      continue;
    }

    for (const row of feed) {
      const teamId = teamByApiId.get(row.teamId);
      if (!teamId) {
        continue;
      }

      const key = `af-player-${row.playerId}-${row.teamId}`;
      const current = players.get(key);
      players.set(key, {
        id: key,
        teamId,
        name: row.name,
        position: current?.position ?? positionFromApiFootball(row.position),
        goals: Math.max(current?.goals ?? 0, row.goals),
        assists: Math.max(current?.assists ?? 0, row.assists),
        yellowCards: Math.max(current?.yellowCards ?? 0, row.yellowCards),
        redCards: Math.max(current?.redCards ?? 0, row.redCards),
        status: row.injured ? "injured" : current?.status ?? "available",
      });
    }
  }

  return [...players.values()].sort((a, b) => {
    const aScore = a.goals * 3 + a.assists * 2 + a.yellowCards + a.redCards * 2;
    const bScore = b.goals * 3 + b.assists * 2 + b.yellowCards + b.redCards * 2;
    return bScore - aScore || a.name.localeCompare(b.name);
  });
};

export const fetchApiFootballSnapshot = async (): Promise<ProviderFetchResult<"api-football">> => {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return {
      provider: "api-football",
      ok: false,
      diagnostic: createProviderDiagnostic("api-football", "skipped", "API_FOOTBALL_KEY is not configured."),
    };
  }

  const host = process.env.API_FOOTBALL_HOST ?? "v3.football.api-sports.io";
  const season = process.env.API_FOOTBALL_SEASON ?? "2026";
  const league = process.env.API_FOOTBALL_LEAGUE_ID ?? "1";

  const headers: Record<string, string> = {
    "x-apisports-key": apiKey,
    "x-apisports-host": host,
  };

  try {
    const [standingsRes, fixturesRes] = await Promise.all([
      fetch(`https://${host}/standings?league=${league}&season=${season}`, { headers }),
      fetch(`https://${host}/fixtures?league=${league}&season=${season}`, { headers }),
    ]);

    if (!standingsRes.ok || !fixturesRes.ok) {
      return {
        provider: "api-football",
        ok: false,
        diagnostic: createProviderDiagnostic("api-football", "error", "API-Football request failed.", {
          httpStatus: !standingsRes.ok ? standingsRes.status : fixturesRes.status,
        }),
      };
    }

    const standingsJson = await standingsRes.json();
    const fixturesJson = await fixturesRes.json();
    const standings = parseStandings(standingsJson);
    const fixtures = parseFixtures(fixturesJson);

    if (!standings) {
      return {
        provider: "api-football",
        ok: false,
        diagnostic: createProviderDiagnostic("api-football", "error", "API-Football standings payload failed validation.", {
          validation: "standings",
        }),
      };
    }

    if (!fixtures) {
      return {
        provider: "api-football",
        ok: false,
        diagnostic: createProviderDiagnostic("api-football", "error", "API-Football fixtures payload failed validation.", {
          validation: "fixtures",
        }),
      };
    }

    const teams: Team[] = standings.map((entry, index) => ({
      id: `af-${entry.team.id}`,
      slug: slugify(entry.team.name),
      name: entry.team.name,
      group: String.fromCharCode(65 + Math.floor(index / 4)),
      confederation: "Unknown",
      powerIndex: 75 + (12 - entry.rank),
      formIndex: 70 + entry.points,
      goalsFor: entry.all.goals.for,
      goalsAgainst: entry.all.goals.against,
    }));

    const teamByApiId = new Map(standings.map((entry) => [entry.team.id, `af-${entry.team.id}`]));

    const mappedFixtures = fixtures.reduce<Fixture[]>((acc, fixture) => {
      const homeTeamId = teamByApiId.get(fixture.teams.home.id);
      const awayTeamId = teamByApiId.get(fixture.teams.away.id);
      if (!homeTeamId || !awayTeamId) {
        return acc;
      }

      acc.push({
        id: `af-fixture-${fixture.fixture.id}`,
        stage: stageFromRound(fixture.league.round),
        dateUtc: fixture.fixture.date,
        homeTeamId,
        awayTeamId,
        status: statusFromShort(fixture.fixture.status.short),
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
        events: [],
      });

      return acc;
    }, []);

    if (!teams.length || !mappedFixtures.length) {
      return {
        provider: "api-football",
        ok: false,
        diagnostic: createProviderDiagnostic("api-football", "error", "API-Football returned no usable teams or fixtures.", {
          teamCount: teams.length,
          fixtureCount: mappedFixtures.length,
          validation: "normalized-data",
        }),
      };
    }

    const [topScorers, topAssists, topYellowCards, topRedCards] = await Promise.all([
      fetchOptionalTopPlayers(`https://${host}/players/topscorers?league=${league}&season=${season}`, headers),
      fetchOptionalTopPlayers(`https://${host}/players/topassists?league=${league}&season=${season}`, headers),
      fetchOptionalTopPlayers(`https://${host}/players/topyellowcards?league=${league}&season=${season}`, headers),
      fetchOptionalTopPlayers(`https://${host}/players/topredcards?league=${league}&season=${season}`, headers),
    ]);

    const players = mergePlayers([topScorers, topAssists, topYellowCards, topRedCards], teamByApiId);
    const hasPlayerCoverage = [topScorers, topAssists, topYellowCards, topRedCards].some((feed) => Array.isArray(feed) && feed.length > 0);
    const message = hasPlayerCoverage
      ? "Loaded snapshot from API-Football with player leaderboards."
      : "Loaded snapshot from API-Football, but player leaderboards were unavailable.";

    return {
      provider: "api-football",
      ok: true,
      data: {
        source: "api-football",
        teams,
        fixtures: mappedFixtures,
        players,
      },
      diagnostic: createProviderDiagnostic("api-football", "success", message, {
        teamCount: teams.length,
        fixtureCount: mappedFixtures.length,
        playerCount: players.length,
      }),
    };
  } catch (error) {
    return {
      provider: "api-football",
      ok: false,
      diagnostic: createProviderDiagnostic(
        "api-football",
        "error",
        error instanceof Error ? error.message : "Unknown API-Football error.",
      ),
    };
  }
};
