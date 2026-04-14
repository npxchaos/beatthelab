import { getTournamentSnapshot } from "@/lib/data";
import { AgentCard } from "@/components/agent-card";

const getIcon = (type: string, color: string) => {
  if (type === "strength") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
  );
  if (type === "player") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
  );
  if (type === "risk") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
  );
  if (type === "path") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" x2="9" y1="3" y2="18" /><line x1="15" x2="15" y1="6" y2="21" /></svg>
  );
  return null;
}

const AGENTS = [
  {
    id: "strength",
    name: "Strength Agent",
    description: "Monitors Elo differentials, form streaks, and squad depth signals.",
    color: "var(--cyan-bright)",
  },
  {
    id: "player",
    name: "Player Signal Agent",
    description: "Tracks injury risk, suspension accumulation, and breakout indicators.",
    color: "var(--amber-vivid)",
  },
  {
    id: "risk",
    name: "Risk Agent",
    description: "Identifies chaos events, upset probabilities, and discipline patterns.",
    color: "var(--rose-vivid)",
  },
  {
    id: "path",
    name: "Path Agent",
    description: "Evaluates bracket difficulty, opponent Elo clusters, and knockout exposure.",
    color: "var(--green-vivid)",
  },
];

export default async function AgentFeedPage() {
  const snapshot = await getTournamentSnapshot();
  const insights = [...snapshot.agentInsights].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Header */}
      <div className="animate-fade-up">
        <span className="badge badge-cyan" style={{ marginBottom: "0.9rem" }}>
          <span className="live-dot" />
          Wand · Agent Intelligence
        </span>
        <h1 className="text-display">
          Multi-Agent{" "}
          <span style={{ color: "var(--cyan-bright)" }}>Briefing</span>
        </h1>
        <p style={{ marginTop: "0.75rem", maxWidth: "560px", fontSize: "0.95rem", color: "var(--text-300)", lineHeight: 1.65 }}>
          Wand&apos;s AI agents continuously monitor tournament signals — surfacing the reasoning
          behind every probability shift, risk flag, and player alert.
        </p>
      </div>

      {/* Wand branding panel */}
      <div
        className="animate-fade-up animate-fade-up-delay-1 panel-accent"
        style={{ padding: "1.5rem" }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-start" }}>
          <div
            style={{
              width: "48px", height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, var(--cyan-mid), #0044bb)",
              boxShadow: "0 0 24px rgba(0,180,255,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.1rem", fontWeight: 800, color: "#fff",
              fontFamily: "var(--font-mono)",
              flexShrink: 0,
            }}
          >W</div>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <p style={{ margin: "0 0 0.4rem", fontSize: "1rem", fontWeight: 700, color: "var(--text-100)" }}>
              Powered by Wand Agents
            </p>
            <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-300)", lineHeight: 1.6 }}>
              This feed demonstrates Wand&apos;s agentic orchestration capabilities — multiple
              specialized AI agents working in parallel, each monitoring a distinct signal
              domain and surfacing transparent, explainable insights in real time.
            </p>
          </div>
        </div>

        {/* Agent roster */}
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            marginTop: "1.25rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          {AGENTS.map((agent) => (
            <div
              key={agent.id}
              style={{
                padding: "0.9rem 1rem",
                borderRadius: "var(--radius-md)",
                background: "rgba(0,0,0,0.2)",
                border: `1px solid ${agent.color}25`,
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              <span style={{ flexShrink: 0, marginTop: "2px", display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", background: `${agent.color}15`, borderRadius: "6px" }}>
                {getIcon(agent.id, agent.color)}
              </span>
              <div>
                <p
                  style={{
                    margin: "0 0 0.25rem",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: agent.color,
                    letterSpacing: "0.04em",
                  }}
                >
                  {agent.name}
                </p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-400)", lineHeight: 1.5 }}>
                  {agent.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="animate-fade-up animate-fade-up-delay-2">
        <div className="section-label">
          <span className="text-label">Live Intelligence Log</span>
          <span className="badge" style={{ marginLeft: "0.5rem" }}>{insights.length} entries</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {insights.map((insight) => (
            <AgentCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderRadius: "var(--radius-md)",
          background: "rgba(255,255,255,0.015)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-500)", lineHeight: 1.65 }}>
          Agent insights are generated by algorithmic models and AI language systems for
          informational and demonstration purposes only. This feed showcases Wand&apos;s agentic
          orchestration capabilities. Not affiliated with FIFA or any football federation.
        </p>
      </div>

    </div>
  );
}
