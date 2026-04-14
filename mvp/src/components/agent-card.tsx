import { AgentInsight } from "@/lib/types";

const SEVERITY_CONFIG = {
  info:     { label: "Info",     color: "var(--cyan-bright)",  border: "rgba(0,212,255,0.20)" },
  warning:  { label: "Warning",  color: "var(--amber-vivid)", border: "rgba(255,184,0,0.20)" },
  critical: { label: "Critical", color: "var(--rose-vivid)",  border: "rgba(255,61,113,0.20)" },
  success:  { label: "Signal",   color: "var(--green-vivid)", border: "rgba(0,224,150,0.20)" },
};

export const AgentCard = ({ insight }: { insight: AgentInsight }) => {
  const cfg = SEVERITY_CONFIG[insight.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info;
  const timestamp = new Date(insight.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <article
      style={{
        position: "relative",
        padding: "1rem 1.25rem",
        background: "var(--surface-0)",
        border: `1px solid ${cfg.border}`,
        overflow: "hidden",
        boxShadow: "0 4px 24px -1px rgba(0, 0, 0, 0.3)",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
      {/* Severity stripe */}
      <div
        style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: "3px",
          background: cfg.color,
          borderRadius: "9999px",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.5rem",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: cfg.color,
          }}
        >
          {insight.agent}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.70rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "0.2rem 0.5rem",
              border: `1px solid ${cfg.border}`,
              color: cfg.color,
              background: `${cfg.color}18`,
            }}
          >
            {cfg.label}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-500)" }}>{timestamp}</span>
        </div>
      </div>

      {/* Content */}
      <p
        style={{
          fontSize: "0.9rem",
          fontWeight: 500,
          color: "var(--text-200)",
          margin: "0 0 0.5rem",
          lineHeight: 1.5,
        }}
      >
        {insight.summary}
      </p>
      <p
        style={{
          fontSize: "0.82rem",
          color: "var(--text-400)",
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {insight.impact}
      </p>
    </article>
  );
};
