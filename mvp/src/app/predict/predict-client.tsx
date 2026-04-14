"use client";
import { useState } from "react";
import type { Team, TeamForecast, Player, PlayerForecast, Fixture } from "@/lib/types";

type LabPrediction = {
  champion:  { team: Team; prob: number };
  finalist:  { team: Team; prob: number };
  topScorer: { player: Player; prob: number } | null;
  topAssist: { player: Player; prob: number } | null;
};

// ─── SVG Connector Lines for Bracket ───
const BracketConnector = ({ style }: { style: React.CSSProperties }) => (
  <svg
    style={{ ...style, position: "absolute", zIndex: 0, pointerEvents: "none" }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M 0 0 L 10 0 C 18 0 20 2 20 10 L 20 calc(100% - 10px) C 20 calc(100% - 2px) 22 100% 30 100% L 100% 100%"
      stroke="var(--border-subtle)"
      strokeWidth="2"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

export function PredictClient({
  teams,
  players,
  lab,
}: {
  fixtures: Fixture[];
  teams: Team[];
  forecasts: TeamForecast[];
  players: Player[];
  playerForecasts: PlayerForecast[];
  lab: LabPrediction;
}) {
  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const groupAObj = teams.filter((t) => t.group === "A");
  const groupBObj = teams.filter((t) => t.group === "B");

  // State: Ordered group standings
  const [groupA, setGroupA] = useState<string[]>(groupAObj.map((t) => t.id));
  const [groupB, setGroupB] = useState<string[]>(groupBObj.map((t) => t.id));

  // State: Knockout winners
  const [sf1Winner, setSf1Winner] = useState<string | null>(null);
  const [sf2Winner, setSf2Winner] = useState<string | null>(null);
  const [champion, setChampion] = useState<string | null>(null);

  // State: Players
  const [topScorerId, setTopScorerId] = useState("");
  const [topScorerGoals, setTopScorerGoals] = useState("");
  const [topAssistId, setTopAssistId] = useState("");
  const [topAssistCount, setTopAssistCount] = useState("");

  const [locked, setLocked] = useState(false);

  // Reordering groups
  const moveUp = (group: "A" | "B", index: number) => {
    if (locked || index === 0) return;
    const g = group === "A" ? [...groupA] : [...groupB];
    [g[index - 1], g[index]] = [g[index], g[index - 1]];
    if (group === "A") setGroupA(g);
    else setGroupB(g);
  };

  const moveDown = (group: "A" | "B", index: number) => {
    if (locked || index === 3) return;
    const g = group === "A" ? [...groupA] : [...groupB];
    [g[index + 1], g[index]] = [g[index], g[index + 1]];
    if (group === "A") setGroupA(g);
    else setGroupB(g);
  };

  // Derived knockout matchups
  const sf1Team1 = groupA[0];
  const sf1Team2 = groupB[1];
  const sf2Team1 = groupB[0];
  const sf2Team2 = groupA[1];

  // Helper to visually render a bracket node
  const renderBracketNode = (teamId: string, isWinner: boolean, onClick: () => void, seedLabel?: string) => {
    const t = teamsById.get(teamId);
    if (!t) return <div style={{ height: "46px", background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }} />;

    return (
      <div
        onClick={!locked ? onClick : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.6rem 0.8rem",
          background: isWinner ? "var(--cyan-soft)" : "var(--surface-1)",
          border: isWinner ? "1px solid var(--cyan-vivid)" : "1px solid var(--border-default)",
          cursor: locked ? "not-allowed" : "pointer",
          position: "relative",
          zIndex: 10,
          transition: "all 0.2s ease",
          minWidth: "160px"
        }}
      >
        {seedLabel && (
          <span style={{ fontSize: "0.55rem", fontWeight: 800, color: "var(--text-500)" }}>{seedLabel}</span>
        )}
        {t.flagCode && (
          <img src={`https://flagcdn.com/w40/${t.flagCode}.png`} alt="" width={20} height={14} style={{ objectFit: "cover" }} />
        )}
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: isWinner ? "var(--cyan-vivid)" : "var(--text-100)" }}>
          {t.name}
        </span>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem", paddingBottom: "4rem" }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <div className="live-dot" />
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-400)" }}>
            Interactive Bracket
          </span>
        </div>
        <h1 className="text-sport-hero" style={{ margin: "0 0 0.75rem" }}>
          Tournament<br />
          <span style={{ color: "var(--cyan-vivid)" }}>Challenge.</span>
        </h1>
        <p style={{ margin: 0, maxWidth: "540px", fontSize: "0.95rem", color: "var(--text-300)", lineHeight: 1.6 }}>
          Rank the group stages, build your playoff tree, and forecast the top performers. 
          When locked, compare your deterministic bracket directly against the AI's probabilistic final outlook.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2.5rem", alignItems: "flex-start" }}>
        
        {/* ── Group Stage Ranker ─────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-200)", margin: "0 0 1rem" }}>
              Group Standings
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-400)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              Use the arrows to rank the teams. The top 2 from each group advance to the playoffs.
            </p>
          </div>

          {[
            { label: "Group A", list: groupA, handlerUp: (i:number) => moveUp("A", i), handlerDown: (i:number)=> moveDown("A", i) },
            { label: "Group B", list: groupB, handlerUp: (i:number) => moveUp("B", i), handlerDown: (i:number)=> moveDown("B", i) },
          ].map(({ label, list, handlerUp, handlerDown }) => (
            <div key={label} style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-0)" }}>
              <div style={{ padding: "0.6rem 1rem", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-1)" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-400)" }}>
                  {label}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {list.map((teamId, idx) => {
                  const t = teamsById.get(teamId)!;
                  const isAdvancing = idx < 2;
                  return (
                    <div key={teamId} style={{ display: "flex", alignItems: "center", padding: "0.4rem 0.5rem", borderBottom: idx < 3 ? "1px solid var(--border-subtle)" : "none", background: isAdvancing ? "var(--surface-2)" : "transparent" }}>
                      {/* Rank Number */}
                      <div style={{ width: "24px", textAlign: "center", fontSize: "0.8rem", fontWeight: 800, color: isAdvancing ? "var(--cyan-vivid)" : "var(--text-500)" }}>
                        {idx + 1}
                      </div>
                      
                      {/* Controls */}
                      <div style={{ display: "flex", flexDirection: "column", opacity: locked ? 0.3 : 1, margin: "0 0.5rem" }}>
                        <button onClick={() => handlerUp(idx)} disabled={locked || idx === 0} style={{ background: "transparent", border: "none", cursor: locked || idx === 0 ? "default" : "pointer", padding: "0", color: "var(--text-400)", fontSize: "0.6rem" }}>▲</button>
                        <button onClick={() => handlerDown(idx)} disabled={locked || idx === 3} style={{ background: "transparent", border: "none", cursor: locked || idx === 3 ? "default" : "pointer", padding: "0", color: "var(--text-400)", fontSize: "0.6rem" }}>▼</button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                        <img src={`https://flagcdn.com/w40/${t.flagCode}.png`} alt="" width={20} height={14} style={{ objectFit: "cover" }} />
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: isAdvancing ? "var(--text-100)" : "var(--text-300)" }}>{t.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bracket & Players ──────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          
          {/* PLAYOFF BRACKET */}
          <div>
            <h2 style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-200)", margin: "0 0 1.5rem" }}>
              Knockout Stage
            </h2>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              background: "var(--surface-0)",
              border: "1px solid var(--border-subtle)",
              padding: "2.5rem 1.5rem"
            }} className="bracket-container">
              
              {/* SEMIFINAL COLUMN */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3rem", width: "190px" }}>
                
                {/* MATCH 1: 1A vs 2B */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0", border: "1px solid var(--border-subtle)" }}>
                  {renderBracketNode(sf1Team1, sf1Winner === sf1Team1, () => { setSf1Winner(sf1Team1); if(champion === sf1Team2) setChampion(null); }, "1A")}
                  <div style={{ height: "1px", background: "var(--border-subtle)" }} />
                  {renderBracketNode(sf1Team2, sf1Winner === sf1Team2, () => { setSf1Winner(sf1Team2); if(champion === sf1Team1) setChampion(null); }, "2B")}
                </div>

                {/* MATCH 2: 1B vs 2A */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0", border: "1px solid var(--border-subtle)" }}>
                  {renderBracketNode(sf2Team1, sf2Winner === sf2Team1, () => { setSf2Winner(sf2Team1); if(champion === sf2Team2) setChampion(null); }, "1B")}
                  <div style={{ height: "1px", background: "var(--border-subtle)" }} />
                  {renderBracketNode(sf2Team2, sf2Winner === sf2Team2, () => { setSf2Winner(sf2Team2); if(champion === sf2Team1) setChampion(null); }, "2A")}
                </div>

              </div>

              {/* FINAL COLUMN */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "190px", position: "relative" }}>
                <span style={{ position: "absolute", top: "-25px", left: "50%", transform: "translateX(-50%)", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", color: "var(--cyan-vivid)" }}>FINAL</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0", border: "1px solid var(--border-accent)", boxShadow: "0 0 20px rgba(0, 212, 255, 0.1)" }}>
                  {sf1Winner 
                    ? renderBracketNode(sf1Winner, champion === sf1Winner, () => setChampion(sf1Winner), "W1")
                    : <div style={{ height: "46px", background: "var(--surface-1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-500)", fontSize: "0.7rem", fontWeight: 700 }}>TBD</div>
                  }
                  <div style={{ height: "1px", background: "var(--border-accent)" }} />
                  {sf2Winner 
                    ? renderBracketNode(sf2Winner, champion === sf2Winner, () => setChampion(sf2Winner), "W2")
                    : <div style={{ height: "46px", background: "var(--surface-1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-500)", fontSize: "0.7rem", fontWeight: 700 }}>TBD</div>
                  }
                </div>
              </div>

              {/* CHAMPION COLUMN */}
              <div style={{ width: "150px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                 <div style={{ 
                   width: "80px", height: "80px", borderRadius: "50%", 
                   border: champion ? "4px solid var(--cyan-vivid)" : "4px dashed var(--border-default)",
                   display: "flex", alignItems: "center", justifyContent: "center",
                   background: "var(--surface-1)",
                   boxShadow: champion ? "0 0 40px var(--cyan-glow)" : "none",
                   transition: "all 0.3s ease"
                 }}>
                   {champion && teamsById.get(champion)?.flagCode ? (
                     <img src={`https://flagcdn.com/w80/${teamsById.get(champion)?.flagCode}.png`} alt="" width={44} height={30} style={{ objectFit: "cover" }} />
                   ) : (
                     <span style={{ fontSize: "1.5rem" }}>🏆</span>
                   )}
                 </div>
                 <span style={{ marginTop: "1rem", fontSize: "0.9rem", fontWeight: 900, textTransform: "uppercase", color: champion ? "var(--cyan-vivid)" : "var(--text-500)", letterSpacing: "0.1em" }}>
                   {champion ? teamsById.get(champion)?.name : "Champion"}
                 </span>
              </div>

            </div>
          </div>

          {/* PLAYER PREDICTIONS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ border: "1px solid var(--border-subtle)", padding: "1.25rem", background: "var(--surface-0)" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-400)", display: "block", marginBottom: "1rem" }}>
                Golden Boot Prediction
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select 
                  value={topScorerId} 
                  onChange={(e) => setTopScorerId(e.target.value)}
                  disabled={locked}
                  style={{ flex: 1, padding: "0.6rem 0.8rem", background: "var(--surface-1)", border: "1px solid var(--border-default)", color: "var(--text-100)", fontSize: "0.85rem", fontWeight: 600, outline: "none", cursor: locked ? "not-allowed" : "pointer" }}
                >
                  <option value="">— Select Player —</option>
                  {players.sort((a,b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input 
                  type="number" 
                  min="0" 
                  placeholder="Goals"
                  value={topScorerGoals}
                  onChange={(e) => setTopScorerGoals(e.target.value)}
                  disabled={locked}
                  style={{ width: "80px", padding: "0.6rem", background: "var(--surface-1)", border: "1px solid var(--border-default)", color: "var(--text-100)", fontSize: "0.85rem", fontWeight: 800, textAlign: "center", outline: "none" }}
                />
              </div>
            </div>

            <div style={{ border: "1px solid var(--border-subtle)", padding: "1.25rem", background: "var(--surface-0)" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-400)", display: "block", marginBottom: "1rem" }}>
                Top Assist Prediction
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select 
                  value={topAssistId} 
                  onChange={(e) => setTopAssistId(e.target.value)}
                  disabled={locked}
                  style={{ flex: 1, padding: "0.6rem 0.8rem", background: "var(--surface-1)", border: "1px solid var(--border-default)", color: "var(--text-100)", fontSize: "0.85rem", fontWeight: 600, outline: "none", cursor: locked ? "not-allowed" : "pointer" }}
                >
                  <option value="">— Select Player —</option>
                  {players.sort((a,b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input 
                  type="number" 
                  min="0" 
                  placeholder="Assists"
                  value={topAssistCount}
                  onChange={(e) => setTopAssistCount(e.target.value)}
                  disabled={locked}
                  style={{ width: "80px", padding: "0.6rem", background: "var(--surface-1)", border: "1px solid var(--border-default)", color: "var(--text-100)", fontSize: "0.85rem", fontWeight: 800, textAlign: "center", outline: "none" }}
                />
              </div>
            </div>
          </div>

          {/* LOCK BAR / LAB COMPARISON */}
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
             {!locked ? (
               <button 
                 onClick={() => setLocked(true)}
                 disabled={!champion || !topScorerId || !topAssistId || !topScorerGoals || !topAssistCount}
                 style={{ 
                   width: "100%", padding: "1.2rem", background: "var(--cyan-vivid)", color: "var(--ink-900)", 
                   fontSize: "0.9rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
                   border: "none", cursor: (!champion || !topScorerId || !topAssistId || !topScorerGoals || !topAssistCount) ? "not-allowed" : "pointer",
                   opacity: (!champion || !topScorerId || !topAssistId || !topScorerGoals || !topAssistCount) ? 0.3 : 1,
                   transform: "skewX(-8deg)"
                 }}
               >
                 <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>Lock In Bracket & Compare With AI →</span>
               </button>
             ) : (
               <div style={{ border: "1px solid var(--cyan-vivid)", background: "var(--cyan-soft)", padding: "1.5rem" }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                    <div style={{ width: "3px", height: "1rem", background: "var(--cyan-vivid)", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.7rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-100)" }}>
                      AI Calibration Result
                    </span>
                 </div>
                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                   <div>
                     <p style={{ margin: "0 0 0.5rem", fontSize: "0.65rem", color: "var(--text-400)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Lab Champion Pick</p>
                     <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface-1)", padding: "0.8rem", border: "1px solid var(--border-default)" }}>
                       {lab.champion.team.flagCode && <img src={`https://flagcdn.com/w40/${lab.champion.team.flagCode}.png`} alt="" width={20} height={14} />}
                       <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--amber-vivid)" }}>{lab.champion.team.name}</span>
                       <span style={{ marginLeft: "auto", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-300)" }}>{(lab.champion.prob * 100).toFixed(1)}%</span>
                     </div>
                   </div>
                   <div>
                     <p style={{ margin: "0 0 0.5rem", fontSize: "0.65rem", color: "var(--text-400)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Lab Top Scorer Fav</p>
                     <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface-1)", padding: "0.8rem", border: "1px solid var(--border-default)" }}>
                       <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--green-vivid)" }}>{lab.topScorer?.player.name}</span>
                       <span style={{ marginLeft: "auto", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-300)" }}>{(lab.topScorer ? lab.topScorer.prob * 100 : 0).toFixed(1)}%</span>
                     </div>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
