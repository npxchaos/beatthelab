import { getTournamentSnapshot } from "@/lib/data";
import { toPercent } from "@/lib/view";

const POSITION_COLOR: Record<string, string> = {
  FWD: "var(--rose-vivid)",
  MID: "var(--cyan-bright)",
  DEF: "var(--amber-vivid)",
  GK: "var(--green-vivid)",
};

const STATUS_CONFIG = {
  available: { label: "Available", color: "var(--green-vivid)" },
  doubtful: { label: "Doubtful", color: "var(--amber-vivid)" },
  injured: { label: "Injured", color: "var(--rose-vivid)" },
  suspended: { label: "Suspended", color: "var(--rose-vivid)" },
};

export default async function PlayersPage() {
  const snapshot = await getTournamentSnapshot();
  const teamById = new Map(snapshot.teams.map((t) => [t.id, t]));
  const forecastById = new Map(snapshot.playerForecasts.map((f) => [f.playerId, f]));

  const rows = snapshot.players
    .map((p) => ({ player: p, forecast: forecastById.get(p.id) }))
    .filter((r): r is { player: typeof r.player; forecast: NonNullable<typeof r.forecast> } => !!r.forecast);

  const topScorers = [...rows].sort((a, b) => b.forecast.topScorerProbability - a.forecast.topScorerProbability).slice(0, 10);
  const topAssists = [...rows].sort((a, b) => b.forecast.topAssistProbability - a.forecast.topAssistProbability).slice(0, 10);
  const topDiscipline = [...rows].sort((a, b) => b.forecast.topCardsProbability - a.forecast.topCardsProbability).slice(0, 10);
  const isLiveProvider = snapshot.source !== "mock";

  const renderBoard = (
    title: string,
    subtitle: string,
    accentColor: string,
    data: typeof rows,
    metricLabel: string,
    metricFn: (r: typeof rows[number]) => string,
    currentFn: (r: typeof rows[number]) => string,
  ) => (
    <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--border-subtle)",
          background: `linear-gradient(135deg, ${accentColor}0d 0%, transparent 60%)`,
        }}
      >
        <p className="text-label" style={{ marginBottom: "0.3rem", color: accentColor }}>{subtitle}</p>
        <h2 className="text-heading-2">{title}</h2>
      </div>

      {/* Table */}
      <div className="scrollable-x">
        <table className="data-table" style={{ minWidth: "420px" }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: "1.5rem", width: "2rem" }}>#</th>
              <th>Player</th>
              <th>Pos</th>
              <th>Now</th>
              <th>{metricLabel}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ player, forecast }, i) => {
              const team = teamById.get(player.teamId);
              const statusCfg = STATUS_CONFIG[player.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.available;
              const posColor = POSITION_COLOR[player.position] ?? "var(--text-400)";

              return (
                <tr key={player.id}>
                  <td style={{ paddingLeft: "1.5rem" }}>
                    <span className="rank-num">{i + 1}</span>
                  </td>
                  <td>
                    <div>
                      <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "var(--text-100)" }}>
                        {player.name}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-400)" }}>
                        {team?.name ?? player.teamId}
                      </p>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "0.67rem",
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        color: posColor,
                        border: `1px solid ${posColor}40`,
                        background: `${posColor}15`,
                        padding: "0.18rem 0.45rem",
                        borderRadius: "4px",
                      }}
                    >
                      {player.position}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-200)" }}>
                      {currentFn({ player, forecast })}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: i === 0 ? accentColor : "var(--text-200)",
                      }}
                    >
                      {metricFn({ player, forecast })}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "0.67rem",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: statusCfg.color,
                      }}
                    >
                      {statusCfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Header */}
      <div className="animate-fade-up">
        <span className="badge badge-amber" style={{ marginBottom: "0.9rem" }}>Player Board</span>
        <h1 className="text-display">
          Player{" "}
          <span style={{ color: "var(--amber-vivid)" }}>Intelligence</span>
        </h1>
        <p style={{ marginTop: "0.75rem", maxWidth: "540px", fontSize: "0.95rem", color: "var(--text-300)", lineHeight: 1.65 }}>
          Top scorer, assist, and discipline markets computed from real event data and
          team progression models. Updated every 4 hours.
        </p>
      </div>

      {isLiveProvider && (
        <div className="animate-fade-up animate-fade-up-delay-1 panel-ghost" style={{ padding: "1rem 1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-400)", lineHeight: 1.65 }}>
            Live player coverage depends on the upstream provider. API-Football maps leaderboard data for scorers,
            assists, and cards. football-data.org maps competition scorer and assist data when available.
          </p>
        </div>
      )}

      {/* Summary row */}
      <div
        className="animate-fade-up animate-fade-up-delay-1"
        style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        {[
          { label: "Players Tracked", value: `${snapshot.players.length}` },
          { label: "Top scorer leader", value: topScorers[0]?.player.name.split(" ").pop() ?? "—" },
          { label: "Suspended / Injured", value: `${snapshot.players.filter((p) => p.status === "suspended" || p.status === "injured").length}` },
          { label: "Discipline alerts", value: `${snapshot.players.filter((p) => p.yellowCards >= 2).length}` },
        ].map((s) => (
          <div key={s.label} className="panel-ghost" style={{ padding: "1rem 1.25rem" }}>
            <p className="text-label" style={{ marginBottom: "0.4rem" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "var(--text-100)", letterSpacing: "-0.025em" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Boards */}
      {rows.length === 0 ? (
        <div className="animate-fade-up animate-fade-up-delay-2 panel" style={{ padding: "1.5rem" }}>
          <h2 className="text-heading-2">No Player Feed Available</h2>
          <p style={{ margin: "0.65rem 0 0", maxWidth: "680px", fontSize: "0.84rem", color: "var(--text-400)", lineHeight: 1.65 }}>
            The active provider returned team and fixture data, but no player leaderboard data for this competition window.
            Team forecasts remain live; player markets will populate automatically when the upstream feed exposes scorers or cards.
          </p>
        </div>
      ) : (
        <div
          className="animate-fade-up animate-fade-up-delay-2"
          style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}
        >
          {renderBoard(
            "Top Scorer Forecast", "Model · Goals",
            "var(--cyan-bright)",
            topScorers,
            "Prob",
            ({ forecast }) => toPercent(forecast.topScorerProbability),
            ({ player }) => `${player.goals}G / ${player.assists}A`,
          )}
          {renderBoard(
            "Top Assist Forecast", "Model · Assists",
            "var(--green-vivid)",
            topAssists,
            "Prob",
            ({ forecast }) => toPercent(forecast.topAssistProbability),
            ({ player }) => `${player.assists}A / ${player.goals}G`,
          )}
          {renderBoard(
            "Discipline Risk", "Cards · Suspension",
            "var(--rose-vivid)",
            topDiscipline,
            "Risk",
            ({ forecast }) => toPercent(forecast.topCardsProbability),
            ({ player }) => `${player.yellowCards}Y ${player.redCards}R`,
          )}
        </div>
      )}

    </div>
  );
}
