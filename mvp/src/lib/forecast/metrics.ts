/**
 * Derived Metrics Engine
 * ----------------------
 * Computes all the "intelligence layer" metrics displayed in the UI:
 * - Volatility score (how unpredictable is this team)
 * - Path difficulty (how hard is their likely route)
 * - Chaos index (how surprising are their results)
 * - Confidence rating (how certain is the model)
 * - Upset probability (match-level upset likelihood)
 * - Discipline risk (player card accumulation warning)
 *
 * These are the metrics that make the product feel like a genuine
 * forecasting lab rather than a simple probability table.
 */

import { type TeamForecast, type ForecastOutput } from './monteCarlo';
import { type Team, threeWayProbability } from './elo';

// ─── Types ───────────────────────────────────────────────────────────────────

export type RiskLevel = 'STABLE' | 'VOLATILE' | 'HIGH_RISK' | 'WILDCARD';

export interface TeamIntelligence {
  teamId: string;
  riskLevel: RiskLevel;

  // Display-ready metrics (0–100 scale for UI progress bars)
  volatilityScore: number;        // 0 = stable, 100 = extremely unpredictable
  confidenceScore: number;        // 0 = uncertain, 100 = highly confident
  pathDifficultyScore: number;    // 0 = easy draw, 100 = hardest possible path
  chaosScore: number;             // 0 = boring, 100 = maximum chaos potential

  // Narrative signals for the agent explanation layer
  signals: Signal[];
}

export interface Signal {
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'WARNING';
  label: string;                  // Short display label
  detail: string;                 // Full sentence for agent feed
  weight: number;                 // How significant is this signal (0–1)
}

export interface MatchIntelligence {
  teamAId: string;
  teamBId: string;
  upsetProbability: number;       // P(lower-rated team wins)
  tension: number;                // 0–1: how close the match is expected to be
  eloGap: number;                 // Absolute Elo difference
  expectedGoals: { a: number; b: number };
  narrativeHint: string;          // One-liner for the agent feed
}

export interface PlayerDisciplineRisk {
  playerId: string;
  name: string;
  teamId: string;
  yellowCards: number;
  redCards: number;
  suspensionRisk: number;         // 0–1: P(suspended for a key match)
  warningLevel: 'CLEAR' | 'CAUTION' | 'DANGER';
  narrative: string;
}

// ─── Risk Level Classification ────────────────────────────────────────────────

export function classifyRiskLevel(forecast: TeamForecast): RiskLevel {
  const { volatility, championProb, groupQualProb } = forecast;

  if (volatility < 0.2 && championProb > 0.10) return 'STABLE';   // Consistent big contender
  if (volatility > 0.5)                          return 'WILDCARD'; // Extremely unpredictable
  if (groupQualProb < 0.55)                      return 'HIGH_RISK'; // Serious group exit risk
  return 'VOLATILE';
}

// ─── Probability to Score Conversion ─────────────────────────────────────────

/**
 * Convert a raw probability (0–1) to a display score (0–100)
 * using a non-linear scale that emphasizes mid-range differences.
 */
function probToScore(prob: number): number {
  return Math.round(Math.pow(prob, 0.7) * 100);
}

// ─── Team Intelligence Builder ────────────────────────────────────────────────

export function buildTeamIntelligence(
  team: Team,
  forecast: TeamForecast,
  allTeams: Team[],
): TeamIntelligence {
  const volatilityScore = probToScore(forecast.volatility);
  const confidenceScore = probToScore(forecast.confidenceScore);
  const pathDifficultyScore = probToScore(forecast.pathDifficulty);
  const chaosScore = probToScore(forecast.chaosIndex);

  const riskLevel = classifyRiskLevel(forecast);

  // ── Signals ──
  const signals: Signal[] = [];

  const avgElo = allTeams.reduce((s, t) => s + t.eloRating, 0) / allTeams.length;
  // Signal: Overall strength
  if (team.eloRating > avgElo + 100) {
    signals.push({
      type: 'POSITIVE',
      label: 'Elite Strength',
      detail: `${team.shortName || team.name} ranks in the top tier by Elo rating — significantly above tournament average.`,
      weight: 0.9,
    });
  } else if (team.eloRating < avgElo - 100) {
    signals.push({
      type: 'NEGATIVE',
      label: 'Underdog Status',
      detail: `${team.shortName || team.name} enters as an underdog — below average Elo for this field.`,
      weight: 0.7,
    });
  }

  // Signal: Group survival risk
  if (forecast.groupQualProb < 0.50) {
    signals.push({
      type: 'WARNING',
      label: 'Group Exit Risk',
      detail: `Model gives a ${(forecast.groupQualProb * 100).toFixed(0)}% chance of surviving the group stage — below the threshold for a comfortable qualifying path.`,
      weight: 0.85,
    });
  } else if (forecast.groupQualProb > 0.85) {
    signals.push({
      type: 'POSITIVE',
      label: 'Likely Qualifier',
      detail: `${team.shortName || team.name} qualifies from their group in ${(forecast.groupQualProb * 100).toFixed(0)}% of simulations.`,
      weight: 0.6,
    });
  }

  // Signal: Champion range
  if (forecast.championProb > 0.12) {
    signals.push({
      type: 'POSITIVE',
      label: 'Title Contender',
      detail: `The model projects a ${(forecast.championProb * 100).toFixed(1)}% chance of winning the tournament. This is in the top tier of forecasted champions.`,
      weight: 1.0,
    });
  }

  // Signal: Volatility warning
  if (forecast.volatility > 0.45) {
    signals.push({
      type: 'WARNING',
      label: 'High Volatility',
      detail: `${team.shortName || team.name} shows a high variance in simulated outcomes — expect them to be unpredictable match-to-match.`,
      weight: 0.75,
    });
  }

  // Signal: Path difficulty
  if (forecast.pathDifficulty > 0.7) {
    signals.push({
      type: 'NEGATIVE',
      label: 'Tough Draw',
      detail: `The likely knockout path for ${team.shortName || team.name} is among the hardest in the tournament, based on opponent Elo ratings.`,
      weight: 0.65,
    });
  } else if (forecast.pathDifficulty < 0.35) {
    signals.push({
      type: 'POSITIVE',
      label: 'Favorable Path',
      detail: `${team.shortName || team.name} has one of the easier projected paths through the bracket, boosting their deep run probability.`,
      weight: 0.55,
    });
  }

  // Sort signals by weight descending
  signals.sort((a, b) => b.weight - a.weight);

  return {
    teamId: team.id,
    riskLevel,
    volatilityScore,
    confidenceScore,
    pathDifficultyScore,
    chaosScore,
    signals,
  };
}

// ─── Match Intelligence ───────────────────────────────────────────────────────

/**
 * Compute intelligence metrics for a specific matchup.
 * Used for the fixture list and upcoming match previews.
 */
export function buildMatchIntelligence(teamA: Team, teamB: Team): MatchIntelligence {
  const probs = threeWayProbability(teamA.eloRating, teamB.eloRating);
  const eloGap = Math.abs(teamA.eloRating - teamB.eloRating);

  // Upset probability = probability that the lower-rated team wins
  const lowerRated = teamA.eloRating < teamB.eloRating ? 'A' : 'B';
  const upsetProb = lowerRated === 'A' ? probs.homeWin : probs.awayWin;

  // Tension = how close the match is (peaks when homeWin ≈ awayWin)
  const tension = 1 - Math.abs(probs.homeWin - probs.awayWin) * 2;

  // Expected goals (rough estimate based on match balance)
  const base = 1.2;
  const expectedGoals = {
    a: Number((base * (0.5 + probs.homeWin * 0.5)).toFixed(1)),
    b: Number((base * (0.5 + probs.awayWin * 0.5)).toFixed(1)),
  };

  // Generate a pithy one-liner
  let narrativeHint: string;
  if (tension > 0.8) {
    narrativeHint = `Coin-flip match — Elo models show near-equal probability for both sides.`;
  } else if (upsetProb > 0.38) {
    const underdog = lowerRated === 'A' ? teamA.shortName : teamB.shortName;
    narrativeHint = `${underdog} are underdogs but have a realistic ${(upsetProb * 100).toFixed(0)}% upset window.`;
  } else if (eloGap > 250) {
    const favorite = lowerRated === 'A' ? teamB.shortName : teamA.shortName;
    narrativeHint = `${favorite} are strong favorites — significant Elo gap favors a one-sided result.`;
  } else {
    narrativeHint = `Competitive match with moderate uncertainty — form and lineup decisions will matter.`;
  }

  return {
    teamAId: teamA.id,
    teamBId: teamB.id,
    upsetProbability: Number(upsetProb.toFixed(4)),
    tension: Number(tension.toFixed(3)),
    eloGap,
    expectedGoals,
    narrativeHint,
  };
}

// ─── Player Discipline Risk ───────────────────────────────────────────────────

/**
 * Compute suspension risk for a player based on card accumulation.
 * In World Cup: 2 yellows in group/R16 = suspended for next match.
 */
export function buildDisciplineRisk(player: {
  id: string;
  name: string;
  teamId: string;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  teamGroupQualProb: number;   // From forecast
}): PlayerDisciplineRisk {
  const yellowThreshold = 2;    // WC group stage suspension threshold
  const yellowRate = player.yellowCards / Math.max(player.matchesPlayed, 1);

  // Probability of getting another yellow in next match
  const nextYellowProb = Math.min(yellowRate * 1.1, 0.8);  // Slight pressure factor

  // Suspension risk = P(accumulates to threshold before next key match)
  let suspensionRisk = 0;
  if (player.redCards > 0) {
    suspensionRisk = 1;  // Already suspended
  } else if (player.yellowCards >= yellowThreshold - 1) {
    suspensionRisk = nextYellowProb; // One more yellow = banned
  } else {
    suspensionRisk = nextYellowProb * 0.3; // Two more needed
  }

  const warningLevel: PlayerDisciplineRisk['warningLevel'] =
    suspensionRisk > 0.6 ? 'DANGER' :
    suspensionRisk > 0.25 ? 'CAUTION' : 'CLEAR';

  let narrative: string;
  if (warningLevel === 'DANGER') {
    narrative = `${player.name} is one booking away from suspension — a significant risk for any key knockout appearance.`;
  } else if (warningLevel === 'CAUTION') {
    narrative = `${player.name} has ${player.yellowCards} yellow card(s). Continued aggressive play could result in a suspension at a critical moment.`;
  } else {
    narrative = `${player.name} has a clean discipline record — no immediate suspension risk.`;
  }

  return {
    playerId: player.id,
    name: player.name,
    teamId: player.teamId,
    yellowCards: player.yellowCards,
    redCards: player.redCards,
    suspensionRisk: Number(suspensionRisk.toFixed(3)),
    warningLevel,
    narrative,
  };
}

// ─── All-Teams Intelligence Summary ──────────────────────────────────────────

/**
 * Build intelligence profiles for all teams in the forecast.
 * Returns a sorted array: title contenders first, then by champion probability.
 */
export function buildAllTeamIntelligence(
  teams: Team[],
  forecast: ForecastOutput,
): TeamIntelligence[] {
  return teams
    .map(team => buildTeamIntelligence(
      team,
      forecast.teams[team.id],
      teams,
    ))
    .sort((a, b) => {
      const aF = forecast.teams[a.teamId];
      const bF = forecast.teams[b.teamId];
      return (bF?.championProb ?? 0) - (aF?.championProb ?? 0);
    });
}
