"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getLeaderboard, getAuthUser, type LeaderboardEntry } from "@/lib/store";

// ─── Medal colors ──────────────────────────────────────────────────────────────

const RANK_ACCENT: Record<number, string> = {
  1: "var(--amber-vivid)",
  2: "var(--text-300)",
  3: "#cd7f32",
};

// ─── Row ──────────────────────────────────────────────────────────────────────

function Row({
  entry,
  rank,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}) {
  const accent = RANK_ACCENT[rank] ?? "var(--text-500)";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr 80px 80px",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.65rem 1rem",
        background: isCurrentUser ? "rgba(0,212,255,0.06)" : "transparent",
        borderBottom: "1px solid var(--border-subtle)",
        borderLeft: isCurrentUser ? "2px solid var(--cyan-vivid)" : "2px solid transparent",
        transition: "background 0.1s ease",
      }}
    >
      {/* Rank */}
      <span style={{
        fontSize: rank <= 3 ? "0.88rem" : "0.72rem",
        fontWeight: 900, fontStyle: "italic",
        color: accent,
        textAlign: "center",
      }}>
        {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
      </span>

      {/* Name */}
      <div style={{ minWidth: 0 }}>
        <span style={{
          fontSize: "0.88rem", fontWeight: isCurrentUser ? 800 : 600,
          color: isCurrentUser ? "var(--cyan-vivid)" : "var(--text-200)",
          display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {entry.displayName}
          {isCurrentUser && (
            <span style={{ marginLeft: "0.5rem", fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cyan-vivid)", opacity: 0.75 }}>
              you
            </span>
          )}
        </span>
        {entry.isBot && (
          <span style={{ fontSize: "0.58rem", color: "var(--text-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            AI Opponent
          </span>
        )}
      </div>

      {/* Points */}
      <span style={{
        fontSize: "0.95rem", fontWeight: 900, fontStyle: "italic",
        color: entry.points > 0 ? "var(--text-100)" : "var(--text-500)",
        textAlign: "right",
        fontFamily: "var(--font-mono)",
      }}>
        {entry.points > 0 ? entry.points : "—"}
      </span>

      {/* Picks badge */}
      <div style={{ textAlign: "right" }}>
        {entry.picks ? (
          <span style={{
            display: "inline-block", padding: "0.15rem 0.4rem",
            fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
            background: "var(--cyan-soft)", border: "1px solid rgba(0,212,255,0.2)",
            color: "var(--cyan-vivid)",
          }}>
            Locked
          </span>
        ) : (
          <span style={{ fontSize: "0.62rem", color: "var(--text-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            No picks
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function LeaderboardClient() {
  const [board,       setBoard]       = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    setBoard(getLeaderboard());
    setCurrentUser(getAuthUser()?.id ?? null);
  }, []);

  const userRank = board.findIndex((e) => e.userId === currentUser) + 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem", paddingBottom: "5rem" }}>

      {/* Hero */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <div className="live-dot" />
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-400)" }}>
            World Cup 2026 · Prediction Challenge
          </span>
        </div>
        <h1 className="text-display" style={{ margin: "0 0 0.5rem" }}>
          Leader<span style={{ color: "var(--amber-vivid)" }}>board</span>
        </h1>
        <p style={{ margin: 0, maxWidth: "540px", fontSize: "0.88rem", color: "var(--text-400)", lineHeight: 1.65 }}>
          Rankings update as the tournament progresses. Scores are awarded for correct group positions,
          champion picks, and individual award calls.
        </p>
      </div>

      {/* CTA if not logged in */}
      {!currentUser && (
        <div style={{
          border: "1px solid var(--border-accent)", background: "var(--surface-1)",
          padding: "1.25rem 1.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
        }}>
          <div>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-200)" }}>
              You haven&apos;t joined yet.
            </p>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-500)" }}>
              Pick a display name and lock in your predictions before June 11.
            </p>
          </div>
          <Link
            href="/login"
            style={{
              display: "inline-block", padding: "0.6rem 1.5rem",
              background: "var(--cyan-vivid)", color: "var(--surface-0)",
              fontSize: "0.78rem", fontWeight: 900, fontStyle: "italic",
              letterSpacing: "0.1em", textTransform: "uppercase",
              textDecoration: "none", transform: "skewX(-8deg)", flexShrink: 0,
            }}
          >
            <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>Join The Lab →</span>
          </Link>
        </div>
      )}

      {/* User position callout */}
      {currentUser && userRank > 0 && (
        <div style={{
          border: "1px solid rgba(0,212,255,0.3)", background: "var(--cyan-soft)",
          padding: "0.85rem 1.25rem",
          display: "flex", alignItems: "center", gap: "1rem",
        }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-400)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Your rank</span>
          <span style={{ fontSize: "1.4rem", fontWeight: 900, fontStyle: "italic", color: "var(--cyan-vivid)" }}>#{userRank}</span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-400)" }}>of {board.length} participants</span>
          {!board.find((e) => e.userId === currentUser)?.picks && (
            <Link
              href="/predict"
              style={{
                marginLeft: "auto", display: "inline-block", padding: "0.4rem 1rem",
                background: "transparent", border: "1px solid var(--cyan-vivid)",
                color: "var(--cyan-vivid)", fontSize: "0.72rem", fontWeight: 800,
                fontStyle: "italic", letterSpacing: "0.08em", textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Lock picks →
            </Link>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-1)" }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "40px 1fr 80px 80px",
          gap: "0.5rem", padding: "0.5rem 1rem",
          borderBottom: "1px solid var(--border-default)",
          background: "var(--surface-2)",
        }}>
          {["#", "Player", "Pts", "Status"].map((h, i) => (
            <span key={h} style={{
              fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--text-500)",
              textAlign: i >= 2 ? "right" : "left",
            }}>
              {h}
            </span>
          ))}
        </div>

        {board.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-500)", fontSize: "0.82rem" }}>
            No participants yet.
          </div>
        ) : (
          board.map((entry, i) => (
            <Row
              key={entry.userId}
              entry={entry}
              rank={i + 1}
              isCurrentUser={entry.userId === currentUser}
            />
          ))
        )}
      </div>

      {/* Scoring guide */}
      <div style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-1)", overflow: "hidden" }}>
        <div style={{ padding: "0.6rem 1rem", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-2)" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 800, fontStyle: "italic", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-400)" }}>
            Scoring Guide
          </span>
        </div>
        <div style={{ padding: "1rem", display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {[
            { label: "Both group qualifiers",     pts: "3 pts" },
            { label: "Bonus: correct order",       pts: "+1 pt" },
            { label: "1 of 2 qualifiers",          pts: "1 pt" },
            { label: "Champion",                   pts: "20 pts" },
            { label: "Finalist / Runner-Up",       pts: "10 pts" },
            { label: "Golden Boot (player)",       pts: "10 pts" },
            { label: "Bonus: exact goal count",    pts: "+5 pts" },
            { label: "Assist King (player)",       pts: "10 pts" },
            { label: "Bonus: exact assist count",  pts: "+5 pts" },
            { label: "Golden Ball",                pts: "15 pts" },
          ].map(({ label, pts }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-400)" }}>{label}</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, fontStyle: "italic", color: "var(--cyan-vivid)", whiteSpace: "nowrap", fontFamily: "var(--font-mono)" }}>{pts}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
