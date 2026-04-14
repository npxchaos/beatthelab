import {
  Fixture,
  Player,
  PlayerForecast,
  ScenarioPick,
  Team,
  TeamForecast,
  TeamStanding,
  TournamentSnapshot,
} from "@/lib/types";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const round2 = (value: number): number => Math.round(value * 100) / 100;

const sigmoid = (value: number): number => 1 / (1 + Math.exp(-value));

export const buildStandings = (teams: Team[], fixtures: Fixture[]): TeamStanding[] => {
  const table = new Map<string, TeamStanding>();

  for (const team of teams) {
    table.set(team.id, {
      teamId: team.id,
      group: team.group,
      played: 0,
      won: 0,
      draw: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    });
  }

  for (const fixture of fixtures) {
    if (fixture.status !== "finished" || fixture.homeScore === null || fixture.awayScore === null) {
      continue;
    }

    const home = table.get(fixture.homeTeamId);
    const away = table.get(fixture.awayTeamId);

    if (!home || !away) {
      continue;
    }

    home.played += 1;
    away.played += 1;

    home.goalsFor += fixture.homeScore;
    home.goalsAgainst += fixture.awayScore;
    away.goalsFor += fixture.awayScore;
    away.goalsAgainst += fixture.homeScore;

    if (fixture.homeScore > fixture.awayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (fixture.homeScore < fixture.awayScore) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.draw += 1;
      away.draw += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return [...table.values()]
    .map((row) => ({ ...row, goalDiff: row.goalsFor - row.goalsAgainst }))
    .sort((a, b) => {
      if (a.group !== b.group) {
        return a.group.localeCompare(b.group);
      }
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      if (a.goalDiff !== b.goalDiff) {
        return b.goalDiff - a.goalDiff;
      }
      return b.goalsFor - a.goalsFor;
    });
};

const teamSignal = (team: Team, standing?: TeamStanding): number => {
  const pointsSignal = standing ? standing.points * 2.3 : 0;
  const gdSignal = standing ? standing.goalDiff * 1.2 : 0;
  return team.powerIndex * 0.56 + team.formIndex * 0.31 + pointsSignal + gdSignal;
};

export const buildTeamForecasts = (teams: Team[], standings: TeamStanding[]): TeamForecast[] => {
  const standingByTeamId = new Map(standings.map((item) => [item.teamId, item]));

  const scored = teams.map((team) => {
    const score = teamSignal(team, standingByTeamId.get(team.id));
    return { teamId: team.id, score };
  });

  const totalExp = scored.reduce((acc, row) => acc + Math.exp(row.score / 18), 0);
  const byGroup = new Map<string, { teamId: string; score: number }[]>();

  for (const row of scored) {
    const team = teams.find((entry) => entry.id === row.teamId)!;
    const current = byGroup.get(team.group) ?? [];
    current.push(row);
    byGroup.set(team.group, current);
  }

  const groupQualByTeamId = new Map<string, number>();

  for (const [group, rows] of byGroup.entries()) {
    void group;
    const sorted = rows.sort((a, b) => b.score - a.score);
    sorted.forEach((row, index) => {
      const base = index === 0 ? 0.83 : index === 1 ? 0.64 : index === 2 ? 0.34 : 0.19;
      groupQualByTeamId.set(row.teamId, base);
    });
  }

  return scored
    .map(({ teamId, score }) => {
      const champ = Math.exp(score / 18) / totalExp;
      const semifinal = clamp(champ * 2.8 + 0.08, 0.08, 0.92);
      const finalist = clamp(champ * 1.75 + 0.06, 0.06, 0.8);
      const qualify = clamp(groupQualByTeamId.get(teamId) ?? 0.4, 0.1, 0.95);
      const standing = standingByTeamId.get(teamId);
      const yellowPressure = standing ? (standing.played > 0 ? standing.lost / standing.played : 0) : 0;
      const volatility = clamp(0.22 + yellowPressure * 0.4 + (1 - qualify) * 0.5, 0.1, 0.97);
      const pathDifficulty = clamp(0.3 + (1 - champ) * 0.5 + (1 - qualify) * 0.3, 0.1, 0.95);
      const confidence = clamp(1 - volatility * 0.7 + champ * 0.35, 0.14, 0.96);

      return {
        teamId,
        championProbability: round2(champ),
        semifinalProbability: round2(semifinal),
        finalistProbability: round2(finalist),
        groupQualificationProbability: round2(qualify),
        volatilityScore: round2(volatility),
        pathDifficulty: round2(pathDifficulty),
        confidenceScore: round2(confidence),
      };
    })
    .sort((a, b) => b.championProbability - a.championProbability);
};

export const buildPlayerForecasts = (
  players: Player[],
  teams: Team[],
  teamForecasts: TeamForecast[],
): PlayerForecast[] => {
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const teamForecastById = new Map(teamForecasts.map((forecast) => [forecast.teamId, forecast]));

  const scorerSignal = players.map((player) => {
    const team = teamById.get(player.teamId);
    const forecast = teamForecastById.get(player.teamId);

    const availabilityPenalty =
      player.status === "injured" ? -1.4 : player.status === "suspended" ? -1.1 : player.status === "doubtful" ? -0.7 : 0;

    const scoreSignal =
      player.goals * 1.7 +
      player.assists * 0.5 +
      (team?.powerIndex ?? 70) * 0.015 +
      (forecast?.groupQualificationProbability ?? 0.4) * 1.8 +
      availabilityPenalty;

    const assistSignal =
      player.assists * 1.6 +
      player.goals * 0.35 +
      (team?.formIndex ?? 70) * 0.01 +
      (forecast?.semifinalProbability ?? 0.2) * 1.2 +
      availabilityPenalty * 0.65;

    const cardsSignal = player.yellowCards * 1.25 + player.redCards * 2.5 + (player.position === "DEF" ? 0.6 : 0.2);

    return { player, scoreSignal, assistSignal, cardsSignal };
  });

  const scorerTotal = scorerSignal.reduce((acc, row) => acc + Math.exp(row.scoreSignal), 0);
  const assistTotal = scorerSignal.reduce((acc, row) => acc + Math.exp(row.assistSignal), 0);
  const cardsTotal = scorerSignal.reduce((acc, row) => acc + Math.exp(row.cardsSignal), 0);

  return scorerSignal
    .map((row) => {
      const topScorer = Math.exp(row.scoreSignal) / scorerTotal;
      const topAssist = Math.exp(row.assistSignal) / assistTotal;
      const topCards = Math.exp(row.cardsSignal) / cardsTotal;
      const breakout = clamp(sigmoid(row.scoreSignal - 1.9) * 0.75 + 0.08, 0.03, 0.85);

      return {
        playerId: row.player.id,
        topScorerProbability: round2(topScorer),
        topAssistProbability: round2(topAssist),
        topCardsProbability: round2(topCards),
        breakoutProbability: round2(breakout),
      };
    })
    .sort((a, b) => b.topScorerProbability - a.topScorerProbability);
};

export const applyScenarioToStandings = (
  standings: TeamStanding[],
  picks: ScenarioPick[],
  fixtures: Fixture[],
): TeamStanding[] => {
  const updated = standings.map((standing) => ({ ...standing }));
  const byTeamId = new Map(updated.map((row) => [row.teamId, row]));
  const fixtureById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));

  for (const pick of picks) {
    const fixture = fixtureById.get(pick.fixtureId);
    if (!fixture || fixture.status !== "scheduled") {
      continue;
    }

    const home = byTeamId.get(fixture.homeTeamId);
    const away = byTeamId.get(fixture.awayTeamId);
    if (!home || !away) {
      continue;
    }

    home.played += 1;
    away.played += 1;

    if (pick.outcome === "home") {
      home.points += 3;
      home.won += 1;
      away.lost += 1;
      home.goalDiff += 1;
      away.goalDiff -= 1;
    } else if (pick.outcome === "away") {
      away.points += 3;
      away.won += 1;
      home.lost += 1;
      away.goalDiff += 1;
      home.goalDiff -= 1;
    } else {
      home.points += 1;
      away.points += 1;
      home.draw += 1;
      away.draw += 1;
    }
  }

  return updated.sort((a, b) => {
    if (a.group !== b.group) {
      return a.group.localeCompare(b.group);
    }
    if (a.points !== b.points) {
      return b.points - a.points;
    }
    if (a.goalDiff !== b.goalDiff) {
      return b.goalDiff - a.goalDiff;
    }
    return b.goalsFor - a.goalsFor;
  });
};

export const buildScenarioForecasts = (
  snapshot: TournamentSnapshot,
  picks: ScenarioPick[],
): TeamForecast[] => {
  const adjustedStandings = applyScenarioToStandings(snapshot.standings, picks, snapshot.fixtures);
  return buildTeamForecasts(snapshot.teams, adjustedStandings);
};
