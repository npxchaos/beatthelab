import Link from "next/link";

export const Footer = () => (
  <footer
    style={{
      borderTop: "1px solid var(--border-subtle)",
      marginTop: "5rem",
      padding: "2.5rem 1.5rem",
      background: "var(--surface-0)",
    }}
  >
    <div
      style={{
        margin: "0 auto",
        maxWidth: "80rem",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "2.5rem",
      }}
    >
      {/* Brand block */}
      <div style={{ maxWidth: "320px" }}>
        {/* Logo mark row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.2rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              background: "var(--cyan-vivid)",
              transform: "skewX(-10deg)",
              flexShrink: 0,
            }}
          >
            <span style={{ transform: "skewX(10deg)", fontSize: "0.8rem", fontWeight: 900, fontStyle: "italic", color: "var(--surface-0)" }}>
              WX
            </span>
          </span>
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
        </div>

        <p style={{ fontSize: "0.82rem", color: "var(--text-400)", lineHeight: 1.7, margin: "0 0 0.8rem" }}>
          Independent football intelligence platform. Not affiliated with FIFA
          or any national federation. All forecasts are algorithmic models for
          informational purposes only.
        </p>
        <p style={{ fontSize: "0.78rem", color: "var(--text-500)", margin: 0 }}>
          Data:{" "}
          <a href="https://www.football-data.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--cyan-vivid)", textDecoration: "none" }}>
            football-data.org
          </a>
          {" "}· Powered by Wand AI
        </p>
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: "4.5rem" }}>
        <div>
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-200)",
              marginBottom: "1.2rem",
              fontStyle: "italic",
            }}
          >
            Product
          </p>
          {[
            { label: "Outlook",       href: "/" },
            { label: "Teams",         href: "/teams" },
            { label: "Players",       href: "/players" },
            { label: "Beat The Lab",  href: "/predict" },
            { label: "Scenarios",     href: "/scenario" },
            { label: "Agent Feed",    href: "/agent-feed" },
          ].map(({ label, href }) => (
            <p key={label} style={{ margin: "0 0 0.65rem" }}>
              <Link href={href} style={{ fontSize: "0.82rem", color: "var(--text-400)", textDecoration: "none" }}>
                {label}
              </Link>
            </p>
          ))}
        </div>

        <div>
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-200)",
              marginBottom: "1.2rem",
              fontStyle: "italic",
            }}
          >
            Coming Soon
          </p>
          {["Copa América 2027", "UEFA Euro 2028", "Club World Cup", "More Tournaments"].map((label) => (
            <p key={label} style={{ margin: "0 0 0.65rem", fontSize: "0.82rem", color: "var(--text-500)" }}>
              {label}
            </p>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div
      style={{
        margin: "3rem auto 0",
        maxWidth: "80rem",
        borderTop: "1px solid var(--border-subtle)",
        paddingTop: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <span style={{ fontSize: "0.75rem", color: "var(--text-500)", fontStyle: "italic" }}>
        © 2026 Global Football Prediction Lab. Built with Wand.
      </span>
      <span style={{ fontSize: "0.72rem", color: "var(--text-500)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Independent · Unaffiliated · Algorithmic
      </span>
    </div>
  </footer>
);
