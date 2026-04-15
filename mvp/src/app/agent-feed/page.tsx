import { getTournamentSnapshot } from "@/lib/data";
import { generateSyntheticPlayers } from "@/lib/synthetic-players";
import { AgentCard } from "@/components/agent-card";
import { CompetitionIsland } from "./competition-client";
import type { AgentInsight } from "@/lib/types";

// ─── Agent registry (all 6) ───────────────────────────────────────────────────

const AGENTS = [
  {
    id:      "Strength Agent",
    color:   "var(--cyan-vivid)",
    domain:  "Elo · Form · Squad Depth",
    focus:   "Recomputing power curves after matchday 2 standings shift.",
    signals: 1847,
    accuracy: 73,
    icon: (c: string) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    id:      "Player Signal Agent",
    color:   "var(--amber-vivid)",
    domain:  "Injury · Suspension · Breakout",
    focus:   "Flagging 3 players with soft-tissue alerts ahead of group deciders.",
    signals: 924,
    accuracy: 68,
    icon: (c: string) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    id:      "Risk Agent",
    color:   "var(--rose-vivid)",
    domain:  "Chaos · Discipline · Upsets",
    focus:   "3 teams one yellow from suspension entering knockout stage.",
    signals: 2103,
    accuracy: 61,
    icon: (c: string) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
      </svg>
    ),
  },
  {
    id:      "Path Agent",
    color:   "var(--green-vivid)",
    domain:  "Bracket · Opponent Clusters · Exposure",
    focus:   "Mapping knockout exposure scores across all 48 teams.",
    signals: 672,
    accuracy: 70,
    icon: (c: string) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" x2="9" y1="3" y2="18" /><line x1="15" x2="15" y1="6" y2="21" />
      </svg>
    ),
  },
  {
    id:      "Schedule Agent",
    color:   "#a78bfa",
    domain:  "Rest · Travel · Fixture Congestion",
    focus:   "4 teams flagged with critical 48h rest windows before group finale.",
    signals: 411,
    accuracy: 65,
    icon: (c: string) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id:      "Narrative Agent",
    color:   "#f472b6",
    domain:  "Media · Momentum · Sentiment",
    focus:   "Host nation sentiment surge — +42% in 72 hours, correlates with home upset probability.",
    signals: 338,
    accuracy: 58,
    icon: (c: string) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toPercent = (n: number) => `${Math.round(n * 100)}%`;

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function AgentStatusCard({ agent }: { agent: typeof AGENTS[number] }) {
  return (
    <div style={{
      border: `1px solid ${agent.color}22`,
      background: "var(--surface-1)",
      padding: "1rem",
      display: "flex", flexDirection: "column", gap: "0.75rem",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem" }}>
        <div style={{
          width: "34px", height: "34px", flexShrink: 0,
          background: `${agent.color}18`,
          border: `1px solid ${agent.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {agent.icon(agent.color)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: agent.color, letterSpacing: "0.02em" }}>
              {agent.id}
            </span>
            {/* Active pulse */}
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: "var(--green-vivid)",
                boxShadow: "0 0 5px var(--green-vivid)",
                animation: "pulse-glow 1.8s ease-in-out infinite",
                display: "inline-block",
              }} />
              <span style={{ fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green-vivid)" }}>
                Active
              </span>
            </span>
          </div>
          <span style={{ fontSize: "0.62rem", color: "var(--text-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {agent.domain}
          </span>
        </div>
      </div>

      {/* Focus */}
      <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-300)", lineHeight: 1.55 }}>
        {agent.focus}
      </p>

      {/* Stats bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-500)" }}>Signals</p>
          <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 800, fontStyle: "italic", color: "var(--text-100)", fontFamily: "var(--font-mono)" }}>
            {agent.signals.toLocaleString()}
          </p>
        </div>
        <div style={{ width: "1px", height: "28px", background: "var(--border-subtle)" }} />
        <div>
          <p style={{ margin: "0 0 2px", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-500)" }}>Accuracy</p>
          <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 800, fontStyle: "italic", color: agent.color, fontFamily: "var(--font-mono)" }}>
            {agent.accuracy}%
          </p>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: "3px", background: "var(--border-subtle)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${agent.accuracy}%`,
              background: agent.color, transition: "width 0.6s ease",
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AgentFeedPage() {
  const snapshot = await getTournamentSnapshot();

  const players =
    snapshot.players.length > 0
      ? snapshot.players
      : generateSyntheticPlayers(snapshot.teams);

  const sortedForecasts = [...snapshot.teamForecasts].sort(
    (a, b) => b.championProbability - a.championProbability,
  );
  const teamsById   = new Map(snapshot.teams.map((t) => [t.id, t]));
  const playersById = new Map(players.map((p) => [p.id, p]));

  const champForecast   = sortedForecasts[0];
  const finalistForecast = sortedForecasts.find((_f, i) => i > 0) ?? sortedForecasts[1];
  const champTeam   = teamsById.get(champForecast?.teamId ?? "");
  const finalistTeam = teamsById.get(finalistForecast?.teamId ?? "");

  const playerForecasts = snapshot.playerForecasts;
  const topScorerForecast = [...playerForecasts].sort((a, b) => b.topScorerProbability - a.topScorerProbability)[0];
  const topAssistForecast = [...playerForecasts].sort((a, b) => b.topAssistProbability - a.topAssistProbability)[0];

  const topTeamId = champForecast?.teamId;
  const labScorerFallback = players.find((p) => p.teamId === topTeamId && p.position === "FWD") ?? players[0];
  const labAssistFallback = players.find((p) => p.teamId === (sortedForecasts[1]?.teamId) && p.position === "MID") ?? players[1] ?? players[0];
  const topScorerPlayer = (topScorerForecast ? playersById.get(topScorerForecast.playerId) : null) ?? labScorerFallback;
  const topAssistPlayer = (topAssistForecast ? playersById.get(topAssistForecast.playerId) : null) ?? labAssistFallback;

  // Project final goal/assist tallies for the lab's picks
  const scorerTeamRemaining = topScorerPlayer
    ? snapshot.fixtures.filter((f) => (f.homeTeamId === topScorerPlayer.teamId || f.awayTeamId === topScorerPlayer.teamId) && f.status === "scheduled").length
    : 0;
  const assistTeamRemaining = topAssistPlayer
    ? snapshot.fixtures.filter((f) => (f.homeTeamId === topAssistPlayer.teamId || f.awayTeamId === topAssistPlayer.teamId) && f.status === "scheduled").length
    : 0;

  // Average ~0.45 goals/game for a top striker, ~0.4 assists/game for a top midfielder
  const labGoals   = (topScorerPlayer?.goals   ?? 0) + Math.round(scorerTeamRemaining * 0.45);
  const labAssists = (topAssistPlayer?.assists ?? 0) + Math.round(assistTeamRemaining * 0.40);

  const lab = {
    champion:   champTeam   ? { id: champTeam.id,    name: champTeam.name,    flagCode: champTeam.flagCode,    prob: champForecast.championProbability }   : null,
    finalist:   finalistTeam ? { id: finalistTeam.id, name: finalistTeam.name, flagCode: finalistTeam.flagCode, prob: finalistForecast.finalistProbability } : null,
    topScorer:  topScorerPlayer ? { id: topScorerPlayer.id, name: topScorerPlayer.name, teamName: teamsById.get(topScorerPlayer.teamId)?.name ?? "", prob: topScorerForecast?.topScorerProbability ?? 0.15, goals: labGoals } : null,
    topAssist:  topAssistPlayer ? { id: topAssistPlayer.id, name: topAssistPlayer.name, teamName: teamsById.get(topAssistPlayer.teamId)?.name ?? "", prob: topAssistForecast?.topAssistProbability ?? 0.12, assists: labAssists } : null,
    goldenBall: topScorerPlayer ? { id: topScorerPlayer.id, name: topScorerPlayer.name, teamName: teamsById.get(topScorerPlayer.teamId)?.name ?? "" } : null,
  };

  const insights = [...snapshot.agentInsights].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const criticals = insights.filter((i) => i.severity === "critical");
  const warnings  = insights.filter((i) => i.severity === "warning");
  const infos     = insights.filter((i) => i.severity === "info");
  const sortedInsights: AgentInsight[] = [...criticals, ...warnings, ...infos];

  const totalSignals = AGENTS.reduce((s, a) => s + a.signals, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem", paddingBottom: "5rem" }}>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="animate-fade-up">
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <div className="live-dot" />
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-400)" }}>
            Wand Workforce · {AGENTS.length} Agents Running
          </span>
        </div>
        <h1 className="text-display" style={{ margin: "0 0 0.75rem" }}>
          Agent{" "}
          <span style={{ color: "var(--cyan-vivid)" }}>Briefing</span>
        </h1>
        <p style={{ margin: "0 0 1.5rem", maxWidth: "560px", fontSize: "0.9rem", color: "var(--text-300)", lineHeight: 1.65 }}>
          Six specialized AI agents run continuously — each monitoring a distinct signal domain,
          feeding a live forecast engine powering 10,000 tournament simulations.
          Your predictions compete directly against this workforce.
        </p>

        {/* Quick stats */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1px", background: "var(--border-subtle)" }}>
          {[
            { label: "Agents Active",     value: `${AGENTS.length} / ${AGENTS.length}` },
            { label: "Signals Processed", value: totalSignals.toLocaleString() },
            { label: "Simulations Run",   value: "10,000" },
            { label: "Avg Accuracy",      value: `${Math.round(AGENTS.reduce((s, a) => s + a.accuracy, 0) / AGENTS.length)}%` },
          ].map((s) => (
            <div key={s.label} style={{ flex: "1 1 120px", background: "var(--surface-1)", padding: "0.75rem 1rem" }}>
              <p style={{ margin: "0 0 2px", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-500)" }}>
                {s.label}
              </p>
              <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, fontStyle: "italic", color: "var(--text-100)", fontFamily: "var(--font-mono)" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── WORKFORCE GRID ───────────────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-delay-1">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ width: "3px", height: "1.1rem", background: "var(--cyan-vivid)", flexShrink: 0 }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-100)" }}>
            Wand Workforce
          </span>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
        </div>

        <div style={{
          display: "grid", gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}>
          {AGENTS.map((agent) => (
            <AgentStatusCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* ── COMPETITION + LEADERBOARD ────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-delay-2">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ width: "3px", height: "1.1rem", background: "var(--amber-vivid)", flexShrink: 0 }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-100)" }}>
            You vs The Lab
          </span>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
        </div>

        {lab.champion && lab.finalist ? (
          <CompetitionIsland
            lab={{
              champion:   lab.champion,
              finalist:   lab.finalist,
              topScorer:  lab.topScorer,
              topAssist:  lab.topAssist,
              goldenBall: lab.goldenBall,
            }}
            teams={snapshot.teams}
            players={players}
          />
        ) : (
          <p style={{ color: "var(--text-500)", fontSize: "0.82rem" }}>Tournament data not available.</p>
        )}
      </div>

      {/* ── LAB'S CURRENT PICKS ─────────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-delay-2">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ width: "3px", height: "1.1rem", background: "var(--cyan-vivid)", flexShrink: 0 }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-100)" }}>
            Wand Lab Predictions
          </span>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-500)" }}>
            Based on 10k simulations
          </span>
        </div>

        <div style={{ display: "grid", gap: "1px", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", background: "var(--border-subtle)" }}>
          {[
            { label: "Champion",    name: lab.champion?.name ?? "—",   flagCode: lab.champion?.flagCode,   prob: lab.champion?.prob,   accent: "var(--amber-vivid)", stat: undefined },
            { label: "Finalist",    name: lab.finalist?.name ?? "—",   flagCode: lab.finalist?.flagCode,   prob: lab.finalist?.prob,   accent: "var(--cyan-vivid)",  stat: undefined },
            { label: "Golden Boot", name: lab.topScorer?.name ?? "—",  flagCode: undefined,                 prob: lab.topScorer?.prob,  accent: "var(--rose-vivid)",  stat: lab.topScorer ? `${lab.topScorer.goals} goals projected` : undefined },
            { label: "Assist King", name: lab.topAssist?.name ?? "—",  flagCode: undefined,                 prob: lab.topAssist?.prob,  accent: "var(--green-vivid)", stat: lab.topAssist ? `${lab.topAssist.assists} assists projected` : undefined },
            { label: "Golden Ball", name: lab.goldenBall?.name ?? "—", flagCode: undefined,                 prob: undefined,             accent: "var(--amber-vivid)", stat: lab.goldenBall?.teamName ? `${lab.goldenBall.teamName}` : undefined },
          ].map((pick) => (
            <div key={pick.label} style={{ background: "var(--surface-1)", padding: "1rem" }}>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: pick.accent }}>
                {pick.label}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                {pick.flagCode && (
                  <img src={`https://flagcdn.com/w40/${pick.flagCode}.png`} alt="" width={16} height={11} style={{ objectFit: "cover", flexShrink: 0 }} />
                )}
                <span style={{ fontSize: "0.88rem", fontWeight: 800, fontStyle: "italic", color: "var(--text-100)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pick.name}
                </span>
              </div>
              {pick.stat && (
                <p style={{ margin: "0 0 0.4rem", fontSize: "0.68rem", fontWeight: 700, color: pick.accent, fontFamily: "var(--font-mono)" }}>
                  {pick.stat}
                </p>
              )}
              {pick.prob !== undefined && (
                <>
                  <div style={{ height: "2px", background: "var(--border-subtle)", marginBottom: "3px" }}>
                    <div style={{ height: "100%", width: `${Math.round(pick.prob * 100)}%`, background: pick.accent }} />
                  </div>
                  <span style={{ fontSize: "0.62rem", color: "var(--text-500)", fontFamily: "var(--font-mono)" }}>
                    {toPercent(pick.prob)} confidence
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── INTELLIGENCE LOG ────────────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-delay-3">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ width: "3px", height: "1.1rem", background: "var(--rose-vivid)", flexShrink: 0 }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-100)" }}>
            Intelligence Log
          </span>
          <span style={{ fontSize: "0.6rem", color: "var(--text-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {insights.length} signals · sorted by severity
          </span>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-500)", fontFamily: "var(--font-mono)" }}>
            Last: {relativeTime(sortedInsights[0]?.createdAt ?? new Date().toISOString())}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {sortedInsights.map((insight) => (
            <AgentCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>

      {/* ── DISCLAIMER ──────────────────────────────────────────── */}
      <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--text-500)", lineHeight: 1.65 }}>
        Agent insights are generated by algorithmic models for demonstration purposes. Not affiliated with FIFA or any football federation.
        Accuracy figures represent model backtesting on historical tournament data.
      </p>

    </div>
  );
}
