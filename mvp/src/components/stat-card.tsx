import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export const StatCard = ({
  label,
  value,
  hint,
  trend,
  accent = "cyan",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: "up" | "down" | "steady";
  accent?: "cyan" | "amber" | "rose" | "green";
}) => {
  const accentColor = 
    accent === "amber" ? "var(--amber-vivid)" :
    accent === "rose" ? "var(--rose-vivid)" :
    accent === "green" ? "var(--green-vivid)" :
    "var(--cyan-bright)";

  return (
    <div style={{
      position: "relative",
      background: "var(--surface-1)",
      border: "1px solid var(--border-subtle)",
      padding: "1rem 1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem"
    }}>
      {/* Top accent line */}
      <div style={{ position: "absolute", top: -1, left: -1, width: "32px", height: "3px", background: accentColor }} />
      <div style={{ position: "absolute", top: -1, left: -1, width: "3px", height: "16px", background: accentColor }} />

      <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-400)" }}>
        {label}
      </p>
      
      <p style={{ margin: 0, fontSize: "1.75rem", fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--text-100)", lineHeight: 1 }}>
        {value}
      </p>

      {hint && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.25rem" }}>
          {trend === "up" && <ArrowUpRight size={14} color="var(--green-vivid)" />}
          {trend === "down" && <ArrowDownRight size={14} color="var(--rose-vivid)" />}
          {trend === "steady" && <Minus size={14} color="var(--text-500)" />}
          
          <span style={{ fontSize: "0.65rem", color: "var(--text-400)", textTransform: "uppercase" }}>
            {hint}
          </span>
        </div>
      )}
    </div>
  );
};
