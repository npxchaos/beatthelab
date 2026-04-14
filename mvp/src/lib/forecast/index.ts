/**
 * Forecast Engine — Main Entry Point
 * ------------------------------------
 * Orchestrates the full pipeline:
 * 1. Load teams + live results from cache (Supabase)
 * 2. Run Monte Carlo simulation
 * 3. Compute derived intelligence metrics
 * 4. Return complete ForecastOutput ready to cache and serve
 *
 * Usage:
 *   import { runForecast, runScenarioForecast } from '@/lib/forecast';
 *
 *   // Full tournament forecast (call from cron/API route)
 *   const output = await runForecast({ simulations: 10_000 });
 *
 *   // Scenario: what if Brazil loses their first match?
 *   const scenario = await runScenarioForecast({
 *     teamAId: 'BRA', teamBId: 'TBD_B3',
 *     goalsA: 0, goalsB: 1,
 *   });
 */

import { fifaRankToElo, type Team } from './elo';
import { runMonteCarlo, runScenario, type ForecastOutput, type MonteCarloInput, type PlayerInput } from './monteCarlo';
import { buildAllTeamIntelligence, buildMatchIntelligence } from './metrics';
import type { MatchResult } from './tournament';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ForecastRunOptions {
  simulations?: number;
  seed?: number;
  teams?: Team[];           // Override default seeded teams
  players?: PlayerInput[];
  liveResults?: MatchResult[];
}

export interface ScenarioInput {
  teamAId: string;
  teamBId: string;
  goalsA: number;
  goalsB: number;
  simulations?: number;
}

export interface FullForecastResult {
  forecast: ForecastOutput;
  intelligence: ReturnType<typeof buildAllTeamIntelligence>;
  computedAt: string;
}

export interface ScenarioResult {
  baseline: ForecastOutput;
  scenario: ForecastOutput;
  delta: Record<string, { championDelta: number; groupQualDelta: number }>;
  topMovers: Array<{
    teamId: string;
    direction: 'UP' | 'DOWN';
    championDelta: number;
    groupQualDelta: number;
  }>;
}

// ─── Default Team Seed Data ───────────────────────────────────────────────────

/**
 * Default 2026 World Cup teams with estimated Elo ratings.
 * Replace this with data fetched from football-data.org once
 * the full qualification list is confirmed.
 *
 * Groups A–L, 4 teams each = 48 teams total.
 * TBD entries use representative ratings for their confederation strength.
 */
export function getDefaultTeams(): Team[] {
  return [
    // Group A (Host group)
    { id: 'USA', name: 'United States',      shortName: 'USA',    group: 'A', eloRating: fifaRankToElo(14), fifaRanking: 14 },
    { id: 'MEX', name: 'Mexico',             shortName: 'Mexico', group: 'A', eloRating: fifaRankToElo(15), fifaRanking: 15 },
    { id: 'CAN', name: 'Canada',             shortName: 'Canada', group: 'A', eloRating: fifaRankToElo(47), fifaRanking: 47 },
    { id: 'JAM', name: 'Jamaica',            shortName: 'Jamaica',group: 'A', eloRating: fifaRankToElo(53), fifaRanking: 53 },

    // Group B
    { id: 'ARG', name: 'Argentina',          shortName: 'Argentina', group: 'B', eloRating: fifaRankToElo(1),  fifaRanking: 1 },
    { id: 'BRA', name: 'Brazil',             shortName: 'Brazil',    group: 'B', eloRating: fifaRankToElo(5),  fifaRanking: 5 },
    { id: 'COL', name: 'Colombia',           shortName: 'Colombia',  group: 'B', eloRating: fifaRankToElo(11), fifaRanking: 11 },
    { id: 'URU', name: 'Uruguay',            shortName: 'Uruguay',   group: 'B', eloRating: fifaRankToElo(13), fifaRanking: 13 },

    // Group C
    { id: 'FRA', name: 'France',             shortName: 'France',  group: 'C', eloRating: fifaRankToElo(2),  fifaRanking: 2 },
    { id: 'BEL', name: 'Belgium',            shortName: 'Belgium', group: 'C', eloRating: fifaRankToElo(3),  fifaRanking: 3 },
    { id: 'NED', name: 'Netherlands',        shortName: 'Netherlands', group: 'C', eloRating: fifaRankToElo(7), fifaRanking: 7 },
    { id: 'SEN', name: 'Senegal',            shortName: 'Senegal', group: 'C', eloRating: fifaRankToElo(20), fifaRanking: 20 },

    // Group D
    { id: 'ENG', name: 'England',            shortName: 'England', group: 'D', eloRating: fifaRankToElo(4),  fifaRanking: 4 },
    { id: 'POR', name: 'Portugal',           shortName: 'Portugal',group: 'D', eloRating: fifaRankToElo(6),  fifaRanking: 6 },
    { id: 'CRO', name: 'Croatia',            shortName: 'Croatia', group: 'D', eloRating: fifaRankToElo(9),  fifaRanking: 9 },
    { id: 'MAR', name: 'Morocco',            shortName: 'Morocco', group: 'D', eloRating: fifaRankToElo(16), fifaRanking: 16 },

    // Group E
    { id: 'ESP', name: 'Spain',              shortName: 'Spain',   group: 'E', eloRating: fifaRankToElo(8),  fifaRanking: 8 },
    { id: 'GER', name: 'Germany',            shortName: 'Germany', group: 'E', eloRating: fifaRankToElo(12), fifaRanking: 12 },
    { id: 'JPN', name: 'Japan',              shortName: 'Japan',   group: 'E', eloRating: fifaRankToElo(17), fifaRanking: 17 },
    { id: 'KOR', name: 'South Korea',        shortName: 'Korea',   group: 'E', eloRating: fifaRankToElo(23), fifaRanking: 23 },

    // Group F
    { id: 'ITA', name: 'Italy',              shortName: 'Italy',   group: 'F', eloRating: fifaRankToElo(10), fifaRanking: 10 },
    { id: 'SUI', name: 'Switzerland',        shortName: 'Switzerland', group: 'F', eloRating: fifaRankToElo(19), fifaRanking: 19 },
    { id: 'POL', name: 'Poland',             shortName: 'Poland',  group: 'F', eloRating: fifaRankToElo(21), fifaRanking: 21 },
    { id: 'NGA', name: 'Nigeria',            shortName: 'Nigeria', group: 'F', eloRating: fifaRankToElo(29), fifaRanking: 29 },

    // Group G
    { id: 'MEX_dup', name: 'Mexico (placeholder G)',shortName: 'MEX-G', group: 'G', eloRating: 1620, fifaRanking: 22 }, // Will be corrected with real data
    { id: 'AUS', name: 'Australia',          shortName: 'Australia', group: 'G', eloRating: fifaRankToElo(25), fifaRanking: 25 },
    { id: 'GHA', name: 'Ghana',              shortName: 'Ghana',   group: 'G', eloRating: fifaRankToElo(60), fifaRanking: 60 },
    { id: 'KSA', name: 'Saudi Arabia',       shortName: 'KSA',     group: 'G', eloRating: fifaRankToElo(56), fifaRanking: 56 },

    // Groups H–L: Representative placeholders — replace with real 2026 qualifiers
    { id: 'ECU', name: 'Ecuador',            shortName: 'Ecuador',  group: 'H', eloRating: fifaRankToElo(35), fifaRanking: 35 },
    { id: 'CHL', name: 'Chile',              shortName: 'Chile',    group: 'H', eloRating: fifaRankToElo(40), fifaRanking: 40 },
    { id: 'EGY', name: 'Egypt',              shortName: 'Egypt',    group: 'H', eloRating: fifaRankToElo(34), fifaRanking: 34 },
    { id: 'TUN', name: 'Tunisia',            shortName: 'Tunisia',  group: 'H', eloRating: fifaRankToElo(30), fifaRanking: 30 },

    { id: 'MEX2', name: 'Mexico (H)', shortName: 'MEX2', group: 'I', eloRating: 1500, fifaRanking: 50 }, // Placeholder
    { id: 'CMR', name: 'Cameroon',           shortName: 'Cameroon', group: 'I', eloRating: fifaRankToElo(38), fifaRanking: 38 },
    { id: 'SRB', name: 'Serbia',             shortName: 'Serbia',   group: 'I', eloRating: fifaRankToElo(32), fifaRanking: 32 },
    { id: 'IRN', name: 'Iran',               shortName: 'Iran',     group: 'I', eloRating: fifaRankToElo(28), fifaRanking: 28 },

    { id: 'DEN', name: 'Denmark',            shortName: 'Denmark',  group: 'J', eloRating: fifaRankToElo(18), fifaRanking: 18 },
    { id: 'AUT', name: 'Austria',            shortName: 'Austria',  group: 'J', eloRating: fifaRankToElo(24), fifaRanking: 24 },
    { id: 'ALG', name: 'Algeria',            shortName: 'Algeria',  group: 'J', eloRating: fifaRankToElo(36), fifaRanking: 36 },
    { id: 'ANG', name: 'Angola',             shortName: 'Angola',   group: 'J', eloRating: fifaRankToElo(70), fifaRanking: 70 },

    { id: 'SWE', name: 'Sweden',             shortName: 'Sweden',   group: 'K', eloRating: fifaRankToElo(26), fifaRanking: 26 },
    { id: 'UKR', name: 'Ukraine',            shortName: 'Ukraine',  group: 'K', eloRating: fifaRankToElo(22), fifaRanking: 22 },
    { id: 'MEX3', name: 'Mexico K', shortName: 'MEX3', group: 'K', eloRating: 1480, fifaRanking: 52 }, // Placeholder
    { id: 'QAT', name: 'Qatar',              shortName: 'Qatar',    group: 'K', eloRating: fifaRankToElo(58), fifaRanking: 58 },

    { id: 'GRE', name: 'Greece',             shortName: 'Greece',   group: 'L', eloRating: fifaRankToElo(44), fifaRanking: 44 },
    { id: 'CZE', name: 'Czech Republic',     shortName: 'Czech Rep',group: 'L', eloRating: fifaRankToElo(27), fifaRanking: 27 },
    { id: 'VEN', name: 'Venezuela',          shortName: 'Venezuela',group: 'L', eloRating: fifaRankToElo(45), fifaRanking: 45 },
    { id: 'PAR', name: 'Paraguay',           shortName: 'Paraguay', group: 'L', eloRating: fifaRankToElo(62), fifaRanking: 62 },
  ];
}

// ─── Main Forecast Function ───────────────────────────────────────────────────

/**
 * Run the full forecast pipeline.
 * This is the function called by the cron job or API route.
 */
export function runForecast(options: ForecastRunOptions = {}): FullForecastResult {
  const {
    simulations = 10_000,
    seed,
    players = [],
    liveResults = [],
  } = options;

  const teams = options.teams ?? getDefaultTeams();

  const input: MonteCarloInput = {
    teams,
    players,
    liveResults,
    simulations,
    seed,
  };

  const forecast = runMonteCarlo(input);
  const intelligence = buildAllTeamIntelligence(teams, forecast);

  return {
    forecast,
    intelligence,
    computedAt: forecast.computedAt,
  };
}

// ─── Scenario Forecast ────────────────────────────────────────────────────────

/**
 * Run a scenario comparison.
 * Used by the Scenario Simulator feature.
 */
export function runScenarioForecast(
  scenarioInput: ScenarioInput,
  baseOptions: ForecastRunOptions = {}
): ScenarioResult {
  const teams = baseOptions.teams ?? getDefaultTeams();
  const simulations = scenarioInput.simulations ?? 5_000;

  const baseMonteCarloInput: MonteCarloInput = {
    teams,
    players: baseOptions.players ?? [],
    liveResults: baseOptions.liveResults ?? [],
    simulations,
    seed: baseOptions.seed,
  };

  const forcedResult: MatchResult = {
    teamAId: scenarioInput.teamAId,
    teamBId: scenarioInput.teamBId,
    goalsA: scenarioInput.goalsA,
    goalsB: scenarioInput.goalsB,
    stage: 'group',
  };

  const { baseline, scenario, delta } = runScenario(
    baseMonteCarloInput,
    forcedResult,
    simulations
  );

  // Identify top movers
  const topMovers = Object.entries(delta)
    .filter(([, d]) => Math.abs(d.championDelta) > 0.001)
    .sort(([, a], [, b]) => Math.abs(b.championDelta) - Math.abs(a.championDelta))
    .slice(0, 5)
    .map(([teamId, d]) => ({
      teamId,
      direction: d.championDelta >= 0 ? 'UP' as const : 'DOWN' as const,
      championDelta: Number(d.championDelta.toFixed(4)),
      groupQualDelta: Number(d.groupQualDelta.toFixed(4)),
    }));

  return { baseline, scenario, delta, topMovers };
}

// ─── Match Preview ────────────────────────────────────────────────────────────

/**
 * Quick match intelligence for a specific fixture.
 * Used by the fixtures list and pre-match preview cards.
 */
export function getMatchIntelligence(teamAId: string, teamBId: string, teams?: Team[]) {
  const allTeams = teams ?? getDefaultTeams();
  const teamA = allTeams.find(t => t.id === teamAId);
  const teamB = allTeams.find(t => t.id === teamBId);

  if (!teamA || !teamB) {
    throw new Error(`Teams not found: ${teamAId}, ${teamBId}`);
  }

  return buildMatchIntelligence(teamA, teamB);
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type {
  ForecastOutput,
  TeamForecast,
  PlayerForecast,
  PlayerInput,
  MonteCarloInput,
} from './monteCarlo';

export type {
  TeamIntelligence,
  MatchIntelligence,
  PlayerDisciplineRisk,
  Signal,
  RiskLevel,
} from './metrics';

export type { Team, MatchProbability, EloUpdateResult } from './elo';
export type { MatchResult, TournamentOutcome } from './tournament';
export { fifaRankToElo, threeWayProbability, formatProb } from './elo';
export { buildDisciplineRisk } from './metrics';
