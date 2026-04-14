"use client";
import { useState, useTransition } from "react";
import type { Team, TeamForecast, PlayerForecast, Player, Fixture } from "@/lib/types";
import { toPercent } from "@/lib/view";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScorePick  = { home: string; away: string };
type OutrightId = "champion" | "finalist" | "topScorer" | "topAssist";

type OutrightPick = {
  champion:  string;
  finalist:  string;
  topScorer: string;
  topAssist: string;
};

type LabPrediction = {
  champion:  { team: Team; prob: number };
  finalist:  { team: Team; prob: number };
  topScorer: { player: Player; prob: number } | null;
  topAssist: { player: Player; prob: number } | null;
};

// ─── Score input ──────────────────────────────────────────────────────────────

const ScoreInput = ({
  value,
  onChange,
  locked,
}: {
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
}) => (
  <input
    type="number"
    min="0"
    max="20"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={locked}
    style={{
      width: "2.4rem",
      height: "2.4rem",
      textAlign: "center",
      fontSize: "1rem",
      fontWeight: 900,
      fontStyle: "italic",
      background: locked ? "var(--surface-1)" : "var(--surface-2)",
      border: `1px solid ${locked ? "var(--border-default)" : "var(--border-default)"}`,
      color: locked ? "var(--text-400)" : "var(--text-100)",
      fontFamily: "var(--font-sans)",
      outline: "none",
      cursor: locked ? "not-allowed" : "text",
      MozAppearance: "textfield",
    }}
  />
);

// ─── Accuracy badge ───────────────────────────────────────────────────────────

const HitBadge = ({ hit }: { hit: boolean }) => (
  <span
    style={{
      fontSize: "0.6rem",
      fontWeight: 800,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      padding: "0.15rem 0.5rem",
      background: hit ? "var(--cyan-vivid)" : "var(--rose-vivid)",
      color: hit ? "var(--surface-0)" : "var(--text-100)",
      transform: "skewX(-8deg)",
      display: "inline-block",
      flexShrink: 0,
    }}
  >
    <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>
      {hit ? "HIT" : "MISS"}
    </span>
  </span>
);

// ─── Main client component ────────────────────────────────────────────────────

export function PredictClient({
  fixtures,
  teams,
  forecasts,
  players,
  playerForecasts,
  lab,
}: {
  fixtures: Fixture[];
  teams: Team[];
  forecasts: TeamForecast[];
  players: Player[];
  playerForecasts: PlayerForecast[];
  lab: LabPrediction;
}) {
  const teamsById  = new Map(teams.map((t) => [t.id, t]));
  const upcoming   = fixtures
    .filter((f) => f.status === "scheduled")
    .sort((a, b) => a.dateUtc.localeCompare(b.dateUtc))
    .slice(0, 8);

  const [scorePicks, setScorePicks] = useState<Record<string, ScorePick>>(
    Object.fromEntries(upcoming.map((f) => [f.id, { home: "", away: "" }])),
  );

  const [outrightPicks, setOutrightPicks] = useState<OutrightPick>({
    champion:  "",
    finalist:  "",
    topScorer: "",
    topAssist: "",
  });

  const [locked,  setLocked]  = useState(false);
  const [, startTransition]   = useTransition();

  const filledScores   = Object.values(scorePicks).filter((p) => p.home !== "" && p.away !== "").length;
  const filledOutright = Object.values(outrightPicks).filter(Boolean).length;
  const totalPicks     = filledScores + filledOutright;
  const canLock        = !locked && totalPicks >= 3;

  const handleLock = () => {
    startTransition(() => setLocked(true));
  };

  // Compute a simple "match outcome" from power indices as Lab prediction
  const getLabScore = (homeId: string, awayId: string): [number, number] => {
    const home = teamsById.get(homeId)?.powerIndex ?? 70;
    const away = teamsById.get(awayId)?.powerIndex ?? 70;
    const diff = home - away;
    if (diff > 8)  return [2, 0];
    if (diff > 3)  return [1, 0];
    if (diff < -8) return [0, 2];
    if (diff < -3) return [0, 1];
    return [1, 1];
  };

  // Compare user score pick vs Lab
  const scoreMatchesLab = (fixtureId: string, homeId: string, awayId: string) => {
    const pick = scorePicks[fixtureId];
    if (!pick || pick.home === "" || pick.away === "") return null;
    const [lh, la] = getLabScore(homeId, awayId);
    const userOutcome = parseInt(pick.home) > parseInt(pick.away) ? "home" : parseInt(pick.home) < parseInt(pick.away) ? "away" : "draw";
    const labOutcome  = lh > la ? "home" : lh < la ? "away" : "draw";
    return userOutcome === labOutcome;
  };

  const champMatch  = locked && outrightPicks.champion  === lab.champion.team.id;
  const finalistMatch = locked && outrightPicks.finalist === lab.finalist.team.id;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <div className="live-dot" />
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-400)" }}>
            World Cup 2026 · Prediction Game
          </span>
        </div>
        <h1 className="text-sport-hero" style={{ margin: "0 0 0.75rem" }}>
          Beat<br />
          <span style={{ color: "var(--cyan-vivid)" }}>The Lab.</span>
        </h1>
        <p style={{ margin: 0, maxWidth: "500px", fontSize: "0.9rem", color: "var(--text-400)", lineHeight: 1.6 }}>
          Pick match scores and tournament winners. We'll show you how your predictions
          stack up against 10,000 AI simulations when the tournament ends.
        </p>
      </div>

      {/* ── Progress bar ───────────────────────────────────────────── */}
      <div style={{ border: "1px solid var(--border-subtle)", padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-400)" }}>
            {locked ? "Picks Locked" : `${totalPicks} / ${upcoming.length + 4} picks made`}
          </span>
          {locked ? (
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0.2rem 0.6rem",
                background: "var(--cyan-vivid)",
                color: "var(--surface-0)",
                transform: "skewX(-8deg)",
                display: "inline-block",
              }}
            >
              <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>LOCKED IN</span>
            </span>
          ) : (
            <button
              onClick={handleLock}
              disabled={!canLock}
              className="btn-sport"
              style={{ opacity: canLock ? 1 : 0.4, cursor: canLock ? "pointer" : "not-allowed" }}
            >
              <span className="btn-sport-inner">Lock In Picks →</span>
            </button>
          )}
        </div>
        <div style={{ height: "3px", background: "var(--border-subtle)" }}>
          <div
            style={{
              height: "100%",
              background: locked ? "var(--cyan-vivid)" : "var(--border-default)",
              width: `${Math.min(100, (totalPicks / (upcoming.length + 4)) * 100)}%`,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* ── Two-column picks layout ─────────────────────────────────── */}
      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>

        {/* YOUR PICKS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: "3px", height: "1rem", background: "var(--cyan-vivid)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-100)" }}>
              Your Picks
            </span>
          </div>

          {/* Match score predictions */}
          <div style={{ border: "1px solid var(--border-subtle)" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-400)" }}>
                Match Score Predictions
              </span>
            </div>
            <div style={{ padding: "0.75rem" }}>
              {upcoming.map((fixture) => {
                const home = teamsById.get(fixture.homeTeamId);
                const away = teamsById.get(fixture.awayTeamId);
                if (!home || !away) return null;
                const pick = scorePicks[fixture.id];
                const matchHit = locked ? scoreMatchesLab(fixture.id, fixture.homeTeamId, fixture.awayTeamId) : null;

                return (
                  <div
                    key={fixture.id}
                    style={{
                      padding: "0.7rem 0.5rem",
                      borderBottom: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    {/* Home */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "flex-end", minWidth: 0 }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-100)", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {home.name}
                      </span>
                      {home.flagCode && (
                        <img src={`https://flagcdn.com/w40/${home.flagCode}.png`} alt="" width={18} height={12} style={{ objectFit: "cover", flexShrink: 0 }} />
                      )}
                    </div>

                    {/* Score inputs */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                      <ScoreInput value={pick?.home ?? ""} onChange={(v) => setScorePicks((p) => ({ ...p, [fixture.id]: { ...p[fixture.id], home: v } }))} locked={locked} />
                      <span style={{ color: "var(--text-500)", fontWeight: 900, fontSize: "0.9rem" }}>:</span>
                      <ScoreInput value={pick?.away ?? ""} onChange={(v) => setScorePicks((p) => ({ ...p, [fixture.id]: { ...p[fixture.id], away: v } }))} locked={locked} />
                    </div>

                    {/* Away */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                      {away.flagCode && (
                        <img src={`https://flagcdn.com/w40/${away.flagCode}.png`} alt="" width={18} height={12} style={{ objectFit: "cover", flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-100)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {away.name}
                      </span>
                    </div>

                    {/* Hit/miss after lock */}
                    {matchHit !== null && <HitBadge hit={matchHit} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outright picks */}
          <div style={{ border: "1px solid var(--border-subtle)" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-400)" }}>
                Tournament Outrights
              </span>
            </div>
            <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(
                [
                  { id: "champion",  label: "Champion",    options: teams },
                  { id: "finalist",  label: "Finalist",    options: teams },
                ] as { id: OutrightId; label: string; options: Team[] }[]
              ).map(({ id, label, options }) => (
                <div key={id}>
                  <label style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-400)", display: "block", marginBottom: "0.35rem" }}>
                    {label}
                  </label>
                  <select
                    disabled={locked}
                    value={outrightPicks[id]}
                    onChange={(e) => setOutrightPicks((p) => ({ ...p, [id]: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      background: locked ? "var(--surface-1)" : "var(--surface-2)",
                      border: "1px solid var(--border-default)",
                      color: outrightPicks[id] ? "var(--text-100)" : "var(--text-500)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-sans)",
                      cursor: locked ? "not-allowed" : "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="">— Select Team —</option>
                    {[...options]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                  </select>
                </div>
              ))}

              {(
                [
                  { id: "topScorer", label: "Golden Boot",     options: players },
                  { id: "topAssist", label: "Most Assists",    options: players },
                ] as { id: OutrightId; label: string; options: Player[] }[]
              ).map(({ id, label, options }) => (
                <div key={id}>
                  <label style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-400)", display: "block", marginBottom: "0.35rem" }}>
                    {label}
                  </label>
                  <select
                    disabled={locked}
                    value={outrightPicks[id]}
                    onChange={(e) => setOutrightPicks((p) => ({ ...p, [id]: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      background: locked ? "var(--surface-1)" : "var(--surface-2)",
                      border: "1px solid var(--border-default)",
                      color: outrightPicks[id] ? "var(--text-100)" : "var(--text-500)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-sans)",
                      cursor: locked ? "not-allowed" : "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="">— Select Player —</option>
                    {[...options]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => {
                        const team = teamsById.get(p.teamId);
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name}{team ? ` (${team.name})` : ""}
                          </option>
                        );
                      })}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* THE LAB */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: "3px", height: "1rem", background: "var(--amber-vivid)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-100)" }}>
              The Lab&apos;s Predictions
            </span>
            <span
              style={{
                fontSize: "0.55rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0.12rem 0.45rem",
                background: "var(--cyan-soft)",
                color: "var(--cyan-vivid)",
                border: "1px solid rgba(163,230,53,0.25)",
              }}
            >
              AI
            </span>
          </div>

          {/* Lab match predictions */}
          <div style={{ border: "1px solid var(--border-subtle)" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-400)" }}>
                AI Score Forecast
              </span>
            </div>
            <div style={{ padding: "0.75rem" }}>
              {upcoming.map((fixture) => {
                const home = teamsById.get(fixture.homeTeamId);
                const away = teamsById.get(fixture.awayTeamId);
                if (!home || !away) return null;
                const [lh, la] = getLabScore(fixture.homeTeamId, fixture.awayTeamId);
                const pick    = scorePicks[fixture.id];
                const hasPick = pick?.home !== "" && pick?.away !== "";
                const matchHit = locked && hasPick ? scoreMatchesLab(fixture.id, fixture.homeTeamId, fixture.awayTeamId) : null;

                return (
                  <div
                    key={fixture.id}
                    style={{
                      padding: "0.7rem 0.5rem",
                      borderBottom: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: matchHit === true ? "rgba(0,212,255,0.04)" : matchHit === false ? "rgba(255,61,113,0.04)" : "transparent",
                    }}
                  >
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "flex-end", minWidth: 0 }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-300)", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {home.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                      <span
                        style={{
                          width: "2.4rem",
                          height: "2.4rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--surface-1)",
                          border: "1px solid var(--border-default)",
                          fontSize: "1rem",
                          fontWeight: 900,
                          fontStyle: "italic",
                          color: "var(--amber-vivid)",
                        }}
                      >
                        {lh}
                      </span>
                      <span style={{ color: "var(--text-500)", fontWeight: 900, fontSize: "0.9rem" }}>:</span>
                      <span
                        style={{
                          width: "2.4rem",
                          height: "2.4rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--surface-1)",
                          border: "1px solid var(--border-default)",
                          fontSize: "1rem",
                          fontWeight: 900,
                          fontStyle: "italic",
                          color: "var(--amber-vivid)",
                        }}
                      >
                        {la}
                      </span>
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-300)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {away.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lab outright predictions */}
          <div style={{ border: "1px solid var(--border-subtle)" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-400)" }}>
                AI Tournament Outlook
              </span>
            </div>
            <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0" }}>

              {/* Champion */}
              <div style={{ padding: "0.85rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-400)" }}>Champion</span>
                  {locked && champMatch !== null && <HitBadge hit={champMatch} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {lab.champion.team.flagCode && (
                    <img src={`https://flagcdn.com/w40/${lab.champion.team.flagCode}.png`} alt="" width={22} height={15} style={{ objectFit: "cover" }} />
                  )}
                  <span style={{ fontSize: "0.95rem", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: "var(--amber-vivid)" }}>
                    {lab.champion.team.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-400)", marginLeft: "auto" }}>
                    {toPercent(lab.champion.prob)}
                  </span>
                </div>
                {/* Mini prob bar */}
                <div style={{ height: "2px", background: "var(--border-subtle)", marginTop: "0.5rem" }}>
                  <div style={{ height: "100%", width: `${Math.round(lab.champion.prob * 100)}%`, background: "var(--amber-vivid)" }} />
                </div>
              </div>

              {/* Finalist */}
              <div style={{ padding: "0.85rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-400)" }}>Finalist</span>
                  {locked && finalistMatch !== null && <HitBadge hit={finalistMatch} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {lab.finalist.team.flagCode && (
                    <img src={`https://flagcdn.com/w40/${lab.finalist.team.flagCode}.png`} alt="" width={22} height={15} style={{ objectFit: "cover" }} />
                  )}
                  <span style={{ fontSize: "0.95rem", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: "var(--cyan-vivid)" }}>
                    {lab.finalist.team.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-400)", marginLeft: "auto" }}>
                    {toPercent(lab.finalist.prob)}
                  </span>
                </div>
                <div style={{ height: "2px", background: "var(--border-subtle)", marginTop: "0.5rem" }}>
                  <div style={{ height: "100%", width: `${Math.round(lab.finalist.prob * 100)}%`, background: "var(--cyan-vivid)" }} />
                </div>
              </div>

              {/* Golden Boot */}
              {lab.topScorer && (
                <div style={{ padding: "0.85rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-400)", display: "block", marginBottom: "0.4rem" }}>
                    Golden Boot Favorite
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: "var(--text-100)" }}>
                      {lab.topScorer.player.name}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-400)", marginLeft: "auto" }}>
                      {toPercent(lab.topScorer.prob)}
                    </span>
                  </div>
                  <div style={{ height: "2px", background: "var(--border-subtle)", marginTop: "0.5rem" }}>
                    <div style={{ height: "100%", width: `${Math.round(lab.topScorer.prob * 100)}%`, background: "var(--green-vivid)" }} />
                  </div>
                </div>
              )}

              {/* Top Assist */}
              {lab.topAssist && (
                <div style={{ padding: "0.85rem 0" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-400)", display: "block", marginBottom: "0.4rem" }}>
                    Top Assists Favorite
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: "var(--text-100)" }}>
                      {lab.topAssist.player.name}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-400)", marginLeft: "auto" }}>
                      {toPercent(lab.topAssist.prob)}
                    </span>
                  </div>
                  <div style={{ height: "2px", background: "var(--border-subtle)", marginTop: "0.5rem" }}>
                    <div style={{ height: "100%", width: `${Math.round(lab.topAssist.prob * 100)}%`, background: "var(--green-vivid)" }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Accuracy summary (post-lock) */}
          {locked && (
            <div style={{ border: "1px solid rgba(163,230,53,0.3)", background: "rgba(0,212,255,0.04)", padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                <div style={{ width: "3px", height: "1rem", background: "var(--cyan-vivid)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.65rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-100)" }}>
                  Alignment With The Lab
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-400)", lineHeight: 1.6 }}>
                Your picks are locked. Come back after each match to see
                how your predictions compared to the AI. Results update live.
              </p>
              <p style={{ margin: "0.6rem 0 0", fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "var(--text-500)", textTransform: "uppercase" }}>
                Tournament begins Jun 11, 2026
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
