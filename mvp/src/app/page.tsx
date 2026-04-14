import Link from "next/link";
import { ProbabilityBar } from "@/components/probability-bar";
import { StatCard } from "@/components/stat-card";
import { AgentCard } from "@/components/agent-card";
import { getTournamentSnapshot } from "@/lib/data";
import { formatDateTime, toPercent } from "@/lib/view";

export default async function Home() {
  const snapshot = await getTournamentSnapshot();
  const teamsById = new Map(snapshot.teams.map((t) => [t.id, t]));

  const top    = snapshot.teamForecasts[0];
  const second = snapshot.teamForecasts[1];
  const topTeam    = teamsById.get(top?.teamId ?? "");
  const secondTeam = teamsById.get(second?.teamId ?? "");
  const topName    = topTeam?.name ?? top?.teamId ?? "—";
  const secondName = secondTeam?.name ?? second?.teamId ?? "—";

  const upcomingFixtures = snapshot.fixtures
    .filter((f) => f.status === "scheduled")
    .sort((a, b) => a.dateUtc.localeCompare(b.dateUtc))
    .slice(0, 5);

  const completedCount   = snapshot.fixtures.filter((f) => f.status === "finished").length;
  const standingTeams    = snapshot.standings.filter((s) => s.played > 0).length;
  const providerFailures = snapshot.diagnostics.attempts.filter((a) => a.status === "error");

  const providerLabel: Record<string, string> = {
    mock: "Mock",
    "api-football": "API-Football",
    "football-data": "football-data.org",
    hybrid: "Hybrid",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>

      {/* ── HERO: BEAT THE LAB ──────────────────────────────────────── */}
      <div
        className="animate-fade-up"
        style={{
          padding: "4rem 0 3rem",
          borderBottom: "1px solid #18181b",
          marginBottom: "3rem",
        }}
      >
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <div className="live-dot" />
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#71717a",
            }}
          >
            Live · FIFA World Cup 2026 · 10,000 Simulations
          </span>
        </div>

        {/* Big headline */}
        <h1 className="text-sport-hero" style={{ margin: "0 0 0.5rem" }}>
          Beat<br />
          <span style={{ color: "#a3e635" }}>The Lab.</span>
        </h1>

        <p
          style={{
            margin: "1.5rem 0 2rem",
            maxWidth: "520px",
            fontSize: "0.95rem",
            color: "#71717a",
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          Submit your tournament predictions. Our AI agents run 10,000 simulations.
          See who&apos;s smarter when the final whistle blows.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/predict" className="btn-sport">
            <span className="btn-sport-inner">
              Enter Your Picks →
            </span>
          </Link>
          <Link
            href="/teams"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.65rem 1.5rem",
              border: "1px solid #27272a",
              color: "#a1a1aa",
              fontSize: "0.82rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "border-color 0.12s ease, color 0.12s ease",
            }}
          >
            Team Forecasts
          </Link>
        </div>
      </div>

      {/* ── KPI ROW ──────────────────────────────────────────────────── */}
      <div
        className="animate-fade-up animate-fade-up-delay-1"
        style={{
          display: "grid",
          gap: "1px",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          background: "#18181b",
          border: "1px solid #18181b",
          marginBottom: "3rem",
        }}
      >
        <StatCard
          label="Champion Favorite"
          value={topName}
          hint={`${toPercent(top?.championProbability ?? 0)} champion prob`}
          trend="up"
          accent="cyan"
        />
        <StatCard
          label="2nd Favorite"
          value={secondName}
          hint={`${toPercent(second?.championProbability ?? 0)} champion prob`}
          trend="steady"
          accent="amber"
        />
        <StatCard
          label="Matches Played"
          value={`${completedCount}/${snapshot.fixtures.length}`}
          hint={`${standingTeams} teams with results`}
        />
        <StatCard
          label="Teams Tracked"
          value={`${snapshot.teams.length}`}
          hint="Across 12 groups"
          accent="green"
        />
      </div>

      {/* ── MAIN GRID ────────────────────────────────────────────────── */}
      <div
        className="animate-fade-up animate-fade-up-delay-2"
        style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", marginBottom: "3rem" }}
      >
        {/* Champion Probability */}
        <div style={{ border: "1px solid #18181b", background: "#0a0a0a" }}>
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid #18181b",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "3px",
                  height: "1rem",
                  background: "#a3e635",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  fontStyle: "italic",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#f4f4f5",
                }}
              >
                Champion Odds
              </span>
            </div>
            <Link
              href="/teams"
              style={{
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono)",
                color: "#a3e635",
                textDecoration: "none",
                letterSpacing: "0.04em",
              }}
            >
              ALL TEAMS →
            </Link>
          </div>

          <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {snapshot.teamForecasts.slice(0, 8).map((forecast, i) => {
              const name   = teamsById.get(forecast.teamId)?.name ?? forecast.teamId;
              const flag   = teamsById.get(forecast.teamId)?.flagCode;
              const accent = i === 0 ? "cyan" : i === 1 ? "amber" : "cyan";
              return (
                <div
                  key={forecast.teamId}
                  style={{
                    padding: "0.65rem 0.85rem",
                    background: i === 0 ? "rgba(163,230,53,0.06)" : "transparent",
                    border: `1px solid ${i === 0 ? "rgba(163,230,53,0.2)" : "#18181b"}`,
                  }}
                >
                  <ProbabilityBar
                    rank={i + 1}
                    label={name}
                    value={forecast.championProbability}
                    accent={accent}
                    sublabel={`Final: ${toPercent(forecast.finalistProbability)} · Semi: ${toPercent(forecast.semifinalProbability)}`}
                    flagCode={flag}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Upcoming Fixtures */}
          <div style={{ border: "1px solid #18181b", background: "#0a0a0a" }}>
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #18181b",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "3px", height: "1rem", background: "#f59e0b", flexShrink: 0 }} />
                <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "#f4f4f5" }}>
                  Upcoming Matches
                </span>
              </div>
              <Link href="/scenario" style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "#a3e635", textDecoration: "none", letterSpacing: "0.04em" }}>
                SIMULATE →
              </Link>
            </div>
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {upcomingFixtures.length === 0 ? (
                <p style={{ fontSize: "0.82rem", color: "var(--text-400)", margin: 0 }}>No upcoming fixtures scheduled.</p>
              ) : (
                upcomingFixtures.map((fixture, i) => {
                  const home = teamsById.get(fixture.homeTeamId)?.name ?? fixture.homeTeamId;
                  const away = teamsById.get(fixture.awayTeamId)?.name ?? fixture.awayTeamId;
                  const homeFlag = teamsById.get(fixture.homeTeamId)?.flagCode;
                  const awayFlag = teamsById.get(fixture.awayTeamId)?.flagCode;
                  return (
                    <div
                      key={fixture.id}
                      style={{
                        padding: "0.65rem 0.85rem",
                        border: "1px solid #18181b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                          {homeFlag && (
                            <img src={`https://flagcdn.com/w40/${homeFlag}.png`} alt="" width={16} height={11} style={{ objectFit: "cover", flexShrink: 0 }} />
                          )}
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f4f4f5" }}>{home}</span>
                          <span style={{ color: "#52525b", fontSize: "0.72rem" }}>vs</span>
                          {awayFlag && (
                            <img src={`https://flagcdn.com/w40/${awayFlag}.png`} alt="" width={16} height={11} style={{ objectFit: "cover", flexShrink: 0 }} />
                          )}
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f4f4f5" }}>{away}</span>
                        </div>
                        <p style={{ fontSize: "0.68rem", color: "#52525b", margin: 0, fontFamily: "var(--font-mono)" }}>
                          {formatDateTime(fixture.dateUtc)} UTC
                        </p>
                      </div>
                      {i === 0 && (
                        <span
                          style={{
                            fontSize: "0.58rem",
                            fontWeight: 800,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            padding: "0.15rem 0.5rem",
                            background: "#a3e635",
                            color: "#000",
                            transform: "skewX(-8deg)",
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>NEXT</span>
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Qualification Risk */}
          <div style={{ border: "1px solid #18181b", background: "#0a0a0a" }}>
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #18181b",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
              }}
            >
              <div style={{ width: "3px", height: "1rem", background: "#f43f5e", flexShrink: 0 }} />
              <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "#f4f4f5" }}>
                Qualification Risk
              </span>
            </div>
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {snapshot.teamForecasts
                .filter((f) => f.groupQualificationProbability < 0.65)
                .sort((a, b) => a.groupQualificationProbability - b.groupQualificationProbability)
                .slice(0, 5)
                .map((f) => {
                  const name   = teamsById.get(f.teamId)?.name ?? f.teamId;
                  const flag   = teamsById.get(f.teamId)?.flagCode;
                  const accent = f.groupQualificationProbability < 0.40 ? "rose" : "amber";
                  return (
                    <ProbabilityBar
                      key={f.teamId}
                      label={name}
                      value={f.groupQualificationProbability}
                      accent={accent}
                      sublabel="Qualification probability"
                      flagCode={flag}
                    />
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* ── DATA PIPELINE ────────────────────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-delay-2" style={{ border: "1px solid #18181b", marginBottom: "3rem" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #18181b", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: "3px", height: "1rem", background: "#a3e635", flexShrink: 0 }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "#f4f4f5" }}>
              Data Pipeline
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <span className="badge">Source: {providerLabel[snapshot.source] ?? snapshot.source}</span>
            <span className="badge">Mode: {providerLabel[snapshot.diagnostics.providerPreference] ?? snapshot.diagnostics.providerPreference}</span>
            <span className="badge">{providerFailures.length > 0 ? "Fallback Active" : "Validated"}</span>
          </div>
        </div>
        <div style={{ padding: "1rem", display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {snapshot.diagnostics.attempts.map((attempt) => (
            <div
              key={`${attempt.provider}-${attempt.checkedAt}`}
              style={{ padding: "0.85rem 1rem", border: "1px solid #18181b", background: "#111111" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "#f4f4f5" }}>
                  {providerLabel[attempt.provider] ?? attempt.provider}
                </p>
                <span className="badge" style={{ fontSize: "0.58rem" }}>{attempt.status}</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#71717a", lineHeight: 1.5 }}>
                {attempt.message}
              </p>
              <p style={{ margin: "0.45rem 0 0", fontSize: "0.65rem", color: "#52525b", fontFamily: "var(--font-mono)" }}>
                T:{attempt.meta?.teamCount ?? "—"} F:{attempt.meta?.fixtureCount ?? "—"} P:{attempt.meta?.playerCount ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── AGENT FEED PREVIEW ───────────────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-delay-3" style={{ marginBottom: "3rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: "3px", height: "1rem", background: "#a3e635", flexShrink: 0 }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "#f4f4f5" }}>
              Wand Agent Intelligence
            </span>
          </div>
          <Link href="/agent-feed" style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "#a3e635", textDecoration: "none", letterSpacing: "0.04em" }}>
            FULL FEED →
          </Link>
        </div>

        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {snapshot.agentInsights.slice(0, 3).map((insight) => (
            <AgentCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>

      {/* ── COMING SOON ──────────────────────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-delay-4" style={{ marginBottom: "3rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
          <div style={{ width: "3px", height: "1rem", background: "#52525b", flexShrink: 0 }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "#71717a" }}>
            Expand The Lab
          </span>
        </div>

        <div style={{ display: "grid", gap: "1px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", background: "#18181b", border: "1px solid #18181b" }}>
          {[
            { name: "Copa América 2027",   region: "CONMEBOL",  months: "Summer 2027" },
            { name: "UEFA Euro 2028",       region: "UEFA",      months: "Summer 2028" },
            { name: "Club World Cup 2025",  region: "FIFA",      months: "Mid 2025" },
            { name: "AFCON 2025",           region: "CAF",       months: "Jan 2025" },
          ].map((comp) => (
            <div
              key={comp.name}
              className="coming-soon-panel"
              style={{ padding: "1.1rem 1.25rem", background: "#0a0a0a", opacity: 0.55, cursor: "not-allowed" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span className="badge" style={{ fontSize: "0.58rem" }}>{comp.region}</span>
                <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#52525b" }}>
                  Soon
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#a1a1aa", fontStyle: "italic", textTransform: "uppercase" }}>{comp.name}</p>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.68rem", color: "#52525b" }}>{comp.months}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
