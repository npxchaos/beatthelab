export type MatchStage = "group" | "round_of_16" | "quarter" | "semi" | "final";

export type MatchStatus = "scheduled" | "live" | "finished";

export type EventType = "goal" | "assist" | "yellow" | "red" | "injury";

export type SnapshotSource = "mock" | "api-football" | "football-data";

export type ProviderPreference = SnapshotSource | "hybrid";

export type ProviderDiagnosticStatus = "success" | "fallback" | "skipped" | "error";

export interface Player {
  id: string;
  teamId: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  status: "available" | "doubtful" | "injured" | "suspended";
  overall?: number;
  photoUrl?: string;
}

export interface Team {
  id: string;
  slug: string;
  name: string;
  group: string;
  confederation: string;
  powerIndex: number;
  formIndex: number;
  goalsFor: number;
  goalsAgainst: number;
  flagCode?: string;
}

export interface MatchEvent {
  minute: number;
  type: EventType;
  playerId: string;
  teamId: string;
  detail: string;
}

export interface Fixture {
  id: string;
  stage: MatchStage;
  dateUtc: string;
  homeTeamId: string;
  awayTeamId: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  events: MatchEvent[];
}

export interface TeamStanding {
  teamId: string;
  group: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface TeamForecast {
  teamId: string;
  championProbability: number;
  finalistProbability: number;
  semifinalProbability: number;
  groupQualificationProbability: number;
  volatilityScore: number;
  pathDifficulty: number;
  confidenceScore: number;
}

export interface PlayerForecast {
  playerId: string;
  topScorerProbability: number;
  topAssistProbability: number;
  topCardsProbability: number;
  breakoutProbability: number;
}

export interface AgentInsight {
  id: string;
  agent: "Schedule Agent" | "Strength Agent" | "Player Signal Agent" | "Scenario Agent" | "Narrative Agent" | "Risk Agent" | "Path Agent";
  severity: "info" | "warning" | "critical";
  createdAt: string;
  summary: string;
  impact: string;
}

export interface ProviderDiagnostic {
  provider: SnapshotSource;
  status: ProviderDiagnosticStatus;
  checkedAt: string;
  message: string;
  meta?: {
    httpStatus?: number;
    fixtureCount?: number;
    playerCount?: number;
    teamCount?: number;
    validation?: string;
  };
}

export interface SnapshotDiagnostics {
  providerPreference: ProviderPreference;
  selectedProvider: SnapshotSource;
  cacheTtlMinutes: number;
  attempts: ProviderDiagnostic[];
}

export interface TournamentSnapshot {
  generatedAt: string;
  source: SnapshotSource;
  teams: Team[];
  players: Player[];
  fixtures: Fixture[];
  standings: TeamStanding[];
  teamForecasts: TeamForecast[];
  playerForecasts: PlayerForecast[];
  agentInsights: AgentInsight[];
  diagnostics: SnapshotDiagnostics;
}

export interface ScenarioPick {
  fixtureId: string;
  outcome: "home" | "draw" | "away";
}
