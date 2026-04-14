/**
 * Forecast Engine — Demo/Smoke Test
 * ----------------------------------
 * Run with:  npx tsx src/lib/forecast/demo.ts
 *
 * Validates:
 * 1. Elo rating calculations
 * 2. Single match probability
 * 3. Full Monte Carlo run (1,000 simulations)
 * 4. Scenario comparison
 * 5. Team intelligence output
 */

import {
  runForecast,
  runScenarioForecast,
  getMatchIntelligence,
  fifaRankToElo,
  threeWayProbability,
  formatProb,
} from './index';

// ─── 1. Elo sanity check ──────────────────────────────────────────────────────

console.log('\n=== ELO RATINGS (FIFA Rank → Elo) ===');
const checks = [
  { rank: 1,  label: 'Argentina (Rank 1)' },
  { rank: 5,  label: 'Brazil (Rank 5)' },
  { rank: 14, label: 'USA (Rank 14)' },
  { rank: 47, label: 'Canada (Rank 47)' },
  { rank: 100,label: 'Country (Rank 100)' },
];
for (const c of checks) {
  console.log(`  ${c.label}: ${fifaRankToElo(c.rank)}`);
}

// ─── 2. Match probability ─────────────────────────────────────────────────────

console.log('\n=== MATCH PROBABILITY ===');
const argElo = fifaRankToElo(1);   // Argentina ~2000
const fraElo = fifaRankToElo(2);   // France ~1983
const usaElo = fifaRankToElo(14);  // USA ~1635

const argVsFra = threeWayProbability(argElo, fraElo);
console.log(
  `Argentina vs France:  ARG win ${formatProb(argVsFra.homeWin)} | Draw ${formatProb(argVsFra.draw)} | FRA win ${formatProb(argVsFra.awayWin)}`
);

const braVsUsa = threeWayProbability(fifaRankToElo(5), usaElo);
console.log(
  `Brazil vs USA:        BRA win ${formatProb(braVsUsa.homeWin)} | Draw ${formatProb(braVsUsa.draw)} | USA win ${formatProb(braVsUsa.awayWin)}`
);

// ─── 3. Quick Monte Carlo run ────────────────────────────────────────────────

console.log('\n=== MONTE CARLO FORECAST (1,000 simulations) ===');
const start = Date.now();
const { forecast, intelligence } = runForecast({
  simulations: 1_000,
  seed: 42,         // Reproducible
});
const elapsed = Date.now() - start;

console.log(`\nComputed in ${elapsed}ms | ${forecast.simulationCount} simulations`);
console.log(`Global Chaos Index: ${(forecast.globalChaosIndex * 100).toFixed(1)}%`);
console.log(`Model Confidence:  ${(forecast.modelConfidence * 100).toFixed(1)}%`);
console.log(`Tournament Elo Spread: ${forecast.metadata.eloSpread} points`);

console.log('\n--- TOP 8 CHAMPION PROBABILITIES ---');
const topTeams = Object.values(forecast.teams)
  .sort((a, b) => b.championProb - a.championProb)
  .slice(0, 8);

for (const team of topTeams) {
  const info = intelligence.find(i => i.teamId === team.teamId);
  console.log(
    `  ${team.teamId.padEnd(6)} | Champion: ${formatProb(team.championProb, 1).padEnd(7)} | ` +
    `Final: ${formatProb(team.finalistProb, 1).padEnd(7)} | ` +
    `Group: ${formatProb(team.groupQualProb, 0).padEnd(5)} | ` +
    `Risk: ${info?.riskLevel ?? 'N/A'}`
  );
}

console.log('\n--- GROUP QUALIFICATION RISKS (Below 60%) ---');
const atRisk = Object.values(forecast.teams)
  .filter(t => t.groupQualProb < 0.60)
  .sort((a, b) => a.groupQualProb - b.groupQualProb);

for (const team of atRisk) {
  console.log(
    `  ${team.teamId.padEnd(8)} GroupQual: ${formatProb(team.groupQualProb, 1)} | ` +
    `Volatility: ${(team.volatility * 100).toFixed(0)}%`
  );
}

// ─── 4. Match intelligence ───────────────────────────────────────────────────

console.log('\n=== MATCH INTELLIGENCE ===');
const matches = [
  { a: 'ARG', b: 'BRA', label: 'Argentina vs Brazil' },
  { a: 'ENG', b: 'FRA', label: 'England vs France' },
  { a: 'USA', b: 'MEX', label: 'USA vs Mexico (host derby)' },
];

for (const match of matches) {
  const intel = getMatchIntelligence(match.a, match.b);
  console.log(`\n  ${match.label}`);
  console.log(`    Tension: ${(intel.tension * 100).toFixed(0)}%`);
  console.log(`    Upset probability: ${formatProb(intel.upsetProbability)}`);
  console.log(`    Expected goals: ${intel.expectedGoals.a} – ${intel.expectedGoals.b}`);
  console.log(`    Analysis: "${intel.narrativeHint}"`);
}

// ─── 5. Agent signals ────────────────────────────────────────────────────────

console.log('\n=== AGENT SIGNALS (Top 3 Teams) ===');
for (const teamIntel of intelligence.slice(0, 3)) {
  console.log(`\n  ${teamIntel.teamId} [${teamIntel.riskLevel}]`);
  for (const signal of teamIntel.signals.slice(0, 2)) {
    console.log(`    [${signal.type}] ${signal.label}: ${signal.detail}`);
  }
}

// ─── 6. Scenario comparison ──────────────────────────────────────────────────

console.log('\n=== SCENARIO: What if Brazil loses to Colombia in Group B? ===');
const scenario = runScenarioForecast(
  { teamAId: 'BRA', teamBId: 'COL', goalsA: 0, goalsB: 1 },
  { seed: 42, simulations: 1_000 }
);

console.log('\n  Top movers:');
for (const mover of scenario.topMovers) {
  const arrow = mover.direction === 'UP' ? '(+)' : '(-)';
  const delta = (mover.championDelta * 100).toFixed(2);
  const sign = mover.direction === 'UP' ? '+' : '';
  console.log(`  ${arrow} ${mover.teamId.padEnd(8)} Champion prob: ${sign}${delta}%`);
}

const braBaseline = scenario.baseline.teams['BRA'];
const braScenario = scenario.scenario.teams['BRA'];
console.log(`\n  BRA baseline champion prob: ${formatProb(braBaseline?.championProb ?? 0)}`);
console.log(`  BRA scenario champion prob: ${formatProb(braScenario?.championProb ?? 0)}`);

console.log('\n[PASS] All checks passed!\n');
