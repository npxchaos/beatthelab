"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthUser, getLeaderboard, getUserPicks } from "@/lib/store";

type State =
  | { phase: "loading" }
  | { phase: "anonymous" }
  | { phase: "named"; name: string; hasLocked: false }
  | { phase: "locked"; name: string; rank: number; total: number };

export function HomeCompetition() {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    const user = getAuthUser();
    if (!user) { setState({ phase: "anonymous" }); return; }
    const picks = getUserPicks(user.id);
    if (!picks) { setState({ phase: "named", name: user.displayName, hasLocked: false }); return; }
    const board = getLeaderboard();
    const rank  = board.findIndex((e) => e.userId === user.id) + 1;
    setState({ phase: "locked", name: user.displayName, rank: rank > 0 ? rank : board.length, total: board.length });
  }, []);

  if (state.phase === "loading") return null;

  // ── Anonymous ──────────────────────────────────────────────────────────────
  if (state.phase === "anonymous") return (
    <div style={{
      border: "1px solid var(--border-accent)", background: "var(--cyan-soft)",
      padding: "1.25rem 1.5rem",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "1rem", flexWrap: "wrap",
    }}>
      <div>
        <p style={{ margin: "0 0 0.2rem", fontSize: "0.88rem", fontWeight: 800, color: "var(--text-100)" }}>
          Can you beat the AI?
        </p>
        <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-400)", lineHeight: 1.5 }}>
          Pick your World Cup predictions and compete against Wand&apos;s 6-agent forecast engine.
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <Link href="/predict" style={{
          display: "inline-block", padding: "0.55rem 1.25rem",
          background: "var(--cyan-vivid)", color: "var(--surface-0)",
          fontSize: "0.75rem", fontWeight: 900, fontStyle: "italic",
          letterSpacing: "0.08em", textTransform: "uppercase",
          textDecoration: "none", transform: "skewX(-8deg)",
        }}>
          <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>Enter Picks →</span>
        </Link>
        <Link href="/leaderboard" style={{
          display: "inline-block", padding: "0.55rem 1.1rem",
          border: "1px solid var(--border-default)", color: "var(--text-300)",
          fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", textDecoration: "none",
        }}>
          Leaderboard
        </Link>
      </div>
    </div>
  );

  // ── Named but no picks ─────────────────────────────────────────────────────
  if (state.phase === "named") return (
    <div style={{
      border: "1px solid var(--border-default)", background: "var(--surface-1)",
      padding: "1.1rem 1.5rem",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "1rem", flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          width: "32px", height: "32px", background: "var(--surface-3)",
          border: "1px solid var(--border-default)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.75rem", fontWeight: 900, color: "var(--text-300)",
          flexShrink: 0,
        }}>
          {state.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-200)" }}>
            Hey, <span style={{ color: "var(--text-100)" }}>{state.name}</span>
          </p>
          <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--amber-vivid)" }}>
            You haven&apos;t locked your picks yet — tournament starts June 11.
          </p>
        </div>
      </div>
      <Link href="/predict" style={{
        display: "inline-block", padding: "0.5rem 1.25rem",
        background: "var(--cyan-vivid)", color: "var(--surface-0)",
        fontSize: "0.75rem", fontWeight: 900, fontStyle: "italic",
        letterSpacing: "0.08em", textTransform: "uppercase",
        textDecoration: "none", transform: "skewX(-8deg)", flexShrink: 0,
      }}>
        <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>Lock Picks →</span>
      </Link>
    </div>
  );

  // ── Locked ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      border: "1px solid rgba(0,224,150,0.3)", background: "rgba(0,224,150,0.04)",
      padding: "1.1rem 1.5rem",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "1rem", flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          width: "32px", height: "32px", background: "var(--cyan-vivid)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.75rem", fontWeight: 900, color: "var(--surface-0)",
          flexShrink: 0,
        }}>
          {state.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-100)" }}>
            {state.name} · <span style={{ color: "var(--green-vivid)" }}>Picks locked ✓</span>
          </p>
          <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-400)" }}>
            Current rank <strong style={{ color: "var(--cyan-vivid)" }}>#{state.rank}</strong> of {state.total} participants
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <Link href="/leaderboard" style={{
          display: "inline-block", padding: "0.5rem 1.1rem",
          background: "var(--cyan-vivid)", color: "var(--surface-0)",
          fontSize: "0.72rem", fontWeight: 900, fontStyle: "italic",
          letterSpacing: "0.08em", textTransform: "uppercase",
          textDecoration: "none", transform: "skewX(-8deg)",
        }}>
          <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>Leaderboard →</span>
        </Link>
        <Link href="/agent-feed" style={{
          display: "inline-block", padding: "0.5rem 1rem",
          border: "1px solid var(--border-default)", color: "var(--text-300)",
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", textDecoration: "none",
        }}>
          You vs Lab
        </Link>
      </div>
    </div>
  );
}
