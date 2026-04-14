import Link from "next/link";

export const Footer = () => (
  <footer
    style={{
      borderTop: "1px solid #18181b",
      marginTop: "5rem",
      padding: "2.5rem 1.5rem",
      background: "#000",
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "26px",
              height: "26px",
              background: "#a3e635",
              transform: "skewX(-10deg)",
              flexShrink: 0,
            }}
          >
            <span style={{ transform: "skewX(10deg)", fontSize: "0.65rem", fontWeight: 900, fontStyle: "italic", color: "#000" }}>
              WX
            </span>
          </span>
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
        </div>

        <p style={{ fontSize: "0.75rem", color: "var(--text-400)", lineHeight: 1.7, margin: "0 0 0.6rem" }}>
          Independent football intelligence platform. Not affiliated with FIFA
          or any national federation. All forecasts are algorithmic models for
          informational purposes only.
        </p>
        <p style={{ fontSize: "0.7rem", color: "var(--text-500)", margin: 0 }}>
          Data:{" "}
          <a href="https://www.football-data.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--lime-vivid)" }}>
            football-data.org
          </a>
          {" "}· Powered by Wand AI
        </p>
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: "3.5rem" }}>
        <div>
          <p
            style={{
              fontSize: "0.62rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-100)",
              marginBottom: "0.9rem",
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
            <p key={label} style={{ margin: "0 0 0.45rem" }}>
              <Link href={href} style={{ fontSize: "0.78rem", color: "var(--text-400)", textDecoration: "none" }}>
                {label}
              </Link>
            </p>
          ))}
        </div>

        <div>
          <p
            style={{
              fontSize: "0.62rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-100)",
              marginBottom: "0.9rem",
              fontStyle: "italic",
            }}
          >
            Coming Soon
          </p>
          {["Copa América 2027", "UEFA Euro 2028", "Club World Cup", "More Tournaments"].map((label) => (
            <p key={label} style={{ margin: "0 0 0.45rem", fontSize: "0.78rem", color: "var(--text-500)" }}>
              {label}
            </p>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div
      style={{
        margin: "2rem auto 0",
        maxWidth: "80rem",
        borderTop: "1px solid #18181b",
        paddingTop: "1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
      <span style={{ fontSize: "0.68rem", color: "var(--text-500)", fontStyle: "italic" }}>
        © 2026 Global Football Prediction Lab. Built with Wand.
      </span>
      <span style={{ fontSize: "0.68rem", color: "var(--text-500)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Independent · Unaffiliated · Algorithmic
      </span>
    </div>
  </footer>
);
