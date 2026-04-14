import { ScenarioClient } from "@/app/scenario/scenario-client";
import { getTournamentSnapshot } from "@/lib/data";

export default async function ScenarioPage() {
  const snapshot = await getTournamentSnapshot();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div className="animate-fade-up">
        <span className="badge badge-rose" style={{ marginBottom: "0.9rem" }}>Scenario Lab</span>
        <h1 className="text-display">
          What-If{" "}
          <span style={{ color: "var(--rose-vivid)" }}>Simulator</span>
        </h1>
        <p style={{ marginTop: "0.75rem", maxWidth: "540px", fontSize: "0.95rem", color: "var(--text-300)", lineHeight: 1.65 }}>
          Force any upcoming match result and instantly see how it shifts the champion race.
          Pick outcomes, watch probabilities ripple — powered by Wand&apos;s live forecast engine.
        </p>
      </div>
      <ScenarioClient snapshot={snapshot} />
    </div>
  );
}
