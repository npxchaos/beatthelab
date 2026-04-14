type Accent = "cyan" | "amber" | "rose" | "green";

const FILLS: Record<Accent, string> = {
  cyan:  "var(--lime-vivid)",
  amber: "var(--amber-vivid)",
  rose:  "var(--rose-vivid)",
  green: "var(--green-vivid)",
};

export const ProbabilityBar = ({
  label,
  value,
  accent = "cyan",
  sublabel,
  rank,
  flagCode,
}: {
  label: string;
  value: number;
  accent?: Accent;
  sublabel?: string;
  rank?: number;
  flagCode?: string;
}) => {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      {rank !== undefined && (
        <span className="rank-num">{rank}</span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.35rem",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", minWidth: 0 }}>
            {flagCode && (
              <img
                src={`https://flagcdn.com/w40/${flagCode}.png`}
                alt=""
                width={18}
                height={12}
                style={{ objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)" }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-200)",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
              {sublabel && (
                <span style={{ fontSize: "0.74rem", color: "var(--text-400)" }}>
                  {sublabel}
                </span>
              )}
            </div>
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--text-100)",
              flexShrink: 0,
            }}
          >
            {pct}%
          </span>
        </div>
        <div className="prob-track">
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: FILLS[accent],
              transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>
    </div>
  );
};
