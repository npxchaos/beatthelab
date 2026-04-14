"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",           label: "Outlook" },
  { href: "/teams",      label: "Teams" },
  { href: "/players",    label: "Players" },
  { href: "/predict",    label: "Beat The Lab" },
  { href: "/scenario",   label: "Scenarios" },
  { href: "/agent-feed", label: "Agent Feed" },
];

export const Navigation = () => {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "#000",
        borderBottom: "1px solid #18181b",
      }}
    >
      <div
        style={{
          margin: "0 auto",
          maxWidth: "80rem",
          padding: "0 1.5rem",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.7rem", textDecoration: "none" }}>
          {/* Skewed lime mark */}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "30px",
              height: "30px",
              background: "#a3e635",
              transform: "skewX(-10deg)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                transform: "skewX(10deg)",
                fontSize: "0.72rem",
                fontWeight: 900,
                fontStyle: "italic",
                color: "#000",
                fontFamily: "var(--font-sans)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              WX
            </span>
          </span>
          {/* Wordmark */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0px", lineHeight: 1 }}>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 900,
                fontStyle: "italic",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#a3e635",
              }}
            >
              Prediction Lab
            </span>
            <span
              style={{
                fontSize: "0.58rem",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#52525b",
              }}
            >
              World Cup 2026
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0" }}>
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
                    padding: "0.3rem 0.9rem",
                    background: active ? "#a3e635" : "transparent",
                    border: `1px solid ${active ? "#a3e635" : "rgba(163,230,53,0.35)"}`,
                    color: active ? "#000" : "#a3e635",
                    fontSize: "0.7rem",
                    fontWeight: 900,
                    fontStyle: "italic",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    transform: "skewX(-8deg)",
                    marginLeft: "0.75rem",
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
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.72rem",
                  fontWeight: active ? 700 : 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: active ? "#a3e635" : "#71717a",
                  textDecoration: "none",
                  transition: "color 0.12s ease",
                  borderBottom: active ? "2px solid #a3e635" : "2px solid transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
