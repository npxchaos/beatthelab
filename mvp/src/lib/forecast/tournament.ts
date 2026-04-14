/**
 * Tournament Simulator
 * --------------------
 * Models the 2026 World Cup structure:
 * - 48 teams, 12 groups of 4
 * - Top 2 + 8 best third-place → Round of 32
 * - Standard knockout bracket to Final
 *
 * This module handles the tournament logic: group stage simulation,
 * standings calculation, and knockout bracket progression.
 */

import {
  type Team,
  simulateMatchResult,
  simulateKnockoutResult,
} from './elo';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GroupStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];                 // Last N results: 'W'|'D'|'L'
}

export interface MatchResult {
  teamAId: string;
  teamBId: string;
  goalsA: number;
  goalsB: number;
  stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final';
  group?: string;
}

export interface TournamentState {
  teams: Record<string, Team>;    // teamId → Team
  groupStandings: Record<string, GroupStanding[]>;  // group → standings
  knockoutResults: MatchResult[];
  champion: string | null;
  finalist: string | null;
}

export interface SimulationInput {
  teams: Team[];
  liveResults?: MatchResult[];    // Already-played matches to respect
  rng?: () => number;             // Custom RNG for seeded tests
}

// ─── Goal Simulation ─────────────────────────────────────────────────────────

/**
 * Simulate goals scored in a match given win probability.
 *
 * Uses a Poisson-approximated discrete distribution:
 * - Average goals per team correlates with strength differential
 * - Base average: 1.3 goals/team (international football avg)
 * - Stronger team scales up, weaker team scales down
 *
 * This makes sure matches feel realistic (not all 1-0 or 5-0).
 */
function simulateGoals(
  winProbA: number,
  rng: () => number
): { goalsA: number; goalsB: number } {
  const BASE_AVG = 1.3;

  // Expected goals scale with strength advantage
  const lambdaA = BASE_AVG * (0.5 + winProbA);      // Range: 0.65 – 1.95
  const lambdaB = BASE_AVG * (1.5 - winProbA);      // Range: 0.65 – 1.95

  return {
    goalsA: poissonSample(lambdaA, rng),
    goalsB: poissonSample(lambdaB, rng),
  };
}

/**
 * Sample from a Poisson distribution using Knuth's algorithm.
 */
function poissonSample(lambda: number, rng: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

// ─── Group Stage ──────────────────────────────────────────────────────────────

/**
 * Initialize standings for a group of teams.
 */
function initStandings(teams: Team[]): Record<string, GroupStanding> {
  const standings: Record<string, GroupStanding> = {};
  for (const team of teams) {
    standings[team.id] = {
      teamId: team.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    };
  }
  return standings;
}

/**
 * Apply a match result to two standings entries.
 */
function applyResult(
  standings: Record<string, GroupStanding>,
  teamAId: string,
  teamBId: string,
  goalsA: number,
  goalsB: number
): void {
  const a = standings[teamAId];
  const b = standings[teamBId];

  a.played++; b.played++;
  a.goalsFor += goalsA;  b.goalsFor += goalsB;
  a.goalsAgainst += goalsB; b.goalsAgainst += goalsA;
  a.goalDifference = a.goalsFor - a.goalsAgainst;
  b.goalDifference = b.goalsFor - b.goalsAgainst;

  if (goalsA > goalsB) {
    a.won++; a.points += 3; a.form.push('W');
    b.lost++;              b.form.push('L');
  } else if (goalsA === goalsB) {
    a.drawn++; a.points += 1; a.form.push('D');
    b.drawn++; b.points += 1; b.form.push('D');
  } else {
    b.won++; b.points += 3; b.form.push('W');
    a.lost++;              a.form.push('L');
  }
}

/**
 * Sort group standings by: Points → GD → Goals For → (coin flip)
 */
function sortStandings(standings: GroupStanding[], rng: () => number): GroupStanding[] {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return rng() - 0.5; // Random tiebreak (coin flip)
  });
}

/**
 * Simulate a full group stage for a single group.
 * Returns sorted standings and match results.
 */
export function simulateGroup(
  teams: Team[],
  rng: () => number = Math.random,
  liveResults: MatchResult[] = []
): { standings: GroupStanding[]; results: MatchResult[] } {
  const standingsMap = initStandings(teams);
  const results: MatchResult[] = [];

  // Find all round-robin matchups
  const matchups: [Team, Team][] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matchups.push([teams[i], teams[j]]);
    }
  }

  for (const [teamA, teamB] of matchups) {
    // Check if this match was already played (live result exists)
    const liveMatch = liveResults.find(
      r => (r.teamAId === teamA.id && r.teamBId === teamB.id) ||
           (r.teamAId === teamB.id && r.teamBId === teamA.id)
    );

    let goalsA: number, goalsB: number;

    if (liveMatch) {
      // Use real result
      if (liveMatch.teamAId === teamA.id) {
        goalsA = liveMatch.goalsA;
        goalsB = liveMatch.goalsB;
      } else {
        goalsA = liveMatch.goalsB;
        goalsB = liveMatch.goalsA;
      }
    } else {
      // Simulate
      const result3way = simulateMatchResult(teamA.eloRating, teamB.eloRating, rng);
      const goals = simulateGoals(
        result3way === 'A' ? 0.65 : result3way === 'DRAW' ? 0.5 : 0.35,
        rng
      );

      if (result3way === 'A') {
        goalsA = Math.max(goals.goalsA, 1);
        goalsB = Math.min(goals.goalsB, goalsA - 1);
      } else if (result3way === 'B') {
        goalsB = Math.max(goals.goalsB, 1);
        goalsA = Math.min(goals.goalsA, goalsB - 1);
      } else {
        const tieGoals = poissonSample(1.1, rng);
        goalsA = tieGoals;
        goalsB = tieGoals;
      }
    }

    applyResult(standingsMap, teamA.id, teamB.id, goalsA, goalsB);

    results.push({
      teamAId: teamA.id,
      teamBId: teamB.id,
      goalsA,
      goalsB,
      stage: 'group',
      group: teamA.group,
    });
  }

  const standings = sortStandings(Object.values(standingsMap), rng);
  return { standings, results };
}

// ─── Knockout Stage ───────────────────────────────────────────────────────────

/**
 * Simulate a single knockout match (no draws).
 * Returns the winning team ID.
 */
export function simulateKnockout(
  teamA: Team,
  teamB: Team,
  stage: MatchResult['stage'],
  rng: () => number = Math.random
): { winnerId: string; result: MatchResult } {
  const winnerSide = simulateKnockoutResult(teamA.eloRating, teamB.eloRating, rng);
  const winner = winnerSide === 'A' ? teamA : teamB;

  // Generate plausible scoreline for the winner
  const margin = Math.random() < 0.4 ? 1 : Math.random() < 0.7 ? 2 : 3;
  const loserGoals = Math.floor(Math.random() * (margin));
  const winnerGoals = loserGoals + margin;

  const result: MatchResult = {
    teamAId: teamA.id,
    teamBId: teamB.id,
    goalsA: winnerSide === 'A' ? winnerGoals : loserGoals,
    goalsB: winnerSide === 'B' ? winnerGoals : loserGoals,
    stage,
  };

  return { winnerId: winner.id, result };
}

// ─── Full Tournament Simulation ───────────────────────────────────────────────

export interface TournamentOutcome {
  champion: string;
  finalist: string;
  semis: string[];                  // All 4 semifinalists
  quarterFinals: string[];          // All 8 quarterfinalists
  roundOf16: string[];              // All 16 R16 qualifiers
  groupWinners: Record<string, string>;   // group → winner teamId
  groupQualified: Record<string, string[]>; // group → [1st, 2nd, best3rd?]
}

/**
 * Run a single full tournament simulation.
 *
 * @param teams         Full list of 48 teams with Elo ratings
 * @param liveResults   Match results already played (respected exactly)
 * @param rng           Random number generator (seeded for reproducibility)
 */
export function simulateTournament(
  teams: Team[],
  liveResults: MatchResult[] = [],
  rng: () => number = Math.random
): TournamentOutcome {
  // ── Group Stage ──
  const groups: Record<string, Team[]> = {};
  for (const team of teams) {
    if (!groups[team.group]) groups[team.group] = [];
    groups[team.group].push(team);
  }

  const allGroupStandings: Record<string, GroupStanding[]> = {};
  const groupRankings: Record<string, string[]> = {};  // group → [1st, 2nd, 3rd, 4th] teamIds

  for (const [groupName, groupTeams] of Object.entries(groups)) {
    const { standings } = simulateGroup(groupTeams, rng, liveResults);
    allGroupStandings[groupName] = standings;
    groupRankings[groupName] = standings.map(s => s.teamId);
  }

  // ── Best Third-Place Teams ──
  // 2026: 12 groups × top 2 = 24 qualifiers + 8 best 3rd = 32 total
  const thirdPlaceTeams = Object.entries(allGroupStandings)
    .map(([group, standings]) => ({ ...standings[2], group }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

  const bestThird = thirdPlaceTeams.slice(0, 8).map(s => s.teamId);

  // ── Round of 32 bracket ──
  // Build qualified teams list: 1st + 2nd from each group + 8 best 3rds
  const groupQualified: Record<string, string[]> = {};
  for (const [group, rankings] of Object.entries(groupRankings)) {
    groupQualified[group] = [rankings[0], rankings[1]];
    if (bestThird.includes(rankings[2])) {
      groupQualified[group].push(rankings[2]);
    }
  }

  // ── Knockout simulation ──
  // Simplified bracket: pair groups sequentially (A1 vs B2, B1 vs A2, etc.)
  // Full 2026 bracket pairing will be announced — using placeholder logic here.
  const roundOf32: string[] = [];
  for (const [, rankings] of Object.entries(groupRankings)) {
    roundOf32.push(rankings[0], rankings[1]);
  }
  // Add 8 best third-place
  for (const tid of bestThird) roundOf32.push(tid);

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));

  function runKnockoutRound(
    qualifiers: string[],
    stage: MatchResult['stage']
  ): string[] {
    const winners: string[] = [];
    for (let i = 0; i < qualifiers.length; i += 2) {
      const a = teamMap[qualifiers[i]];
      const b = teamMap[qualifiers[i + 1]];
      if (!a || !b) continue;
      const { winnerId } = simulateKnockout(a, b, stage, rng);
      winners.push(winnerId);
    }
    return winners;
  }

  // Build seeded bracket: group winners face 2nd-place teams from other groups.
  // Interleave 1st and 2nd place to create a realistic balanced bracket.
  const groupNames = Object.keys(groupRankings);
  const seeds1st = groupNames.map(g => groupRankings[g][0]).filter(Boolean);  // Group winners
  const seeds2nd = groupNames.map(g => groupRankings[g][1]).filter(Boolean);  // Group runners-up
  // Pair: winner of A vs runner-up of B, etc. (rotate pairing)
  const bracketPaired: string[] = [];
  for (let i = 0; i < seeds1st.length; i++) {
    bracketPaired.push(seeds1st[i]);
    bracketPaired.push(seeds2nd[(i + 1) % seeds2nd.length]);
  }
  // Add best 8 third-place teams to fill out 32
  const bestThirdIds = bestThird.slice(0, 8);
  // Pair them against leftover 2nd-place or each other
  for (let i = 0; i < bestThirdIds.length; i += 2) {
    bracketPaired.push(bestThirdIds[i]);
    bracketPaired.push(bestThirdIds[i + 1] ?? seeds2nd[i % seeds2nd.length]);
  }

  const r16Qualifiers   = runKnockoutRound(bracketPaired.slice(0, 32), 'r32');
  const qfQualifiers    = runKnockoutRound(r16Qualifiers, 'r16');
  const sfQualifiers    = runKnockoutRound(qfQualifiers, 'qf');

  const finalist1 = sfQualifiers[0] ?? 'TBD';
  const finalist2 = sfQualifiers[1] ?? 'TBD';

  let champion = 'TBD';
  if (finalist1 !== 'TBD' && finalist2 !== 'TBD') {
    const { winnerId } = simulateKnockout(
      teamMap[finalist1],
      teamMap[finalist2],
      'final',
      rng
    );
    champion = winnerId;
  }

  const finalist = champion === finalist1 ? finalist2 : finalist1;

  const groupWinners: Record<string, string> = {};
  for (const [group, rankings] of Object.entries(groupRankings)) {
    groupWinners[group] = rankings[0];
  }

  return {
    champion,
    finalist,
    semis: sfQualifiers,
    quarterFinals: qfQualifiers,
    roundOf16: r16Qualifiers,
    groupWinners,
    groupQualified,
  };
}
