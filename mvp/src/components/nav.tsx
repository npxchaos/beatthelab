"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthUser, getUserPicks } from "@/lib/store";

const NAV_ITEMS = [
  { href: "/",            label: "Home" },
  { href: "/teams",       label: "Teams" },
  { href: "/players",     label: "Players" },
  { href: "/predict",     label: "Beat The Lab" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/agent-feed",  label: "Agent Feed" },
];

type AuthState = { name: string; hasLocked: boolean } | null;

export const Navigation = () => {
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthState>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (!user) return;
    const picks = getUserPicks(user.id);
    setAuth({ name: user.displayName, hasLocked: !!picks });
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "var(--surface-0)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          margin: "0 auto",
          maxWidth: "80rem",
          padding: "0 1.5rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.7rem", textDecoration: "none" }}>
          {/* Skewed cyan mark */}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "30px",
              height: "30px",
              background: "var(--cyan-vivid)",
              transform: "skewX(-10deg)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                transform: "skewX(10deg)",
                fontSize: "0.85rem",
                fontWeight: 900,
                fontStyle: "italic",
                color: "var(--surface-0)",
                fontFamily: "var(--font-sans)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              WX
            </span>
          </span>
          {/* Wordmark */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", lineHeight: 1 }}>
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 900,
                fontStyle: "italic",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--cyan-vivid)",
              }}
            >
              Prediction Lab
            </span>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-400)",
              }}
            >
              World Cup 2026
            </span>
          </div>
        </Link>

        {/* Nav links + auth pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const isBeatTheLab = item.href === "/predict";

            if (isBeatTheLab) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.45rem 1.1rem",
                    background: active ? "var(--cyan-vivid)" : "transparent",
                    border: `1px solid ${active ? "var(--cyan-vivid)" : "var(--cyan-soft)"}`,
                    color: active ? "var(--surface-0)" : "var(--cyan-vivid)",
                    fontSize: "0.78rem",
                    fontWeight: 900,
                    fontStyle: "italic",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    transform: "skewX(-8deg)",
                    marginLeft: "1rem",
                    transition: "all 0.12s ease",
                  }}
                >
                  <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "0.6rem 0.9rem",
                  fontSize: "0.82rem",
                  fontWeight: active ? 700 : 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: active ? "var(--cyan-vivid)" : "var(--text-300)",
                  textDecoration: "none",
                  transition: "color 0.12s ease",
                  borderBottom: active ? "2px solid var(--cyan-vivid)" : "2px solid transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth pill */}
        {auth ? (
          <Link
            href="/leaderboard"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.45rem",
              padding: "0.3rem 0.65rem",
              border: auth.hasLocked ? "1px solid rgba(0,212,255,0.35)" : "1px solid var(--border-default)",
              background: auth.hasLocked ? "var(--cyan-soft)" : "transparent",
              textDecoration: "none",
              transition: "all 0.12s ease",
              marginLeft: "0.5rem",
              flexShrink: 0,
            }}
          >
            <span style={{
              width: "20px", height: "20px",
              background: "var(--cyan-vivid)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.6rem", fontWeight: 900, color: "var(--surface-0)",
              flexShrink: 0, textTransform: "uppercase",
            }}>
              {auth.name.slice(0, 1).toUpperCase()}
            </span>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: auth.hasLocked ? "var(--cyan-vivid)" : "var(--text-300)", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {auth.name}
            </span>
            {auth.hasLocked && (
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green-vivid)", boxShadow: "0 0 5px var(--green-vivid)", flexShrink: 0 }} />
            )}
          </Link>
        ) : (
          <Link
            href="/login"
            style={{
              display: "inline-flex", alignItems: "center",
              padding: "0.3rem 0.75rem",
              border: "1px solid var(--border-default)",
              color: "var(--text-400)",
              fontSize: "0.72rem", fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase",
              textDecoration: "none", marginLeft: "0.5rem",
              transition: "all 0.12s ease",
              flexShrink: 0,
            }}
          >
            Join
          </Link>
        )}
        </div>
      </div>
    </header>
  );
};
