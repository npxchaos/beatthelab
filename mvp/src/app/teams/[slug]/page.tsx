import { notFound } from "next/navigation";
import Link from "next/link";
import { ProbabilityBar } from "@/components/probability-bar";
import { StatCard } from "@/components/stat-card";
import { getTournamentSnapshot } from "@/lib/data";
import { formatDateTime, toPercent } from "@/lib/view";

const POSITION_COLOR: Record<string, string> = {
  FWD: "var(--rose-vivid)",
  MID: "var(--cyan-bright)",
  DEF: "var(--amber-vivid)",
  GK:  "var(--green-vivid)",
};

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const snapshot = await getTournamentSnapshot();

  const team = snapshot.teams.find((entry) => entry.slug === slug);
  if (!team) {
    notFound();
  }

  const forecast = snapshot.teamForecasts.find((entry) => entry.teamId === team.id);
  if (!forecast) {
    notFound();
  }

  const standing = snapshot.standings.find((entry) => entry.teamId === team.id);

  const teamPlayers = snapshot.players
    .filter((player) => player.teamId === team.id)
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists));

  const teamFixtures = snapshot.fixtures
    .filter((fixture) => fixture.homeTeamId === team.id || fixture.awayTeamId === team.id)
    .sort((a, b) => a.dateUtc.localeCompare(b.dateUtc));

  const teamById = new Map(snapshot.teams.map((entry) => [entry.id, entry]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="animate-fade-up">
        <Link href="/teams" className="btn btn-ghost btn-sm" style={{ marginBottom: "1rem" }}>
          ← Back to Team Lab
        </Link>
        <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <h1 className="text-display" style={{ color: "var(--text-100)" }}>
            {team.name}
          </h1>
          <span className="badge badge-cyan">Group {team.group}</span>
          <span className="badge">{team.confederation}</span>
        </div>
        <p style={{ marginTop: "0.75rem", fontSize: "0.95rem", color: "var(--text-300)" }}>
          Model Confidence: {toPercent(forecast.confidenceScore)}
        </p>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────────────── */}
      <div
        className="animate-fade-up animate-fade-up-delay-1"
        style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        <StatCard
          label="Points"
          value={`${standing?.points ?? 0}`}
          hint={`${standing?.played ?? 0} matches played`}
          accent="cyan"
        />
        <StatCard
          label="Goal Difference"
          value={`${standing?.goalDiff ?? 0 > 0 ? "+" : ""}${standing?.goalDiff ?? 0}`}
          hint={`${standing?.goalsFor ?? 0} scored, ${standing?.goalsAgainst ?? 0} conceded`}
          accent="amber"
        />
        <StatCard
          label="Volatility"
          value={toPercent(forecast.volatilityScore)}
          hint="Signal instability risk"
          accent="rose"
        />
        <StatCard
          label="Path Difficulty"
          value={toPercent(forecast.pathDifficulty)}
          hint="Avg opponent strength"
          accent="green"
        />
      </div>

      {/* ── Main Layout ─────────────────────────────────────────────────── */}
      <div
        className="animate-fade-up animate-fade-up-delay-2"
        style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}
      >
        
        {/* Forecast Profile */}
        <div className="panel" style={{ padding: "1.5rem" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <p className="text-label" style={{ marginBottom: "0.3rem" }}>Trajectory</p>
            <h2 className="text-heading-2">Forecast Profile</h2>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <ProbabilityBar label="Group Qualification" value={forecast.groupQualificationProbability} accent="green" />
            <ProbabilityBar label="Semifinal" value={forecast.semifinalProbability} accent="cyan" />
            <ProbabilityBar label="Final" value={forecast.finalistProbability} accent="amber" />
            <ProbabilityBar label="Champion" value={forecast.championProbability} accent="rose" />
          </div>
        </div>

        {/* Fixtures Timeline */}
        <div className="panel" style={{ padding: "1.5rem" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <p className="text-label" style={{ marginBottom: "0.3rem" }}>Calendar</p>
            <h2 className="text-heading-2">Fixtures Timeline</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {teamFixtures.map((fixture) => {
              const isHome = fixture.homeTeamId === team.id;
              const opponent = teamById.get(isHome ? fixture.awayTeamId : fixture.homeTeamId)?.name ?? "Unknown";
              const scoreLabel =
                fixture.homeScore !== null && fixture.awayScore !== null
                  ? `${fixture.homeScore} - ${fixture.awayScore}`
                  : "vs";

              return (
                <div key={fixture.id} className="panel-ghost" style={{ padding: "0.85rem 1.1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "var(--text-200)" }}>
                        {isHome ? "Home" : "Away"} vs {opponent}
                      </p>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: "var(--text-400)" }}>
                        {formatDateTime(fixture.dateUtc)} UTC
                      </p>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "var(--cyan-bright)"
                      }}
                    >
                      {scoreLabel}
                    </span>
                  </div>
                </div>
              );
            })}
            {teamFixtures.length === 0 && (
              <p style={{ fontSize: "0.85rem", color: "var(--text-400)" }}>No fixtures found.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Player Signals ──────────────────────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-delay-3 panel" style={{ padding: "1.5rem" }}>
        <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p className="text-label" style={{ marginBottom: "0.3rem" }}>Roster</p>
            <h2 className="text-heading-2">Player Signals</h2>
          </div>
          <span className="badge">{teamPlayers.length} tracked</span>
        </div>

        <div style={{ display: "grid", gap: "0.85rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {teamPlayers.map((player) => {
            const posColor = POSITION_COLOR[player.position] ?? "var(--text-400)";
            return (
              <div key={player.id} className="panel-ghost" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                  <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "var(--text-100)" }}>
                    {player.name}
                  </p>
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: posColor,
                      border: `1px solid ${posColor}40`,
                      background: `${posColor}15`,
                      padding: "0.15rem 0.4rem",
                      borderRadius: "4px",
                    }}
                  >
                    {player.position}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-500)", textTransform: "uppercase" }}>G/A</p>
                    <p style={{ margin: 0, fontSize: "0.85rem", fontFamily: "var(--font-mono)", color: "var(--text-200)" }}>
                      {player.goals} / {player.assists}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-500)", textTransform: "uppercase" }}>Cards (Y/R)</p>
                    <p style={{ margin: 0, fontSize: "0.85rem", fontFamily: "var(--font-mono)", color: "var(--text-200)" }}>
                      {player.yellowCards} / {player.redCards}
                    </p>
                  </div>
                </div>

                {player.status !== "available" && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border-subtle)" }}>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        color: "var(--rose-vivid)"
                      }}
                    >
                      Status: {player.status}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          {teamPlayers.length === 0 && (
            <p style={{ fontSize: "0.85rem", color: "var(--text-400)" }}>No player data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
