import { Fixture, Team } from "@/lib/types";
import { createProviderDiagnostic, isRecord, ProviderFetchResult, slugify } from "@/lib/providers/shared";

// ─── football-data.org local types ───────────────────────────────────────────

type FDTeam = {
  id: number;
  name: string;
  shortName: string | null;
  tla: string;
  crest: string;
};

// Knockout matches use all-null placeholder teams until pairings are determined
type FDTeamRef = { id: number | null; name: string | null; shortName: string | null; tla: string | null; crest: string | null };

type FDMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: FDTeamRef;
  awayTeam: FDTeamRef;
  score: { fullTime: { home: number | null; away: number | null } };
};

type FDStanding = {
  type: string;
  group: string;
  table: {
    position: number;
    points: number;
    won: number;
    draw: number;
    lost: number;
    playedGames: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    team: FDTeam;
  }[];
};

export interface FootballDataNormalized {
  source: "football-data";
  teams: Team[];
  fixtures: Fixture[];
}

// ─── Validators ───────────────────────────────────────────────────────────────

const isFDTeam = (v: unknown): v is FDTeam =>
  isRecord(v) &&
  typeof v.id === "number" &&
  typeof v.name === "string" &&
  (typeof v.shortName === "string" || v.shortName === null) &&
  typeof v.tla === "string";

const isFDStanding = (v: unknown): v is FDStanding =>
  isRecord(v) &&
  typeof v.group === "string" &&
  Array.isArray(v.table) &&
  v.table.every(
    (row) =>
      isRecord(row) &&
      typeof row.position === "number" &&
      typeof row.points === "number" &&
      typeof row.won === "number" &&
      typeof row.draw === "number" &&
      typeof row.lost === "number" &&
      typeof row.playedGames === "number" &&
      typeof row.goalsFor === "number" &&
      typeof row.goalsAgainst === "number" &&
      isFDTeam(row.team),
  );

const isFDTeamRef = (v: unknown): v is FDTeamRef =>
  isRecord(v) &&
  (typeof v.id === "number" || v.id === null);

const isFDMatch = (v: unknown): v is FDMatch =>
  isRecord(v) &&
  typeof v.id === "number" &&
  typeof v.utcDate === "string" &&
  typeof v.status === "string" &&
  typeof v.stage === "string" &&
  isFDTeamRef(v.homeTeam) &&
  isFDTeamRef(v.awayTeam) &&
  isRecord(v.score) &&
  isRecord(v.score.fullTime) &&
  (typeof v.score.fullTime.home === "number" || v.score.fullTime.home === null) &&
  (typeof v.score.fullTime.away === "number" || v.score.fullTime.away === null);

// ─── Normalization helpers ────────────────────────────────────────────────────

const normalizeStatus = (s: string): Fixture["status"] => {
  if (s === "FINISHED") return "finished";
  if (s === "IN_PLAY" || s === "PAUSED" || s === "HALFTIME") return "live";
  return "scheduled";
};

const normalizeStage = (stage: string): Fixture["stage"] => {
  const v = stage.toLowerCase();
  if (v.includes("group")) return "group";
  if (v.includes("last_16") || v.includes("round_of_16")) return "round_of_16";
  if (v.includes("quarter")) return "quarter";
  if (v.includes("semi")) return "semi";
  return "final";
};

// "Group A" | "GROUP_A" → "A"
const normalizeGroup = (raw: string): string =>
  raw.replace(/^(?:GROUP_|Group\s*)/i, "").trim();

// ─── TLA → flagcdn.com 2-letter code ─────────────────────────────────────────

const TLA_FLAG: Record<string, string> = {
  ALG: "dz", ARG: "ar", AUS: "au", AUT: "at",
  BEL: "be", BIH: "ba", BRA: "br",
  CAN: "ca", CIV: "ci", COD: "cd", COL: "co", CPV: "cv", CRO: "hr", CUR: "cw", CZE: "cz",
  ECU: "ec", EGY: "eg", ENG: "gb-eng", ESP: "es",
  FRA: "fr",
  GER: "de", GHA: "gh",
  HAI: "ht",
  IRN: "ir", IRQ: "iq",
  JOR: "jo", JPN: "jp",
  KOR: "kr", KSA: "sa",
  MAR: "ma", MEX: "mx",
  NED: "nl", NOR: "no", NZL: "nz",
  PAN: "pa", PAR: "py", POR: "pt",
  QAT: "qa",
  RSA: "za",
  SCO: "gb-sct", SEN: "sn", SUI: "ch", SWE: "se",
  TUN: "tn", TUR: "tr",
  URU: "uy", USA: "us", UZB: "uz",
};

// ─── TLA → approximate power index (FIFA ranking-based, WC 2026 field) ───────

const TLA_POWER: Record<string, number> = {
  ARG: 94, FRA: 92, ESP: 91, ENG: 90, BRA: 89, POR: 88,
  BEL: 85, NED: 84, GER: 83, COL: 82, URU: 81,
  CRO: 80, MAR: 80, JPN: 79, MEX: 79, SUI: 78, SEN: 78,
  TUR: 77, USA: 77, KOR: 77, AUS: 76, ECU: 75,
  QAT: 74, IRN: 73, NOR: 72, SWE: 71, ALG: 71,
  GHA: 70, EGY: 70, KSA: 69, CIV: 69, SCO: 68, PAN: 68,
  CZE: 67, AUT: 67, TUN: 66, IRQ: 65, PAR: 65,
  JOR: 64, UZB: 63, CPV: 62, NZL: 62, COD: 62,
  BIH: 61, RSA: 60, HAI: 58, CUR: 57,
};

// ─── Main fetcher ─────────────────────────────────────────────────────────────

export const fetchFootballDataSnapshot = async (): Promise<ProviderFetchResult<"football-data">> => {
  const token = process.env.FOOTBALL_DATA_KEY;
  if (!token) {
    return {
      provider: "football-data",
      ok: false,
      diagnostic: createProviderDiagnostic("football-data", "skipped", "FOOTBALL_DATA_KEY is not configured."),
    };
  }

  const competition = process.env.FOOTBALL_DATA_COMPETITION ?? "WC";
  const baseUrl = process.env.FOOTBALL_DATA_BASE_URL ?? "https://api.football-data.org/v4";
  const headers = { "X-Auth-Token": token };

  try {
    const [standingsRes, matchesRes] = await Promise.all([
      fetch(`${baseUrl}/competitions/${competition}/standings`, { headers }),
      fetch(`${baseUrl}/competitions/${competition}/matches`, { headers }),
    ]);

    if (!standingsRes.ok) {
      return {
        provider: "football-data",
        ok: false,
        diagnostic: createProviderDiagnostic("football-data", "error", `football-data.org standings request failed (${standingsRes.status}).`, {
          httpStatus: standingsRes.status,
        }),
      };
    }

    if (!matchesRes.ok) {
      return {
        provider: "football-data",
        ok: false,
        diagnostic: createProviderDiagnostic("football-data", "error", `football-data.org matches request failed (${matchesRes.status}).`, {
          httpStatus: matchesRes.status,
        }),
      };
    }

    const standingsJson = await standingsRes.json();
    const matchesJson   = await matchesRes.json();

    // Parse and validate
    if (!isRecord(standingsJson) || !Array.isArray(standingsJson.standings)) {
      return {
        provider: "football-data",
        ok: false,
        diagnostic: createProviderDiagnostic("football-data", "error", "Standings payload has unexpected shape."),
      };
    }

    // Filter TOTAL type only (exclude HOME/AWAY splits)
    const rawStandings = (standingsJson.standings as unknown[]).filter(
      (s) => isRecord(s) && s.type === "TOTAL",
    );
    if (!rawStandings.every(isFDStanding)) {
      return {
        provider: "football-data",
        ok: false,
        diagnostic: createProviderDiagnostic("football-data", "error", "Standings rows failed validation."),
      };
    }
    const standings = rawStandings as FDStanding[];

    if (!isRecord(matchesJson) || !Array.isArray(matchesJson.matches)) {
      return {
        provider: "football-data",
        ok: false,
        diagnostic: createProviderDiagnostic("football-data", "error", "Matches payload has unexpected shape."),
      };
    }
    if (!matchesJson.matches.every(isFDMatch)) {
      return {
        provider: "football-data",
        ok: false,
        diagnostic: createProviderDiagnostic("football-data", "error", "Match rows failed validation."),
      };
    }
    const matches = matchesJson.matches as FDMatch[];

    // Build teams from standings (TOTAL rows = one entry per team per group)
    const teamRows = standings.flatMap((grp) =>
      grp.table.map((row) => ({
        fdTeam:       row.team,
        group:        normalizeGroup(grp.group),
        points:       row.points,
        position:     row.position,
        goalsFor:     row.goalsFor,
        goalsAgainst: row.goalsAgainst,
      })),
    );

    const teams: Team[] = teamRows.map((row) => {
      const tla = row.fdTeam.tla;
      const power = TLA_POWER[tla] ?? 65;
      return {
        id:           `fd-${row.fdTeam.id}`,
        slug:         slugify(row.fdTeam.shortName ?? row.fdTeam.name),
        name:         row.fdTeam.name,
        group:        row.group,
        confederation: "Unknown",
        powerIndex:   power,
        formIndex:    Math.max(55, power - 3 + (row.points * 2)),
        goalsFor:     row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        flagCode:     TLA_FLAG[tla],
      };
    });

    const teamIdMap = new Map(teamRows.map((row) => [row.fdTeam.id, `fd-${row.fdTeam.id}`]));

    const fixtures = matches.reduce<Fixture[]>((acc, match) => {
      const { id: homeId } = match.homeTeam;
      const { id: awayId } = match.awayTeam;
      // TBD placeholder matches (knockout stage before draw) have null team ids
      if (homeId === null || awayId === null) return acc;
      const homeTeamId = teamIdMap.get(homeId);
      const awayTeamId = teamIdMap.get(awayId);
      if (!homeTeamId || !awayTeamId) return acc;

      acc.push({
        id:          `fd-${match.id}`,
        stage:       normalizeStage(match.stage),
        dateUtc:     match.utcDate,
        homeTeamId,
        awayTeamId,
        status:      normalizeStatus(match.status),
        homeScore:   match.score.fullTime.home,
        awayScore:   match.score.fullTime.away,
        events:      [],
      });

      return acc;
    }, []);

    if (!teams.length || !fixtures.length) {
      return {
        provider: "football-data",
        ok: false,
        diagnostic: createProviderDiagnostic("football-data", "error", "No usable teams or fixtures after normalization.", {
          teamCount:    teams.length,
          fixtureCount: fixtures.length,
        }),
      };
    }

    return {
      provider: "football-data",
      ok: true,
      data: {
        source:   "football-data",
        teams,
        fixtures,
        players:  [],
      },
      diagnostic: createProviderDiagnostic("football-data", "success", "Loaded live snapshot from football-data.org.", {
        teamCount:    teams.length,
        fixtureCount: fixtures.length,
      }),
    };

  } catch (error) {
    return {
      provider: "football-data",
      ok: false,
      diagnostic: createProviderDiagnostic(
        "football-data",
        "error",
        error instanceof Error ? error.message : "Unknown football-data.org error.",
      ),
    };
  }
};
