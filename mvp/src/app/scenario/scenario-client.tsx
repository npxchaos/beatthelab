"use client";

import { useMemo, useState } from "react";
import { buildScenarioForecasts } from "@/lib/prediction";
import { formatDateTime, toPercent } from "@/lib/view";
import { ScenarioPick, TournamentSnapshot } from "@/lib/types";

const OUTCOME_CONFIG: Record<ScenarioPick["outcome"], { label: string; color: string }> = {
  home: { label: "Home Win", color: "var(--cyan-bright)" },
  draw: { label: "Draw",     color: "var(--amber-vivid)" },
  away: { label: "Away Win", color: "var(--rose-vivid)"  },
};

export function ScenarioClient({ snapshot }: { snapshot: TournamentSnapshot }) {
  const teamsById = useMemo(
    () => new Map(snapshot.teams.map((t) => [t.id, t])),
    [snapshot.teams]
  );
  const baseline = useMemo(
    () => new Map(snapshot.teamForecasts.map((f) => [f.teamId, f])),
    [snapshot.teamForecasts]
  );

  const [picks, setPicks] = useState<ScenarioPick[]>([]);
  const scheduledFixtures = useMemo(
    () => snapshot.fixtures.filter((f) => f.status === "scheduled").slice(0, 8),
    [snapshot.fixtures]
  );
  const forecasts = useMemo(() => buildScenarioForecasts(snapshot, picks), [snapshot, picks]);
  const selectedByFixture = new Map(picks.map((p) => [p.fixtureId, p.outcome]));

  const setOutcome = (fixtureId: string, outcome: ScenarioPick["outcome"]) => {
    setPicks((cur) => {
      const next = cur.filter((p) => p.fixtureId !== fixtureId);
      next.push({ fixtureId, outcome });
      return next;
    });
  };

  const movers = forecasts
    .map((f) => {
      const base = baseline.get(f.teamId)?.championProbability ?? 0;
      return { ...f, base, delta: f.championProbability - base };
    })
    .filter((f) => Math.abs(f.delta) > 0.001)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Fixture picker */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <p className="text-label" style={{ marginBottom: "0.3rem" }}>Step 1</p>
            <h2 className="text-heading-2">Pick Match Outcomes</h2>
          </div>
          <button
            type="button"
            onClick={() => setPicks([])}
            className="btn btn-ghost btn-sm"
            style={{ opacity: picks.length === 0 ? 0.4 : 1 }}
            disabled={picks.length === 0}
          >
            Reset Picks
          </button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {scheduledFixtures.length === 0 && (
            <p style={{ color: "var(--text-400)", fontSize: "0.84rem" }}>No upcoming fixtures to simulate.</p>
          )}
          {scheduledFixtures.map((fixture) => {
            const home = teamsById.get(fixture.homeTeamId)?.name ?? fixture.homeTeamId;
            const away = teamsById.get(fixture.awayTeamId)?.name ?? fixture.awayTeamId;
            const selected = selectedByFixture.get(fixture.id);

            return (
              <div
                key={fixture.id}
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "var(--radius-md)",
                  background: selected ? "rgba(0,212,255,0.04)" : "rgba(255,255,255,0.025)",
                  border: `1px solid ${selected ? "rgba(0,212,255,0.18)" : "var(--border-subtle)"}`,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "var(--text-100)" }}>
                      {home}
                      <span style={{ color: "var(--text-500)", fontWeight: 400, margin: "0 0.5rem" }}>vs</span>
                      {away}
                    </p>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: "var(--text-400)" }}>
                      {formatDateTime(fixture.dateUtc)} UTC
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {(["home", "draw", "away"] as const).map((outcome) => {
                      const cfg = OUTCOME_CONFIG[outcome];
                      const isSelected = selected === outcome;
                      return (
                        <button
                          key={outcome}
                          type="button"
                          onClick={() => setOutcome(fixture.id, outcome)}
                          style={{
                            padding: "0.38rem 0.9rem",
                            borderRadius: "9999px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            border: `1px solid ${isSelected ? cfg.color : "rgba(255,255,255,0.12)"}`,
                            color: isSelected ? cfg.color : "var(--text-300)",
                            background: isSelected ? `${cfg.color}18` : "transparent",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Impact panel */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="text-label" style={{ marginBottom: "0.3rem" }}>Step 2</p>
            <h2 className="text-heading-2">Champion Race Impact</h2>
          </div>
          {picks.length > 0 && (
            <span className="badge badge-cyan">{picks.length} scenario{picks.length > 1 ? "s" : ""} active</span>
          )}
        </div>

        {movers.length > 0 && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.6rem",
              background: "rgba(0,212,255,0.03)",
            }}
          >
            <p className="text-label" style={{ width: "100%", marginBottom: "0.4rem" }}>Biggest movers</p>
            {movers.slice(0, 4).map((m) => {
              const name = teamsById.get(m.teamId)?.name ?? m.teamId;
              const up = m.delta >= 0;
              return (
                <span
                  key={m.teamId}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.28rem 0.7rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: up ? "var(--green-vivid)" : "var(--rose-vivid)",
                    border: `1px solid ${up ? "rgba(0,224,150,0.25)" : "rgba(255,61,113,0.25)"}`,
                    background: up ? "rgba(0,224,150,0.08)" : "rgba(255,61,113,0.08)",
                  }}
                >
                  <span>{up ? "↑" : "↓"}</span>
                  {name}: {up ? "+" : ""}{toPercent(m.delta)}
                </span>
              );
            })}
          </div>
        )}

        <div className="scrollable-x">
          <table className="data-table" style={{ minWidth: "600px" }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: "1.5rem" }}>Team</th>
                <th>Baseline</th>
                <th>Scenario</th>
                <th>Δ Champion</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.slice(0, 10).map((forecast) => {
                const name = teamsById.get(forecast.teamId)?.name ?? forecast.teamId;
                const base = baseline.get(forecast.teamId)?.championProbability ?? 0;
                const delta = forecast.championProbability - base;
                const up = delta >= 0;

                return (
                  <tr key={forecast.teamId}>
                    <td style={{ paddingLeft: "1.5rem", fontWeight: 600, color: "var(--text-100)" }}>
                      {name}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-400)" }}>
                      {toPercent(base)}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600, color: "var(--cyan-bright)" }}>
                      {toPercent(forecast.championProbability)}
                    </td>
                    <td>
                      {delta !== 0 ? (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: up ? "var(--green-vivid)" : "var(--rose-vivid)",
                          }}
                        >
                          {up ? "+" : ""}{toPercent(Math.abs(delta))}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-500)", fontFamily: "var(--font-mono)" }}>—</span>
                      )}
                    </td>
                    <td style={{ color: "var(--text-300)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                      {toPercent(forecast.confidenceScore)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {picks.length === 0 && (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--text-500)",
              fontSize: "0.84rem",
            }}
          >
            Pick outcomes above to see how probabilities shift →
          </div>
        )}
      </div>
    </div>
  );
}
