import Link from "next/link";
import { ProbabilityBar } from "@/components/probability-bar";
import { AgentCard } from "@/components/agent-card";
import { HomeCompetition } from "@/components/home-competition";
import { getTournamentSnapshot } from "@/lib/data";
import { toPercent } from "@/lib/view";

export default async function Home() {
  const snapshot = await getTournamentSnapshot();
  const teamsById = new Map(snapshot.teams.map((t) => [t.id, t]));

  const top    = snapshot.teamForecasts[0];
  const second = snapshot.teamForecasts[1];
  const topName    = teamsById.get(top?.teamId ?? "")?.name ?? top?.teamId ?? "—";
  const secondName = teamsById.get(second?.teamId ?? "")?.name ?? second?.teamId ?? "—";

  const upcomingFixtures = snapshot.fixtures
    .filter((f) => f.status === "scheduled")
    .sort((a, b) => a.dateUtc.localeCompare(b.dateUtc))
    .slice(0, 4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div
        className="animate-fade-up"
        style={{ padding: "5rem 0 4rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "3.5rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.5rem" }}>
          <div className="live-dot" />
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-400)" }}>
            FIFA World Cup 2026 · AI-Powered Prediction Engine
          </span>
        </div>

        <h1 className="text-display" style={{ margin: "0 0 1rem", maxWidth: "680px" }}>
          Can you beat{" "}
          <span style={{ color: "var(--cyan-vivid)" }}>the AI?</span>
        </h1>

        <p style={{ margin: "0 0 2.5rem", maxWidth: "500px", fontSize: "1rem", color: "var(--text-400)", lineHeight: 1.65 }}>
          Wand&apos;s 6-agent AI workforce runs 10,000 World Cup simulations.
          Submit your tournament predictions. We compare at full time.
          Who&apos;s smarter?
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            href="/predict"
            style={{
              display: "inline-block", padding: "0.75rem 2rem",
              background: "var(--cyan-vivid)", color: "var(--surface-0)",
              fontSize: "0.88rem", fontWeight: 900, fontStyle: "italic",
              letterSpacing: "0.08em", textTransform: "uppercase",
              textDecoration: "none", transform: "skewX(-8deg)",
            }}
          >
            <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>Enter Your Picks →</span>
          </Link>
          <Link
            href="/agent-feed"
            style={{
              display: "inline-flex", alignItems: "center",
              padding: "0.75rem 1.5rem",
              border: "1px solid var(--border-default)", color: "var(--text-300)",
              fontSize: "0.82rem", fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Meet The Lab
          </Link>
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <div
        className="animate-fade-up animate-fade-up-delay-1"
        style={{ marginBottom: "3.5rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
          <div style={{ width: "3px", height: "1.1rem", background: "var(--cyan-vivid)", flexShrink: 0 }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-100)" }}>
            How It Works
          </span>
        </div>

        <div style={{ display: "grid", gap: "1px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", background: "var(--border-subtle)" }}>
          {[
            {
              step: "01",
              title: "Pick your predictions",
              body: "Champion, finalist, group qualifiers, golden boot, assist king, golden ball. 8 categories, max points up for grabs.",
              accent: "var(--cyan-vivid)",
            },
            {
              step: "02",
              title: "The Lab runs 10k simulations",
              body: "Six AI agents analyze Elo, form, injuries, schedules, bracket paths, and media sentiment. 10,000 Monte Carlo runs.",
              accent: "var(--amber-vivid)",
            },
            {
              step: "03",
              title: "Compare at full time",
              body: "Points score on every correct call. The leaderboard settles when the final whistle blows. Can you outscore the AI?",
              accent: "var(--green-vivid)",
            },
          ].map((s) => (
            <div key={s.step} style={{ background: "var(--surface-1)", padding: "1.5rem 1.25rem" }}>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "2rem", fontWeight: 900, color: s.accent, lineHeight: 1, marginBottom: "0.75rem", opacity: 0.7 }}>
                {s.step}
              </span>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.92rem", fontWeight: 800, color: "var(--text-100)", letterSpacing: "-0.01em" }}>
                {s.title}
              </h3>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-400)", lineHeight: 1.6 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── COMPETITION STATUS ───────────────────────────────────────── */}
      <div style={{ marginBottom: "3.5rem" }}>
        <HomeCompetition />
      </div>

      {/* ── THE LAB: 6 AGENTS ────────────────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-delay-2" style={{ marginBottom: "3.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "3px", height: "1.1rem", background: "var(--rose-vivid)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-100)" }}>
              Your Opponent · Wand Workforce
            </span>
          </div>
          <Link href="/agent-feed" style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--cyan-vivid)", textDecoration: "none", letterSpacing: "0.04em" }}>
            FULL BRIEFING →
          </Link>
        </div>

        <div style={{ display: "grid", gap: "1px", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", background: "var(--border-subtle)", marginBottom: "0.75rem" }}>
          {[
            { name: "Strength Agent",      color: "var(--cyan-vivid)",   domain: "Elo · Form · Squad Depth",           signals: 1847, accuracy: 73 },
            { name: "Player Signal Agent", color: "var(--amber-vivid)",  domain: "Injury · Suspension · Breakout",     signals: 924,  accuracy: 68 },
            { name: "Risk Agent",          color: "var(--rose-vivid)",   domain: "Chaos · Discipline · Upsets",        signals: 2103, accuracy: 61 },
            { name: "Path Agent",          color: "var(--green-vivid)",  domain: "Bracket · Exposure · Clusters",      signals: 672,  accuracy: 70 },
            { name: "Schedule Agent",      color: "#a78bfa",             domain: "Rest · Travel · Congestion",         signals: 411,  accuracy: 65 },
            { name: "Narrative Agent",     color: "#f472b6",             domain: "Media · Momentum · Sentiment",       signals: 338,  accuracy: 58 },
          ].map((agent) => (
            <div key={agent.name} style={{ background: "var(--surface-1)", padding: "0.85rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "2px" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: agent.color, boxShadow: `0 0 5px ${agent.color}`, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: agent.color }}>{agent.name}</span>
                </div>
                <span style={{ fontSize: "0.62rem", color: "var(--text-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{agent.domain}</span>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 800, fontStyle: "italic", color: "var(--text-100)", fontFamily: "var(--font-mono)" }}>
                  {agent.accuracy}%
                </p>
                <p style={{ margin: 0, fontSize: "0.58rem", color: "var(--text-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>accuracy</p>
              </div>
            </div>
          ))}
        </div>

        <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-500)", lineHeight: 1.55 }}>
          Combined: {(1847 + 924 + 2103 + 672 + 411 + 338).toLocaleString()} signals processed · Average accuracy {Math.round((73 + 68 + 61 + 70 + 65 + 58) / 6)}%
        </p>
      </div>

      {/* ── LIVE FORECAST PREVIEW ─────────────────────────────────────── */}
      <div
        className="animate-fade-up animate-fade-up-delay-2"
        style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", marginBottom: "3.5rem" }}
      >
        {/* Champion Probability */}
        <div style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-1)" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "3px", height: "1rem", background: "var(--cyan-vivid)", flexShrink: 0 }} />
              <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-100)" }}>
                Lab Forecast · Champion Odds
              </span>
            </div>
            <Link href="/teams" style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--cyan-vivid)", textDecoration: "none", letterSpacing: "0.04em" }}>
              ALL TEAMS →
            </Link>
          </div>
          <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {snapshot.teamForecasts.slice(0, 8).map((forecast, i) => {
              const name  = teamsById.get(forecast.teamId)?.name ?? forecast.teamId;
              const flag  = teamsById.get(forecast.teamId)?.flagCode;
              const accent = i === 0 ? "cyan" : i === 1 ? "amber" : "cyan";
              return (
                <div
                  key={forecast.teamId}
                  style={{
                    padding: "0.65rem 0.85rem",
                    background: i === 0 ? "rgba(0,212,255,0.05)" : "transparent",
                    border: `1px solid ${i === 0 ? "var(--border-accent)" : "var(--border-subtle)"}`,
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

          {/* Lab's current picks summary */}
          <div style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-1)" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "3px", height: "1rem", background: "var(--amber-vivid)", flexShrink: 0 }} />
              <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-100)" }}>
                Lab&apos;s Current Picks
              </span>
            </div>
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { label: "Champion",  value: topName,    accent: "var(--amber-vivid)" },
                { label: "Finalist",  value: secondName, accent: "var(--cyan-vivid)" },
                { label: "Simulations", value: "10,000", accent: "var(--green-vivid)" },
                { label: "Teams Tracked", value: `${snapshot.teams.length}`, accent: "var(--text-400)" },
              ].map((row, i) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.65rem 0",
                    borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "var(--text-400)", letterSpacing: "0.04em" }}>{row.label}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, fontStyle: "italic", color: row.accent, fontFamily: "var(--font-mono)" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming fixtures */}
          {upcomingFixtures.length > 0 && (
            <div style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-1)" }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "3px", height: "1rem", background: "var(--rose-vivid)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-100)" }}>
                  Upcoming Matches
                </span>
              </div>
              <div style={{ padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0" }}>
                {upcomingFixtures.map((fixture, i) => {
                  const home = teamsById.get(fixture.homeTeamId)?.name ?? fixture.homeTeamId;
                  const away = teamsById.get(fixture.awayTeamId)?.name ?? fixture.awayTeamId;
                  const homeFlag = teamsById.get(fixture.homeTeamId)?.flagCode;
                  const awayFlag = teamsById.get(fixture.awayTeamId)?.flagCode;
                  return (
                    <div
                      key={fixture.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.55rem 0",
                        borderBottom: i < upcomingFixtures.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      }}
                    >
                      {homeFlag && <img src={`https://flagcdn.com/w40/${homeFlag}.png`} alt="" width={14} height={10} style={{ objectFit: "cover", flexShrink: 0 }} />}
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-200)" }}>{home}</span>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-500)" }}>vs</span>
                      {awayFlag && <img src={`https://flagcdn.com/w40/${awayFlag}.png`} alt="" width={14} height={10} style={{ objectFit: "cover", flexShrink: 0 }} />}
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-200)" }}>{away}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── AGENT INTELLIGENCE PREVIEW ───────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-delay-3" style={{ marginBottom: "3.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: "3px", height: "1rem", background: "var(--green-vivid)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-100)" }}>
              Latest Agent Signals
            </span>
          </div>
          <Link href="/agent-feed" style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--cyan-vivid)", textDecoration: "none", letterSpacing: "0.04em" }}>
            FULL FEED →
          </Link>
        </div>
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {snapshot.agentInsights.slice(0, 3).map((insight) => (
            <AgentCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────── */}
      <div
        className="animate-fade-up animate-fade-up-delay-4"
        style={{
          border: "1px solid var(--border-accent)", background: "var(--cyan-soft)",
          padding: "2rem 1.75rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "1.5rem", flexWrap: "wrap",
          marginBottom: "3rem",
        }}
      >
        <div>
          <p style={{ margin: "0 0 0.4rem", fontSize: "1.1rem", fontWeight: 800, color: "var(--text-100)" }}>
            Ready to challenge the AI?
          </p>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-400)", maxWidth: "400px", lineHeight: 1.55 }}>
            Pick your World Cup outcomes before the tournament starts. Points on every correct call.
            The leaderboard is live.
          </p>
        </div>
        <Link
          href="/predict"
          style={{
            display: "inline-block", padding: "0.8rem 2rem",
            background: "var(--cyan-vivid)", color: "var(--surface-0)",
            fontSize: "0.88rem", fontWeight: 900, fontStyle: "italic",
            letterSpacing: "0.08em", textTransform: "uppercase",
            textDecoration: "none", transform: "skewX(-8deg)", flexShrink: 0,
          }}
        >
          <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>Enter Picks →</span>
        </Link>
      </div>

    </div>
  );
}
