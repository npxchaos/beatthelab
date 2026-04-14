import { Fixture, Player, ProviderDiagnostic, SnapshotSource, Team } from "@/lib/types";

export interface ProviderSnapshotData<TProvider extends Exclude<SnapshotSource, "mock">> {
  source: TProvider;
  teams: Team[];
  fixtures: Fixture[];
  players: Player[];
}

export interface ProviderFetchResult<TProvider extends Exclude<SnapshotSource, "mock">> {
  provider: TProvider;
  ok: boolean;
  data?: ProviderSnapshotData<TProvider>;
  diagnostic: ProviderDiagnostic;
}

export const createProviderDiagnostic = (
  provider: SnapshotSource,
  status: ProviderDiagnostic["status"],
  message: string,
  meta?: ProviderDiagnostic["meta"],
): ProviderDiagnostic => ({
  provider,
  status,
  checkedAt: new Date().toISOString(),
  message,
  meta,
});

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const slugify = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
