"use client";
import { useEffect, useMemo, useState } from "react";
import type { Team, TeamForecast, Player, PlayerForecast, Fixture } from "@/lib/types";
import { toPercent } from "@/lib/view";
import { SearchableSelect, type SelectOption } from "@/components/searchable-select";
import { getAuthUser, getUserPicks, saveUserPicks, upsertLeaderboardEntry } from "@/lib/store";

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUP_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

// ─── Types ────────────────────────────────────────────────────────────────────

type LabPrediction = {
  champion:  { team: Team; prob: number };
  finalist:  { team: Team; prob: number };
  topScorer: { player: Player; prob: number } | null;
  topAssist: { player: Player; prob: number } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SectionHeader = ({
  label,
  accent = "var(--cyan-vivid)",
  sub,
}: {
  label: string;
  accent?: string;
  sub?: string;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
    <div style={{ width: "3px", height: "1.15rem", background: accent, flexShrink: 0 }} />
    <div>
      <span style={{
        fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic",
        letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-100)",
      }}>
        {label}
      </span>
      {sub && (
        <span style={{ marginLeft: "0.5rem", fontSize: "0.62rem", color: "var(--text-500)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {sub}
        </span>
      )}
    </div>
    <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
  </div>
);

const LabChip = ({ text }: { text: string }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    padding: "0.12rem 0.45rem",
    fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.08em",
    textTransform: "uppercase",
    background: "var(--cyan-soft)",
    border: "1px solid rgba(0,212,255,0.25)",
    color: "var(--cyan-vivid)",
    whiteSpace: "nowrap",
  }}>
    AI · {text}
  </span>
);

const NumberInput = ({
  value, onChange, disabled, placeholder,
}: {
  value: string; onChange: (v: string) => void;
  disabled: boolean; placeholder: string;
}) => (
  <input
    type="number" min="0" max="30"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    placeholder={placeholder}
    style={{
      width: "68px", padding: "0.55rem 0.5rem",
      background: disabled ? "var(--surface-1)" : "var(--surface-2)",
      border: "1px solid var(--border-default)",
      color: "var(--text-100)", fontSize: "0.88rem", fontWeight: 800,
      fontStyle: "italic", textAlign: "center", outline: "none",
      fontFamily: "var(--font-sans)",
      MozAppearance: "textfield",
    } as React.CSSProperties}
  />
);

// ─── Main component ───────────────────────────────────────────────────────────

export function PredictClient({
  teams,
  players,
  forecasts,
  lab,
}: {
  fixtures:       Fixture[];
  teams:          Team[];
  forecasts:      TeamForecast[];
  players:        Player[];
  playerForecasts: PlayerForecast[];
  lab:            LabPrediction;
}) {
  const teamsById    = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const forecastById = useMemo(() => new Map(forecasts.map((f) => [f.teamId, f])), [forecasts]);

  // ── Group rankings ─────────────────────────────────────────────────────────
  const initialRankings = useMemo(() => {
    const r: Record<string, string[]> = {};
    for (const g of GROUP_LETTERS) {
      r[g] = teams
        .filter((t) => t.group === g)
        .sort((a, b) => {
          const fa = forecastById.get(a.id)?.groupQualificationProbability ?? 0;
          const fb = forecastById.get(b.id)?.groupQualificationProbability ?? 0;
          return fb - fa;
        })
        .map((t) => t.id);
    }
    return r;
  }, [teams, forecastById]);

  const [rankings, setRankings] = useState<Record<string, string[]>>(initialRankings);

  // ── Final picks ─────────────────────────────────────────────────────────────
  const [champion, setChampion] = useState("");
  const [finalist, setFinalist] = useState("");

  // ── Awards ─────────────────────────────────────────────────────────────────
  const [topScorerId,    setTopScorerId]    = useState("");
  const [topScorerGoals, setTopScorerGoals] = useState("");
  const [topAssistId,    setTopAssistId]    = useState("");
  const [topAssistCount, setTopAssistCount] = useState("");
  const [goldenBallId,   setGoldenBallId]   = useState("");

  const [locked,       setLocked]       = useState(false);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [displayName,  setDisplayName]  = useState<string | null>(null);
  const [rank,         setRank]         = useState<number | null>(null);
  const [nameInput,    setNameInput]    = useState("");
  const [nameError,    setNameError]    = useState("");

  // ── Restore picks from localStorage on mount ───────────────────────────────
  useEffect(() => {
    const user = getAuthUser();
    if (!user) return;
    setUserId(user.id);
    setDisplayName(user.displayName);
    const saved = getUserPicks(user.id);
    if (!saved) return;
    setRankings(saved.groupRankings);
    setChampion(saved.championId);
    setFinalist(saved.finalistId);
    setTopScorerId(saved.topScorerId);
    setTopScorerGoals(String(saved.topScorerGoals));
    setTopAssistId(saved.topAssistId);
    setTopAssistCount(String(saved.topAssistCount));
    setGoldenBallId(saved.goldenBallId);
    setLocked(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reordering ─────────────────────────────────────────────────────────────
  const moveTeam = (group: string, index: number, dir: 1 | -1) => {
    if (locked) return;
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx > 3) return;
    setRankings((prev) => {
      const g = [...prev[group]];
      [g[index], g[newIdx]] = [g[newIdx], g[index]];
      return { ...prev, [group]: g };
    });
  };

  // ── Lab group predictions (by powerIndex) ──────────────────────────────────
  const labGroupOrder = useMemo(() => {
    const r: Record<string, string[]> = {};
    for (const g of GROUP_LETTERS) {
      r[g] = [...teams]
        .filter((t) => t.group === g)
        .sort((a, b) => b.powerIndex - a.powerIndex)
        .map((t) => t.id);
    }
    return r;
  }, [teams]);

  // ── Dropdown options ───────────────────────────────────────────────────────
  const teamOptions: SelectOption[] = useMemo(
    () =>
      [...teams]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => ({
          value:    t.id,
          label:    t.name,
          sublabel: `Group ${t.group}`,
          flagCode: t.flagCode,
        })),
    [teams],
  );

  const playerOptions: SelectOption[] = useMemo(
    () =>
      [...players]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => {
          const team = teamsById.get(p.teamId);
          return {
            value:    p.id,
            label:    p.name,
            sublabel: team?.name ?? p.teamId,
            flagCode: team?.flagCode,
            photoUrl: p.photoUrl,
          };
        }),
    [players, teamsById],
  );

  // ── Progress ───────────────────────────────────────────────────────────────
  const fields = [!!champion, !!finalist, !!topScorerId, !!topScorerGoals, !!topAssistId, !!topAssistCount, !!goldenBallId];
  const filledCount  = fields.filter(Boolean).length;
  const canLock      = fields.every(Boolean);
  const progressPct  = filledCount / fields.length;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const teamName  = (id: string) => teamsById.get(id)?.name ?? id;
  const teamFlag  = (id: string) => teamsById.get(id)?.flagCode;
  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? "—";
  const groupMatchesLab = (g: string) =>
    (rankings[g] ?? []).slice(0, 2).every((id, i) => labGroupOrder[g]?.[i] === id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem", paddingBottom: "5rem" }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <div className="live-dot" />
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-400)" }}>
            World Cup 2026 · Tournament Prediction Challenge
          </span>
        </div>

        <h1 className="text-display" style={{ margin: "0 0 0.75rem" }}>
          Beat{" "}
          <span style={{ color: "var(--cyan-vivid)" }}>The Lab.</span>
        </h1>

        <p style={{ margin: "0 0 1.5rem", maxWidth: "560px", fontSize: "0.9rem", color: "var(--text-300)", lineHeight: 1.65 }}>
          Rank all 12 groups, pick the champion &amp; finalist, and call the individual award winners.
          Lock in before the tournament starts — we'll score your picks against 10,000 AI simulations.
        </p>

        {/* ── Inline name prompt (shown when not identified) ─────── */}
        {!displayName && !locked && (
          <div style={{
            border: "1px solid var(--border-accent)", background: "var(--cyan-soft)",
            padding: "0.85rem 1.1rem", marginBottom: "1.25rem",
            display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
          }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-300)", flexShrink: 0 }}>
              Who's competing?
            </span>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => { setNameInput(e.target.value); setNameError(""); }}
              placeholder="Your display name"
              maxLength={32}
              style={{
                flex: "1 1 140px", padding: "0.4rem 0.65rem",
                background: "#0e0320", border: `1px solid ${nameError ? "var(--rose-vivid)" : "var(--border-default)"}`,
                color: "var(--text-100)", fontSize: "0.82rem", fontFamily: "var(--font-sans)",
                outline: "none", minWidth: 0,
              }}
            />
            <button
              onClick={() => {
                const name = nameInput.trim();
                if (!name || name.length < 2) { setNameError("Min 2 characters"); return; }
                const { signIn } = require("@/lib/store");
                const user = signIn(name);
                setUserId(user.id);
                setDisplayName(user.displayName);
              }}
              style={{
                padding: "0.4rem 1rem", background: "var(--cyan-vivid)",
                border: "none", color: "var(--surface-0)",
                fontSize: "0.72rem", fontWeight: 900, fontStyle: "italic",
                letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              Save Name
            </button>
            {nameError && <span style={{ fontSize: "0.65rem", color: "var(--rose-vivid)", width: "100%" }}>{nameError}</span>}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ border: "1px solid var(--border-subtle)", padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: locked ? "var(--cyan-vivid)" : "var(--text-400)", fontStyle: locked ? "italic" : "normal" }}>
              {locked
                ? `Picks locked${displayName ? ` · ${displayName}` : ""}`
                : canLock
                  ? "All picks ready — lock them in"
                  : `${filledCount} / ${fields.length} picks filled`}
            </span>
            {!locked ? (
              <button
                onClick={() => {
                  if (!canLock) return;
                  const user = getAuthUser();
                  const uid  = userId ?? user?.id ?? `guest-${Date.now()}`;
                  const name = displayName ?? user?.displayName ?? "Anonymous";
                  const picks = {
                    userId:         uid,
                    lockedAt:       new Date().toISOString(),
                    groupRankings:  rankings,
                    championId:     champion,
                    finalistId:     finalist,
                    topScorerId,
                    topScorerGoals: Number(topScorerGoals),
                    topAssistId,
                    topAssistCount: Number(topAssistCount),
                    goldenBallId,
                  };
                  saveUserPicks(picks);
                  upsertLeaderboardEntry({ userId: uid, displayName: name, points: 0, isBot: false, picks });
                  const { getLeaderboard } = require("@/lib/store");
                  const board = getLeaderboard();
                  const r = board.findIndex((e: { userId: string }) => e.userId === uid) + 1;
                  setRank(r > 0 ? r : null);
                  setDisplayName(name);
                  setLocked(true);
                }}
                disabled={!canLock}
                style={{
                  padding: "0.5rem 1.4rem",
                  background: canLock ? "var(--cyan-vivid)" : "transparent",
                  border: `1px solid ${canLock ? "var(--cyan-vivid)" : "var(--border-default)"}`,
                  color: canLock ? "var(--surface-0)" : "var(--text-500)",
                  fontSize: "0.78rem", fontWeight: 900, fontStyle: "italic",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  transform: "skewX(-8deg)", cursor: canLock ? "pointer" : "not-allowed",
                  opacity: canLock ? 1 : 0.5, transition: "all 0.15s ease",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>Lock In Picks →</span>
              </button>
            ) : (
              <span style={{
                padding: "0.35rem 0.9rem", background: "var(--cyan-soft)",
                border: "1px solid var(--cyan-vivid)", color: "var(--cyan-vivid)",
                fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
              }}>LOCKED</span>
            )}
          </div>
          <div style={{ height: "3px", background: "var(--border-subtle)" }}>
            <div style={{
              height: "100%",
              width: locked ? "100%" : `${Math.round(progressPct * 100)}%`,
              background: locked ? "var(--cyan-vivid)" : "var(--cyan-mid)",
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        {/* ── Post-lock "You're in the competition" panel ────────── */}
        {locked && rank !== null && (
          <div style={{
            marginTop: "1rem",
            border: "1px solid rgba(0,224,150,0.35)", background: "rgba(0,224,150,0.06)",
            padding: "1rem 1.25rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "1rem", flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🏆</span>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "0.78rem", fontWeight: 800, color: "var(--green-vivid)" }}>
                  You&apos;re in the competition!
                </p>
                <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-400)" }}>
                  {displayName && <strong style={{ color: "var(--text-200)" }}>{displayName}</strong>} · Current rank{" "}
                  <strong style={{ color: "var(--cyan-vivid)" }}>#{rank}</strong>
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <a href="/leaderboard" style={{
                padding: "0.45rem 1rem",
                background: "var(--cyan-vivid)", color: "var(--surface-0)",
                fontSize: "0.72rem", fontWeight: 900, fontStyle: "italic",
                letterSpacing: "0.08em", textTransform: "uppercase",
                textDecoration: "none", transform: "skewX(-8deg)", display: "inline-block",
              }}>
                <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>See Leaderboard →</span>
              </a>
              <a href="/agent-feed" style={{
                padding: "0.45rem 1rem",
                background: "transparent", color: "var(--cyan-vivid)",
                border: "1px solid var(--cyan-vivid)",
                fontSize: "0.72rem", fontWeight: 700,
                letterSpacing: "0.06em", textTransform: "uppercase",
                textDecoration: "none", display: "inline-block",
              }}>
                You vs Lab →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── GROUP STAGE ──────────────────────────────────────────── */}
      <div>
        <SectionHeader
          label="Group Stage"
          sub={`Rank all ${GROUP_LETTERS.length} groups · top 2 advance`}
        />

        <div style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
        }}>
          {GROUP_LETTERS.map((g) => {
            const groupTeams = rankings[g] ?? [];
            if (groupTeams.length === 0) return null;
            const labOrder = labGroupOrder[g] ?? [];
            const matches  = groupMatchesLab(g);

            return (
              <div
                key={g}
                style={{
                  border: locked
                    ? matches ? "1px solid rgba(0,224,150,0.35)" : "1px solid var(--border-subtle)"
                    : "1px solid var(--border-subtle)",
                  background: "var(--surface-1)",
                }}
              >
                {/* Header */}
                <div style={{
                  padding: "0.5rem 0.75rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--surface-2)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 900, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-100)" }}>
                    Group {g}
                  </span>
                  {locked && (
                    <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: matches ? "var(--green-vivid)" : "var(--text-500)" }}>
                      {matches ? "✓ Lab match" : "Differs"}
                    </span>
                  )}
                </div>

                {/* Teams */}
                {groupTeams.map((teamId, idx) => {
                  const t = teamsById.get(teamId);
                  if (!t) return null;
                  const qualifies = idx < 2;
                  const labIdx    = labOrder.indexOf(teamId);
                  const diff      = locked && labIdx >= 0 ? labIdx - idx : 0;

                  return (
                    <div
                      key={teamId}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        padding: "0.42rem 0.55rem",
                        borderBottom: idx < 3 ? "1px solid var(--border-subtle)" : "none",
                        background: qualifies ? "rgba(255,255,255,0.02)" : "transparent",
                      }}
                    >
                      <span style={{ width: "14px", textAlign: "center", fontSize: "0.7rem", fontWeight: 800, color: qualifies ? "var(--cyan-vivid)" : "var(--text-500)", flexShrink: 0 }}>
                        {idx + 1}
                      </span>

                      {t.flagCode && (
                        <img
                          src={`https://flagcdn.com/w40/${t.flagCode}.png`}
                          alt=""
                          width={17}
                          height={11}
                          style={{ objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.06)" }}
                        />
                      )}

                      <span style={{
                        flex: 1, fontSize: "0.76rem",
                        fontWeight: qualifies ? 700 : 400,
                        color: qualifies ? "var(--text-100)" : "var(--text-400)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {t.name}
                      </span>

                      {locked && diff !== 0 && (
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: diff > 0 ? "var(--text-500)" : "var(--rose-vivid)", flexShrink: 0 }}>
                          {diff > 0 ? `↓${diff}` : `↑${Math.abs(diff)}`}
                        </span>
                      )}

                      {!locked && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px", flexShrink: 0 }}>
                          {[{ dir: -1 as const, label: "▲", disabled: idx === 0 }, { dir: 1 as const, label: "▽", disabled: idx === 3 }].map(({ dir, label, disabled }) => (
                            <button
                              key={dir}
                              onClick={() => moveTeam(g, idx, dir)}
                              disabled={disabled}
                              style={{
                                width: "15px", height: "13px", padding: 0,
                                background: "transparent",
                                border: "1px solid var(--border-subtle)",
                                color: disabled ? "var(--text-500)" : "var(--text-300)",
                                fontSize: "0.5rem", lineHeight: 1,
                                cursor: disabled ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TOURNAMENT OUTCOME ───────────────────────────────────── */}
      <div>
        <SectionHeader label="Tournament Outcome" accent="var(--amber-vivid)" />

        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>

          {/* Champion */}
          <div style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-1)", overflow: "visible" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber-vivid)" }}>
                World Champion
              </span>
              {locked && (
                <LabChip text={`${lab.champion.team.name} ${toPercent(lab.champion.prob)}`} />
              )}
            </div>
            <div style={{ padding: "0.85rem", position: "relative", zIndex: 10 }}>
              <SearchableSelect
                options={teamOptions}
                value={champion}
                onChange={setChampion}
                placeholder="— Pick your champion —"
                disabled={locked}
                mode="flag"
              />
              {locked && champion && (
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: champion === lab.champion.team.id ? "var(--green-vivid)" : "var(--text-500)" }}>
                  {champion === lab.champion.team.id ? "✓ Matches Lab pick" : `Lab picked: ${lab.champion.team.name}`}
                </p>
              )}
            </div>
          </div>

          {/* Finalist */}
          <div style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-1)", overflow: "visible" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cyan-vivid)" }}>
                Runner-Up / Finalist
              </span>
              {locked && (
                <LabChip text={`${lab.finalist.team.name} ${toPercent(lab.finalist.prob)}`} />
              )}
            </div>
            <div style={{ padding: "0.85rem", position: "relative", zIndex: 10 }}>
              <SearchableSelect
                options={teamOptions}
                value={finalist}
                onChange={setFinalist}
                placeholder="— Pick the finalist —"
                disabled={locked}
                mode="flag"
              />
              {locked && finalist && (
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: finalist === lab.finalist.team.id ? "var(--green-vivid)" : "var(--text-500)" }}>
                  {finalist === lab.finalist.team.id ? "✓ Matches Lab pick" : `Lab picked: ${lab.finalist.team.name}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── INDIVIDUAL AWARDS ────────────────────────────────────── */}
      <div>
        <SectionHeader label="Individual Awards" accent="var(--amber-vivid)" sub="Golden Boot · Assist King · Golden Ball" />

        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>

          {/* Golden Boot */}
          <div style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-1)", overflow: "visible" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber-vivid)" }}>
                  Golden Boot
                </span>
                <span style={{ fontSize: "0.58rem", color: "var(--text-500)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Top Scorer
                </span>
              </div>
              {locked && lab.topScorer && (
                <LabChip text={`${lab.topScorer.player.name} ${toPercent(lab.topScorer.prob)}`} />
              )}
            </div>
            <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.6rem", position: "relative", zIndex: 10 }}>
              <SearchableSelect
                options={playerOptions}
                value={topScorerId}
                onChange={setTopScorerId}
                placeholder="— Pick top scorer —"
                disabled={locked}
                mode="player"
              />
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <NumberInput
                  value={topScorerGoals}
                  onChange={setTopScorerGoals}
                  disabled={locked}
                  placeholder="Goals"
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-400)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  predicted goals in tournament
                </span>
              </div>
              {locked && topScorerId && lab.topScorer && (
                <p style={{ margin: 0, fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: topScorerId === lab.topScorer.player.id ? "var(--green-vivid)" : "var(--text-500)" }}>
                  {topScorerId === lab.topScorer.player.id ? "✓ Matches Lab" : `Lab: ${lab.topScorer.player.name}`}
                </p>
              )}
            </div>
          </div>

          {/* Assist King */}
          <div style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-1)", overflow: "visible" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green-vivid)" }}>
                  Assist King
                </span>
                <span style={{ fontSize: "0.58rem", color: "var(--text-500)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Most Assists
                </span>
              </div>
              {locked && lab.topAssist && (
                <LabChip text={`${lab.topAssist.player.name} ${toPercent(lab.topAssist.prob)}`} />
              )}
            </div>
            <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.6rem", position: "relative", zIndex: 10 }}>
              <SearchableSelect
                options={playerOptions}
                value={topAssistId}
                onChange={setTopAssistId}
                placeholder="— Pick assist leader —"
                disabled={locked}
                mode="player"
              />
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <NumberInput
                  value={topAssistCount}
                  onChange={setTopAssistCount}
                  disabled={locked}
                  placeholder="Assists"
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-400)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  predicted assists in tournament
                </span>
              </div>
              {locked && topAssistId && lab.topAssist && (
                <p style={{ margin: 0, fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: topAssistId === lab.topAssist.player.id ? "var(--green-vivid)" : "var(--text-500)" }}>
                  {topAssistId === lab.topAssist.player.id ? "✓ Matches Lab" : `Lab: ${lab.topAssist.player.name}`}
                </p>
              )}
            </div>
          </div>

          {/* Golden Ball */}
          <div style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-1)", overflow: "visible" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cyan-vivid)" }}>
                  Golden Ball
                </span>
                <span style={{ fontSize: "0.58rem", color: "var(--text-500)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Best Player
                </span>
              </div>
              {locked && lab.topScorer && (
                <LabChip text={lab.topScorer.player.name} />
              )}
            </div>
            <div style={{ padding: "0.85rem", position: "relative", zIndex: 10 }}>
              <SearchableSelect
                options={playerOptions}
                value={goldenBallId}
                onChange={setGoldenBallId}
                placeholder="— Pick best player —"
                disabled={locked}
                mode="player"
              />
              {locked && goldenBallId && lab.topScorer && (
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: goldenBallId === lab.topScorer.player.id ? "var(--green-vivid)" : "var(--text-500)" }}>
                  {goldenBallId === lab.topScorer.player.id ? "✓ Matches Lab" : `Lab: ${lab.topScorer.player.name}`}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── POST-LOCK SUMMARY ────────────────────────────────────── */}
      {locked && (
        <div style={{ border: "1px solid var(--cyan-vivid)", background: "var(--cyan-soft)", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "3px", height: "1.1rem", background: "var(--cyan-vivid)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-100)" }}>
              Your Picks vs The Lab
            </span>
          </div>

          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {[
              {
                label:   "Champion",
                yours:   teamName(champion),
                lab:     lab.champion.team.name,
                match:   champion === lab.champion.team.id,
                flag:    teamFlag(champion),
              },
              {
                label:   "Finalist",
                yours:   teamName(finalist),
                lab:     lab.finalist.team.name,
                match:   finalist === lab.finalist.team.id,
                flag:    teamFlag(finalist),
              },
              {
                label:   "Golden Boot",
                yours:   playerName(topScorerId) + (topScorerGoals ? ` (${topScorerGoals}g)` : ""),
                lab:     lab.topScorer?.player.name ?? "—",
                match:   topScorerId === lab.topScorer?.player.id,
                flag:    undefined,
              },
              {
                label:   "Assist King",
                yours:   playerName(topAssistId) + (topAssistCount ? ` (${topAssistCount}a)` : ""),
                lab:     lab.topAssist?.player.name ?? "—",
                match:   topAssistId === lab.topAssist?.player.id,
                flag:    undefined,
              },
              {
                label:   "Golden Ball",
                yours:   playerName(goldenBallId),
                lab:     lab.topScorer?.player.name ?? "—",
                match:   goldenBallId === lab.topScorer?.player.id,
                flag:    undefined,
              },
            ].map((row) => (
              <div key={row.label} style={{ border: "1px solid var(--border-subtle)", padding: "0.85rem", background: "var(--surface-1)" }}>
                <p style={{ margin: "0 0 0.4rem", fontSize: "0.6rem", color: "var(--text-500)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono)" }}>
                  {row.label}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                  {row.flag && (
                    <img src={`https://flagcdn.com/w40/${row.flag}.png`} alt="" width={16} height={11} style={{ objectFit: "cover" }} />
                  )}
                  <span style={{ fontSize: "0.88rem", fontWeight: 800, fontStyle: "italic", textTransform: "uppercase", color: row.match ? "var(--green-vivid)" : "var(--text-100)" }}>
                    {row.yours}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.65rem", color: row.match ? "var(--green-vivid)" : "var(--text-500)", fontFamily: "var(--font-mono)" }}>
                  {row.match ? "✓ Matches Lab" : `Lab: ${row.lab}`}
                </p>
              </div>
            ))}
          </div>

          <p style={{ margin: "1.25rem 0 0", fontSize: "0.72rem", color: "var(--text-400)", lineHeight: 1.7 }}>
            Tournament starts <strong style={{ color: "var(--text-200)" }}>June 11, 2026</strong>.
            Your picks are locked and will be scored automatically as matches resolve.
            Return after each round to track your accuracy against the Lab.
          </p>
        </div>
      )}

    </div>
  );
}
