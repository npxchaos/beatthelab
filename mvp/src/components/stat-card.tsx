import { ReactNode } from "react";

export const StatCard = ({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: "up" | "down" | "steady";
}) => {
  const trendClass = trend === "up" ? "text-emerald-300" : trend === "down" ? "text-rose-300" : "text-slate-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_0_1px_rgba(34,211,238,0.05)]">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className={`mt-1 text-sm ${trendClass}`}>{hint}</p> : null}
    </div>
  );
};
