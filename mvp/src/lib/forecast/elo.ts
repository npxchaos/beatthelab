/**
 * Elo Rating Engine
 * -----------------
 * Standard Elo system adapted for international football.
 *
 * Key design decisions:
 * - D = 400 (standard chess scale — widely accepted for football)
 * - K-factor = 60 for World Cup matches (high stakes, less frequent)
 * - K-factor = 40 for major international (qualifiers, friendlies)
 * - Draw probability modeled via a "draw zone" around 0.5 expected score
 * - Goal margin multiplier (optional) to reflect dominant wins
 * - All matches treated as neutral venue (no home advantage at World Cup)
 */

export interface Team {
  id: string;
  name: string;
  shortName: string;
  group: string;           // "A" .. "L" (2026 has 12 groups)
  eloRating: number;
  fifaRanking?: number;
  flagUrl?: string;
}

export interface MatchProbability {
  homeWin: number;   // P(team A wins)
  draw: number;      // P(draw)
  awayWin: number;   // P(team B wins)
}

export interface EloUpdateResult {
  newRatingA: number;
  newRatingB: number;
  deltaA: number;
  deltaB: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const D = 400;                    // Rating scale factor
const MIN_DRAW_PROB = 0.20;      // International football draw floor
const MAX_DRAW_PROB = 0.35;      // Draw ceiling (even balanced matches rarely >35%)

// K-factors by match importance
export const K_FACTORS = {
  WORLD_CUP_FINAL:        80,
  WORLD_CUP_SEMIFINAL:    70,
  WORLD_CUP_KNOCKOUT:     65,
  WORLD_CUP_GROUP:        60,
  CONTINENTAL_FINAL:      50,
  CONTINENTAL_GROUP:      40,
  QUALIFIER:              30,
  FRIENDLY:               20,
} as const;

export type MatchImportance = keyof typeof K_FACTORS;

// ─── Core Elo Formula ─────────────────────────────────────────────────────────

/**
 * Expected score for team A against team B.
 * Returns a value in (0, 1) representing probability of win (not accounting for draws).
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / D));
}

/**
 * Convert raw Elo expected score into three-way win/draw/loss probabilities.
 *
 * Draw probability is highest when teams are evenly matched (E ≈ 0.5)
 * and decreases as the mismatch grows.
 *
 * Method: Logistic draw zone model
 * - Draw probability peaks at 30% for perfectly balanced matches
 * - Decays as expected score moves away from 0.5
 */
export function threeWayProbability(ratingA: number, ratingB: number): MatchProbability {
  const e = expectedScore(ratingA, ratingB);

  // Distance from 0.5 determines how "balanced" the match is
  const balance = 1 - Math.abs(e - 0.5) * 2; // 1.0 = perfectly balanced, 0 = complete mismatch

  // Draw probability: max at balance=1, floored at MIN_DRAW_PROB
  const drawProb = Math.max(
    MIN_DRAW_PROB,
    Math.min(MAX_DRAW_PROB, MIN_DRAW_PROB + (MAX_DRAW_PROB - MIN_DRAW_PROB) * balance)
  );

  // Redistribute remaining probability proportionally to Elo expectation
  const remaining = 1 - drawProb;
  const winA = e * remaining / (e + (1 - e));
  const winB = (1 - e) * remaining / (e + (1 - e));

  return {
    homeWin: Number(winA.toFixed(4)),
    draw: Number(drawProb.toFixed(4)),
    awayWin: Number(winB.toFixed(4)),
  };
}

/**
 * Update Elo ratings after a match result.
 *
 * @param ratingA       Current rating of team A
 * @param ratingB       Current rating of team B
 * @param result        1 = A wins, 0.5 = draw, 0 = B wins
 * @param importance    Match type (affects K-factor)
 * @param goalMargin    Optional: absolute goal difference for margin multiplier
 */
export function updateRatings(
  ratingA: number,
  ratingB: number,
  result: 1 | 0.5 | 0,
  importance: MatchImportance = 'WORLD_CUP_GROUP',
  goalMargin?: number
): EloUpdateResult {
  const k = K_FACTORS[importance];
  const e = expectedScore(ratingA, ratingB);
  const actual = result; // 1, 0.5, or 0

  // Goal margin multiplier (dampened log scale to avoid over-weighting thrashings)
  let marginMultiplier = 1;
  if (goalMargin !== undefined && goalMargin > 0) {
    marginMultiplier = Math.log(goalMargin + 1) * 0.5 + 1; // Range: 1.0 to ~2.5
    marginMultiplier = Math.min(marginMultiplier, 2.5);      // Hard cap
  }

  const deltaA = k * marginMultiplier * (actual - e);
  const deltaB = k * marginMultiplier * ((1 - actual) - (1 - e));

  return {
    newRatingA: Math.round(ratingA + deltaA),
    newRatingB: Math.round(ratingB + deltaB),
    deltaA: Math.round(deltaA),
    deltaB: Math.round(deltaB),
  };
}

// ─── Seeding: FIFA Ranking → Elo ─────────────────────────────────────────────

/**
 * Convert a FIFA ranking position to an approximate Elo rating.
 *
 * Based on empirical mapping of historical FIFA rankings to club Elo databases:
 * - Rank 1  ≈ 2000 Elo (elite: France, Brazil, Argentina range)
 * - Rank 10 ≈ 1850
 * - Rank 20 ≈ 1750
 * - Rank 50 ≈ 1600
 * - Rank 100 ≈ 1450
 * - Rank 200 ≈ 1300 (floor)
 *
 * Formula: exponential decay from rank 1 anchor
 */
export function fifaRankToElo(rank: number): number {
  const ANCHOR = 2000;    // Rank 1 Elo
  const DECAY = 0.0085;   // Controls rate of drop per rank position
  const FLOOR = 1250;     // Minimum Elo for any FIFA member nation

  const elo = ANCHOR * Math.exp(-DECAY * (rank - 1));
  return Math.max(Math.round(elo), FLOOR);
}

/**
 * Seed ratings for all 2026 World Cup qualified teams.
 * Based on FIFA Rankings as of early 2026.
 *
 * Rankings are approximate — replace with live data from football-data.org
 * or API-Football as tournament approaches.
 */
export const SEED_RATINGS_2026: Record<string, { eloRating: number; group: string; fifaRanking: number }> = {
  // Group A
  'USA':       { eloRating: fifaRankToElo(14),  group: 'A', fifaRanking: 14 },
  'MEX':       { eloRating: fifaRankToElo(15),  group: 'A', fifaRanking: 15 },
  'CAN':       { eloRating: fifaRankToElo(47),  group: 'A', fifaRanking: 47 },
  'TBD_A4':    { eloRating: 1450,               group: 'A', fifaRanking: 60 },

  // Group B
  'ARG':       { eloRating: fifaRankToElo(1),   group: 'B', fifaRanking: 1 },
  'BRA':       { eloRating: fifaRankToElo(5),   group: 'B', fifaRanking: 5 },
  'TBD_B3':    { eloRating: 1550,               group: 'B', fifaRanking: 30 },
  'TBD_B4':    { eloRating: 1450,               group: 'B', fifaRanking: 55 },

  // Group C
  'FRA':       { eloRating: fifaRankToElo(2),   group: 'C', fifaRanking: 2 },
  'ENG':       { eloRating: fifaRankToElo(4),   group: 'C', fifaRanking: 4 },
  'TBD_C3':    { eloRating: 1520,               group: 'C', fifaRanking: 35 },
  'TBD_C4':    { eloRating: 1430,               group: 'C', fifaRanking: 65 },

  // Group D
  'ESP':       { eloRating: fifaRankToElo(3),   group: 'D', fifaRanking: 3 },
  'GER':       { eloRating: fifaRankToElo(12),  group: 'D', fifaRanking: 12 },
  'TBD_D3':    { eloRating: 1510,               group: 'D', fifaRanking: 38 },
  'TBD_D4':    { eloRating: 1420,               group: 'D', fifaRanking: 70 },

  // Groups E-L placeholders (replace with actual qualified teams)
  // Pattern: eloRating from fifaRankToElo(actual_rank)
};

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Format probability as percentage string for display.
 */
export function formatProb(p: number, decimals = 1): string {
  return `${(p * 100).toFixed(decimals)}%`;
}

/**
 * Simulate a single match result based on three-way probabilities.
 * Returns: 'A' | 'DRAW' | 'B'
 */
export function simulateMatchResult(
  ratingA: number,
  ratingB: number,
  rng: () => number = Math.random
): 'A' | 'DRAW' | 'B' {
  const { homeWin, draw } = threeWayProbability(ratingA, ratingB);
  const roll = rng();

  if (roll < homeWin) return 'A';
  if (roll < homeWin + draw) return 'DRAW';
  return 'B';
}

/**
 * Simulate a knockout match (no draws — goes to extra time/penalties if needed).
 * Uses win probability only, ignoring draw; slight edge to higher-rated team in ET.
 */
export function simulateKnockoutResult(
  ratingA: number,
  ratingB: number,
  rng: () => number = Math.random
): 'A' | 'B' {
  const e = expectedScore(ratingA, ratingB);
  // In knockout, draw goes to ET/penalties — higher-rated team has slight edge
  const penaltyEdge = 0.55 * e + 0.45 * (1 - e); // Slightly toward expected winner
  const roll = rng();
  return roll < penaltyEdge ? 'A' : 'B';
}
