"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthUser, getLeaderboard, getUserPicks, type LeaderboardEntry, type UserPicks } from "@/lib/store";
import type { Team, Player } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type LabPicks = {
  champion:   { id: string; name: string; flagCode?: string; prob: number };
  finalist:   { id: string; name: string; flagCode?: string; prob: number };
  topScorer:  { id: string; name: string; teamName: string; prob: number } | null;
  topAssist:  { id: string; name: string; teamName: string; prob: number } | null;
  goldenBall: { id: string; name: string; teamName: string } | null;
};

// ─── You vs Lab ───────────────────────────────────────────────────────────────

function VsRow({
  label,
  yours,
  lab,
  match,
  flagCode,
}: {
  label:    string;
  yours:    string;
  lab:      string;
  match:    boolean;
  flagCode?: string;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.65rem 0",
      borderBottom: "1px solid var(--border-subtle)",
    }}>
      {/* Yours */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        {flagCode && (
          <img src={`https://flagcdn.com/w40/${flagCode}.png`} alt="" width={16} height={11} style={{ objectFit: "cover", flexShrink: 0 }} />
        )}
        <span style={{
          fontSize: "0.82rem", fontWeight: 700,
          color: match ? "var(--green-vivid)" : "var(--text-200)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {yours}
        </span>
      </div>

      {/* Label + result */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
        <span style={{ fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-500)" }}>
          {label}
        </span>
        <span style={{ fontSize: "0.6rem", fontWeight: 800 }}>
          {match ? (
            <span style={{ color: "var(--green-vivid)" }}>✓ Match</span>
          ) : (
            <span style={{ color: "var(--rose-vivid)" }}>✗ Diff</span>
          )}
        </span>
      </div>

      {/* Lab */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "flex-end" }}>
        <span style={{
          fontSize: "0.82rem", fontWeight: 700,
          color: "var(--cyan-vivid)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          textAlign: "right",
        }}>
          {lab}
        </span>
        <span style={{
          display: "inline-flex", alignItems: "center",
          padding: "0.1rem 0.35rem",
          fontSize: "0.52rem", fontWeight: 800, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--cyan-vivid)",
          background: "var(--cyan-soft)", border: "1px solid rgba(0,212,255,0.2)",
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          AI
        </span>
      </div>
    </div>
  );
}

function YouVsLab({
  lab,
  teamsById,
  playersById,
}: {
  lab:        LabPicks;
  teamsById:  Map<string, Team>;
  playersById: Map<string, Player>;
}) {
  const [picks, setPicks]   = useState<UserPicks | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const user = getAuthUser();
    if (user) setPicks(getUserPicks(user.id));
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!picks) {
    return (
      <div style={{
        border: "1px solid var(--border-subtle)", background: "var(--surface-1)",
        padding: "1.5rem", textAlign: "center",
      }}>
        <p style={{ margin: "0 0 0.35rem", fontSize: "0.88rem", fontWeight: 700, color: "var(--text-200)" }}>
          No predictions locked yet
        </p>
        <p style={{ margin: "0 0 1rem", fontSize: "0.72rem", color: "var(--text-500)" }}>
          Lock in your picks to see how you stack up against the Wand workforce.
        </p>
        <Link
          href="/predict"
          style={{
            display: "inline-block", padding: "0.55rem 1.4rem",
            background: "var(--cyan-vivid)", color: "var(--surface-0)",
            fontSize: "0.78rem", fontWeight: 900, fontStyle: "italic",
            letterSpacing: "0.08em", textTransform: "uppercase",
            textDecoration: "none", transform: "skewX(-8deg)",
          }}
        >
          <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>Make Predictions →</span>
        </Link>
      </div>
    );
  }

  const champTeam = teamsById.get(picks.championId);
  const finalistTeam = teamsById.get(picks.finalistId);
  const scorerPlayer = playersById.get(picks.topScorerId);
  const assistPlayer = playersById.get(picks.topAssistId);
  const ballPlayer   = playersById.get(picks.goldenBallId);

  const rows = [
    {
      label:    "Champion",
      yours:    champTeam?.name ?? picks.championId,
      lab:      lab.champion.name,
      match:    picks.championId === lab.champion.id,
      flagCode: champTeam?.flagCode,
    },
    {
      label:    "Finalist",
      yours:    finalistTeam?.name ?? picks.finalistId,
      lab:      lab.finalist.name,
      match:    picks.finalistId === lab.finalist.id,
      flagCode: finalistTeam?.flagCode,
    },
    {
      label:    "Golden Boot",
      yours:    scorerPlayer?.name ?? "—",
      lab:      lab.topScorer?.name ?? "—",
      match:    lab.topScorer ? picks.topScorerId === lab.topScorer.id : false,
    },
    {
      label:    "Assist King",
      yours:    assistPlayer?.name ?? "—",
      lab:      lab.topAssist?.name ?? "—",
      match:    lab.topAssist ? picks.topAssistId === lab.topAssist.id : false,
    },
    {
      label:    "Golden Ball",
      yours:    ballPlayer?.name ?? "—",
      lab:      lab.goldenBall?.name ?? "—",
      match:    lab.goldenBall ? picks.goldenBallId === lab.goldenBall.id : false,
    },
  ];

  const matchCount = rows.filter((r) => r.match).length;

  return (
    <div style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-1)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "0.65rem 1rem",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--surface-2)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-300)" }}>
            You
          </span>
          <span style={{ fontSize: "0.58rem", color: "var(--text-500)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>vs</span>
          <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cyan-vivid)" }}>
            Wand Lab
          </span>
        </div>
        <span style={{
          fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
          color: matchCount >= 3 ? "var(--green-vivid)" : matchCount >= 1 ? "var(--amber-vivid)" : "var(--text-500)",
        }}>
          {matchCount} / {rows.length} aligned
        </span>
      </div>

      <div style={{ padding: "0 1rem" }}>
        {rows.map((row) => (
          <VsRow key={row.label} {...row} />
        ))}
      </div>

      <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-2)" }}>
        <p style={{ margin: 0, fontSize: "0.62rem", color: "var(--text-500)", lineHeight: 1.6 }}>
          Picks locked · Scoring activates June 11, 2026 when the tournament starts.
        </p>
      </div>
    </div>
  );
}

// ─── Leaderboard preview ──────────────────────────────────────────────────────

function LeaderboardPreview() {
  const [board,       setBoard]       = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loaded,      setLoaded]      = useState(false);

  useEffect(() => {
    setBoard(getLeaderboard().slice(0, 5));
    setCurrentUser(getAuthUser()?.id ?? null);
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  const userRank = getLeaderboard().findIndex((e) => e.userId === currentUser) + 1;

  return (
    <div style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-1)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "0.65rem 1rem",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--surface-2)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber-vivid)" }}>
          Leaderboard
        </span>
        <Link
          href="/leaderboard"
          style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--cyan-vivid)", textDecoration: "none", letterSpacing: "0.06em" }}
        >
          View all →
        </Link>
      </div>

      {/* Rows */}
      {board.map((entry, i) => {
        const isMe = entry.userId === currentUser;
        return (
          <div
            key={entry.userId}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.55rem 1rem",
              borderBottom: i < board.length - 1 ? "1px solid var(--border-subtle)" : "none",
              background: isMe ? "rgba(0,212,255,0.05)" : "transparent",
              borderLeft: isMe ? "2px solid var(--cyan-vivid)" : "2px solid transparent",
            }}
          >
            <span style={{ width: "20px", textAlign: "center", fontSize: i < 3 ? "0.9rem" : "0.7rem", fontWeight: 900, flexShrink: 0, color: ["var(--amber-vivid)", "var(--text-300)", "#cd7f32"][i] ?? "var(--text-500)" }}>
              {i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}
            </span>
            <span style={{ flex: 1, fontSize: "0.82rem", fontWeight: isMe ? 700 : 500, color: isMe ? "var(--cyan-vivid)" : "var(--text-200)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {entry.displayName}
              {entry.isBot && <span style={{ marginLeft: "0.4rem", fontSize: "0.55rem", color: "var(--text-500)", textTransform: "uppercase", letterSpacing: "0.06em" }}>AI</span>}
            </span>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, fontStyle: "italic", color: entry.points > 0 ? "var(--text-100)" : "var(--text-500)", fontFamily: "var(--font-mono)" }}>
              {entry.points > 0 ? entry.points : "—"}
            </span>
          </div>
        );
      })}

      {/* Footer */}
      <div style={{ padding: "0.65rem 1rem", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {currentUser && userRank > 0 ? (
          <span style={{ fontSize: "0.62rem", color: "var(--text-400)" }}>
            Your rank: <strong style={{ color: "var(--cyan-vivid)" }}>#{userRank}</strong>
          </span>
        ) : (
          <span style={{ fontSize: "0.62rem", color: "var(--text-500)" }}>Not on the board yet</span>
        )}
        {!currentUser && (
          <Link
            href="/login"
            style={{
              fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
              color: "var(--cyan-vivid)", textDecoration: "none",
            }}
          >
            Join →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Exported island ──────────────────────────────────────────────────────────

export function CompetitionIsland({
  lab,
  teams,
  players,
}: {
  lab:     LabPicks;
  teams:   Team[];
  players: Player[];
}) {
  const teamsById   = new Map(teams.map((t) => [t.id, t]));
  const playersById = new Map(players.map((p) => [p.id, p]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <YouVsLab lab={lab} teamsById={teamsById} playersById={playersById} />
      <LeaderboardPreview />
    </div>
  );
}
