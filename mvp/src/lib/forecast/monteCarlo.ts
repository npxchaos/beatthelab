/**
 * Monte Carlo Engine
 * ------------------
 * Runs N simulations of the full tournament and aggregates
 * probability distributions for every team and player market.
 *
 * Default: 10,000 simulations (takes ~200ms in Node.js)
 * For live server: 5,000 simulations
 * For quick preview: 1,000 simulations
 *
 * Output is the core data structure powering every prediction
 * displayed on the Global Football Prediction Lab.
 */

import { type Team } from './elo';
import { simulateTournament, type MatchResult as TournamentMatchResult, type TournamentOutcome } from './tournament';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeamForecast {
  teamId: string;

  // Outright probabilities
  championProb: number;           // P(win tournament)
  finalistProb: number;           // P(reach final)
  semifinalistProb: number;       // P(reach semi)
  quarterFinalistProb: number;    // P(reach QF)
  roundOf16Prob: number;          // P(reach R16)
  groupQualProb: number;          // P(exit group stage as 1st or 2nd)
  groupWinProb: number;           // P(win group)

  // Derived intelligence metrics
  volatility: number;             // Std deviation of advancement stage (0–1)
  pathDifficulty: number;         // Average Elo of simulated opponents (0–1 normalized)
  chaosIndex: number;             // How often the model produces surprising results (0–1)
  confidenceScore: number;        // Inverse of volatility (1 = very confident)

  // Distribution data for charts
  stageDistribution: {
    groupExit: number;
    roundOf32Exit: number;
    roundOf16Exit: number;
    quarterFinalExit: number;
    semiFinalExit: number;
    finalist: number;
    champion: number;
  };
}

export interface PlayerForecast {
  playerId: string;
  name: string;
  teamId: string;
  currentGoals: number;

  // Probability of achieving milestone
  topScorerProb: number;          // P(finish as top scorer)
  reaches6Goals: number;          // P(score 6+ goals)
  reaches3Goals: number;          // P(score 3+ goals in group)
  breakoutSignal: number;         // 0–1: likelihood of being a "breakout" player

  // Projected total goals (expected value)
  projectedGoals: number;
}

export interface ForecastOutput {
  computedAt: string;             // ISO timestamp
  simulationCount: number;
  teams: Record<string, TeamForecast>;
  topScorerRanking: PlayerForecast[];
  globalChaosIndex: number;       // Tournament-level chaos (avg upsets per sim)
  modelConfidence: number;        // How tight most distributions are (0–1)
  metadata: {
    eloSpread: number;            // Max - min Elo (high = uneven tournament)
    favoriteChampionProb: number; // Probability of the favorite winning
  };
}

export interface MonteCarloInput {
  teams: Team[];
  players?: PlayerInput[];
  liveResults?: TournamentMatchResult[];
  simulations?: number;
  seed?: number;                  // For reproducible results
}

export interface PlayerInput {
  id: string;
  name: string;
  teamId: string;
  currentGoals: number;
  currentAssists: number;
  minutesPlayed: number;
  matchesPlayed: number;
  xGPerMatch?: number;            // From StatsBomb calibration
  ageGroup?: 'young' | 'peak' | 'veteran';  // Affects breakout calculation
}

// ─── Seeded RNG (Mulberry32) ──────────────────────────────────────────────────

/**
 * Deterministic pseudo-random number generator.
 * Same seed → same results every time (critical for reproducible forecasts).
 */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Stage Encoding ───────────────────────────────────────────────────────────

function outcomeToStageScore(
  teamId: string,
  outcome: TournamentOutcome
): number {
  if (outcome.champion === teamId)                         return 7;
  if (outcome.finalist === teamId)                         return 6;
  if (outcome.semis.includes(teamId))                      return 5;
  if (outcome.quarterFinals.includes(teamId))              return 4;
  if (outcome.roundOf16.includes(teamId))                  return 3;

  // Check group qualification
  for (const [, qualified] of Object.entries(outcome.groupQualified)) {
    if (qualified.includes(teamId))                        return 2;
  }

  // Check group winner
  for (const [, winner] of Object.entries(outcome.groupWinners)) {
    if (winner === teamId)                                 return 2; // At least group qualified
  }

  return 1; // Group exit
}

// ─── Core Monte Carlo Runner ──────────────────────────────────────────────────

/**
 * Run N Monte Carlo simulations and aggregate results into probability distributions.
 */
export function runMonteCarlo(input: MonteCarloInput): ForecastOutput {
  const {
    teams,
    players = [],
    liveResults = [],
    simulations = 10_000,
    seed = Date.now(),
  } = input;

  const rng = mulberry32(seed);

  // ── Accumulation counters ──
  const counts: Record<string, {
    champion: number;
    finalist: number;
    semi: number;
    qf: number;
    r16: number;
    groupQual: number;
    groupWin: number;
    stageScores: number[];        // For std dev calculation
  }> = {};

  for (const team of teams) {
    counts[team.id] = {
      champion: 0, finalist: 0, semi: 0, qf: 0,
      r16: 0, groupQual: 0, groupWin: 0,
      stageScores: [],
    };
  }

  // ── Player goal tracking ──
  const playerGoalSums: Record<string, number[]> = {};
  for (const p of players) {
    playerGoalSums[p.id] = [];
  }

  let totalChaosEvents = 0;

  // ── Run simulations ──
  for (let i = 0; i < simulations; i++) {
    const outcome = simulateTournament(teams, liveResults, rng);

    // Track team outcomes
    for (const team of teams) {
      const c = counts[team.id];
      const stageScore = outcomeToStageScore(team.id, outcome);
      c.stageScores.push(stageScore);

      if (outcome.champion === team.id) c.champion++;
      if (outcome.finalist === team.id || outcome.champion === team.id) c.finalist++;
      if (outcome.semis.includes(team.id))       c.semi++;
      if (outcome.quarterFinals.includes(team.id)) c.qf++;
      if (outcome.roundOf16.includes(team.id))   c.r16++;

      for (const qualified of Object.values(outcome.groupQualified)) {
        if (qualified.includes(team.id)) { c.groupQual++; break; }
      }

      for (const winner of Object.values(outcome.groupWinners)) {
        if (winner === team.id) { c.groupWin++; break; }
      }
    }

    // Count upsets (lower-rated team wins final)
    if (outcome.champion) {
      const champTeam = teams.find(t => t.id === outcome.champion);
      const favTeam = teams.reduce((best, t) => t.eloRating > best.eloRating ? t : best);
      if (champTeam && favTeam && champTeam.id !== favTeam.id) {
        totalChaosEvents++;
      }
    }

    // Player goal projection
    for (const player of players) {
      const team = teams.find(t => t.id === player.teamId);
      if (!team) continue;

      const stageScore = outcomeToStageScore(player.teamId, outcome);
      // Matches played proportional to stage reached
      const projectedMatches = [0, 3, 4, 5, 6, 7, 7][Math.min(stageScore, 6)];
      const goalsPerMatch = player.currentGoals > 0
        ? player.currentGoals / Math.max(player.matchesPlayed, 1)
        : (player.xGPerMatch ?? 0.3);

      const projectedAdditionalGoals = goalsPerMatch * Math.max(projectedMatches - player.matchesPlayed, 0);
      const totalProjected = player.currentGoals + Math.round(projectedAdditionalGoals * (0.7 + rng() * 0.6));
      playerGoalSums[player.id].push(totalProjected);
    }
  }

  // ── Aggregate Results ──
  const N = simulations;
  const teamForecasts: Record<string, TeamForecast> = {};

  // Calculate Elo spread for metadata
  const eloValues = teams.map(t => t.eloRating);
  const eloSpread = Math.max(...eloValues) - Math.min(...eloValues);

  for (const team of teams) {
    const c = counts[team.id];
    const scores = c.stageScores;

    // Standard deviation of stage scores (1–7 scale)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const volatility = Math.min(stdDev / 3, 1); // Normalize to 0–1

    const confidenceScore = Number((1 - volatility).toFixed(3));

    // Path difficulty: how high-rated are the opponents this team faces on average
    // Approximated via their own rating vs tournament avg
    const avgElo = eloValues.reduce((a, b) => a + b, 0) / eloValues.length;
    const pathDifficulty = Number(
      Math.min((avgElo + 50) / team.eloRating, 1).toFixed(3)
    );

    // Chaos index: how often this team outperforms their Elo expectation
    const expectedGroupQual = 1 / (1 + Math.pow(10, (avgElo - team.eloRating) / 400));
    const actualGroupQual = c.groupQual / N;
    const chaosIndex = Number(
      Math.min(Math.abs(actualGroupQual - expectedGroupQual) * 3, 1).toFixed(3)
    );

    // Stage exit distribution
    const stageDistribution = {
      groupExit:        Number(((N - c.groupQual) / N).toFixed(4)),
      roundOf32Exit:    Number(((c.groupQual - c.r16) / N).toFixed(4)),
      roundOf16Exit:    Number(((c.r16 - c.qf) / N).toFixed(4)),
      quarterFinalExit: Number(((c.qf - c.semi) / N).toFixed(4)),
      semiFinalExit:    Number(((c.semi - c.finalist) / N).toFixed(4)),
      finalist:         Number(((c.finalist - c.champion) / N).toFixed(4)),
      champion:         Number((c.champion / N).toFixed(4)),
    };

    teamForecasts[team.id] = {
      teamId: team.id,
      championProb:        Number((c.champion / N).toFixed(4)),
      finalistProb:        Number((c.finalist / N).toFixed(4)),
      semifinalistProb:    Number((c.semi / N).toFixed(4)),
      quarterFinalistProb: Number((c.qf / N).toFixed(4)),
      roundOf16Prob:       Number((c.r16 / N).toFixed(4)),
      groupQualProb:       Number((c.groupQual / N).toFixed(4)),
      groupWinProb:        Number((c.groupWin / N).toFixed(4)),
      volatility:          Number(volatility.toFixed(3)),
      pathDifficulty,
      chaosIndex,
      confidenceScore,
      stageDistribution,
    };
  }

  // ── Player Forecasts ──
  const playerForecasts: PlayerForecast[] = players.map(player => {
    const goals = playerGoalSums[player.id] ?? [];
    const avgGoals = goals.length > 0
      ? goals.reduce((a, b) => a + b, 0) / goals.length
      : player.currentGoals;

    // Top scorer proxy: probability of reaching 6+ goals (tournament scoring leader threshold)
    const topScorerGoalThreshold = 6;
    const topScorerProb = goals.filter(g => g >= topScorerGoalThreshold).length / Math.max(goals.length, 1);
    const reaches6Goals = topScorerProb;
    const reaches3Goals = goals.filter(g => g >= 3).length / Math.max(goals.length, 1);

    // Breakout signal: young player + underrated + high projected goals relative to current
    const teamForecast = teamForecasts[player.teamId];
    const breakoutSignal = player.ageGroup === 'young' && teamForecast
      ? Math.min(
          (avgGoals / Math.max(player.currentGoals + 1, 1)) *
          teamForecast.semifinalistProb * 3,
          1
        )
      : 0;

    return {
      playerId: player.id,
      name: player.name,
      teamId: player.teamId,
      currentGoals: player.currentGoals,
      topScorerProb: Number(topScorerProb.toFixed(4)),
      reaches6Goals: Number(reaches6Goals.toFixed(4)),
      reaches3Goals: Number(reaches3Goals.toFixed(4)),
      breakoutSignal: Number(breakoutSignal.toFixed(3)),
      projectedGoals: Number(avgGoals.toFixed(2)),
    };
  });

  // Sort by top scorer probability
  const topScorerRanking = playerForecasts
    .sort((a, b) => b.topScorerProb - a.topScorerProb || b.projectedGoals - a.projectedGoals);

  // ── Global Metrics ──
  const globalChaosIndex = Number((totalChaosEvents / N).toFixed(3));
  const allVolatilities = Object.values(teamForecasts).map(f => f.volatility);
  const modelConfidence = Number(
    (1 - allVolatilities.reduce((a, b) => a + b, 0) / allVolatilities.length).toFixed(3)
  );
  const favoriteChampionProb = Math.max(
    ...Object.values(teamForecasts).map(f => f.championProb)
  );

  return {
    computedAt: new Date().toISOString(),
    simulationCount: simulations,
    teams: teamForecasts,
    topScorerRanking,
    globalChaosIndex,
    modelConfidence,
    metadata: {
      eloSpread,
      favoriteChampionProb: Number(favoriteChampionProb.toFixed(4)),
    },
  };
}

// ─── Scenario Runner ──────────────────────────────────────────────────────────

/**
 * Run a "what-if" scenario: force a specific match result and re-run
 * the Monte Carlo to show how probabilities shift.
 *
 * Returns both the baseline forecast and the scenario forecast,
 * plus a delta object showing which teams gained/lost probability.
 */
export function runScenario(
  baseInput: MonteCarloInput,
  scenarioResult: TournamentMatchResult,
  simulations = 5_000
): {
  baseline: ForecastOutput;
  scenario: ForecastOutput;
  delta: Record<string, { championDelta: number; groupQualDelta: number }>;
} {
  const baseline = runMonteCarlo({ ...baseInput, simulations });
  const scenario = runMonteCarlo({
    ...baseInput,
    liveResults: [...(baseInput.liveResults ?? []), scenarioResult],
    simulations,
    seed: baseInput.seed ? baseInput.seed + 1 : Date.now(),
  });

  const delta: Record<string, { championDelta: number; groupQualDelta: number }> = {};
  for (const teamId of Object.keys(baseline.teams)) {
    const base = baseline.teams[teamId];
    const scen = scenario.teams[teamId];
    if (!base || !scen) continue;
    delta[teamId] = {
      championDelta:  Number((scen.championProb - base.championProb).toFixed(4)),
      groupQualDelta: Number((scen.groupQualProb - base.groupQualProb).toFixed(4)),
    };
  }

  return { baseline, scenario, delta };
}
