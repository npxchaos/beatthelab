import Link from "next/link";
import { getTournamentSnapshot } from "@/lib/data";
import { toPercent } from "@/lib/view";

const getRiskBadge = (groupQual: number) => {
  if (groupQual < 0.40) return { label: "High Risk", color: "var(--rose-vivid)", bg: "var(--rose-soft)" };
  if (groupQual < 0.62) return { label: "Volatile", color: "var(--amber-vivid)", bg: "var(--amber-soft)" };
  if (groupQual > 0.85) return { label: "Stable", color: "var(--green-vivid)", bg: "var(--green-soft)" };
  return { label: "Competitive", color: "var(--cyan-bright)", bg: "var(--cyan-soft)" };
};

export default async function TeamsPage() {
  const snapshot = await getTournamentSnapshot();
  const teamsById = new Map(snapshot.teams.map((t) => [t.id, t]));
  const standingByTeam = new Map(snapshot.standings.map((s) => [s.teamId, s]));

  const sorted = [...snapshot.teamForecasts].sort((a, b) => b.championProbability - a.championProbability);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Header */}
      <div className="animate-fade-up">
        <span className="badge badge-cyan" style={{ marginBottom: "0.9rem" }}>Team Lab</span>
        <h1 className="text-display">
          Team Pathways &{" "}
          <span style={{ color: "var(--cyan-bright)" }}>Outlooks</span>
        </h1>
        <p style={{ marginTop: "0.75rem", maxWidth: "540px", fontSize: "0.95rem", color: "var(--text-300)", lineHeight: 1.65 }}>
          Champion trajectories, qualification risk, volatility, and confidence scores
          for every team — computed across 10,000 tournament simulations.
        </p>
      </div>

      {/* Summary stats */}
      <div
        className="animate-fade-up animate-fade-up-delay-1"
        style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        {[
          { label: "Teams Tracked", value: `${snapshot.teams.length}` },
          { label: "Simulations Run", value: "10,000" },
          { label: "Top Champion Prob", value: toPercent(sorted[0]?.championProbability ?? 0) },
          { label: "Model Confidence", value: toPercent(sorted[0]?.confidenceScore ?? 0) },
        ].map((s) => (
          <div key={s.label} className="panel-ghost" style={{ padding: "1rem 1.25rem" }}>
            <p className="text-label" style={{ marginBottom: "0.4rem" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "var(--text-100)", letterSpacing: "-0.025em" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Team table */}
      <div className="animate-fade-up animate-fade-up-delay-2 panel scrollable-x" style={{ padding: "0" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <p className="text-label" style={{ marginBottom: "0.3rem" }}>All Teams</p>
          <h2 className="text-heading-2">Full Forecast Table</h2>
        </div>

        <table className="data-table" style={{ minWidth: "860px" }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: "1.5rem", width: "2rem" }}>#</th>
              <th>Team</th>
              <th>Group</th>
              <th>Pts</th>
              <th>Qualify</th>
              <th>Semi</th>
              <th>Final</th>
              <th>Champion</th>
              <th>Volatility</th>
              <th>Risk</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((forecast, i) => {
              const team = teamsById.get(forecast.teamId);
              if (!team) return null;
              const standing = standingByTeam.get(team.id);
              const risk = getRiskBadge(forecast.groupQualificationProbability);

              return (
                <tr key={team.id}>
                  <td style={{ paddingLeft: "1.5rem" }}>
                    <span className="rank-num">{i + 1}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: i < 3 ? "var(--text-100)" : "var(--text-200)",
                      }}
                    >
                      {team.name}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        color: "var(--text-400)",
                        background: "rgba(255,255,255,0.05)",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                      }}
                    >
                      Grp {team.group}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--text-200)" }}>
                      {standing?.points ?? 0}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-300)" }}>{toPercent(forecast.groupQualificationProbability)}</td>
                  <td style={{ color: "var(--text-300)" }}>{toPercent(forecast.semifinalProbability)}</td>
                  <td style={{ color: "var(--text-300)" }}>{toPercent(forecast.finalistProbability)}</td>
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: i === 0 ? "var(--cyan-bright)" : i < 3 ? "var(--text-100)" : "var(--text-300)",
                      }}
                    >
                      {toPercent(forecast.championProbability)}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        width: "56px",
                        height: "4px",
                        background: "rgba(255,255,255,0.07)",
                        borderRadius: "9999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.round(forecast.volatilityScore * 100)}%`,
                          background: forecast.volatilityScore > 0.5
                            ? "var(--amber-vivid)"
                            : "var(--cyan-mid)",
                          borderRadius: "9999px",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-500)", marginTop: "0.2rem", display: "block" }}>
                      {toPercent(forecast.volatilityScore)}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "0.67rem",
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        border: `1px solid ${risk.color}40`,
                        background: risk.bg,
                        color: risk.color,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "9999px",
                      }}
                    >
                      {risk.label}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/teams/${team.slug}`}
                      className="btn btn-ghost btn-sm"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
