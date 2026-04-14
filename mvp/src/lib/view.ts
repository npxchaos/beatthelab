import { Fixture, Team } from "@/lib/types";

export const toPercent = (value: number): string => `${Math.round(value * 100)}%`;

export const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: true,
  }).format(new Date(iso));

export const fixtureLabel = (fixture: Fixture, teamsById: Map<string, Team>): string => {
  const home = teamsById.get(fixture.homeTeamId)?.name ?? fixture.homeTeamId;
  const away = teamsById.get(fixture.awayTeamId)?.name ?? fixture.awayTeamId;
  return `${home} vs ${away}`;
};
