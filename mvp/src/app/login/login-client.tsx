"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, signIn } from "@/lib/store";

export function LoginClient() {
  const router = useRouter();
  const [name,    setName]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Already logged in → redirect to predict
  useEffect(() => {
    if (getAuthUser()) router.replace("/predict");
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Enter a display name to continue."); return; }
    if (trimmed.length < 2) { setError("Name must be at least 2 characters."); return; }
    if (trimmed.length > 32) { setError("Name must be 32 characters or less."); return; }
    setError("");
    setLoading(true);
    signIn(trimmed);
    router.push("/predict");
  };

  return (
    <div style={{
      minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Icon */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            padding: "0.3rem 0.75rem",
            background: "var(--cyan-soft)",
            border: "1px solid rgba(0,212,255,0.25)",
          }}>
            <div className="live-dot" />
            <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cyan-vivid)" }}>
              World Cup 2026 · Prediction Challenge
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-display" style={{ margin: "0 0 0.5rem" }}>
          Join{" "}
          <span style={{ color: "var(--cyan-vivid)" }}>The Lab</span>
        </h1>
        <p style={{ margin: "0 0 2.5rem", fontSize: "0.88rem", color: "var(--text-400)", lineHeight: 1.6 }}>
          Pick a display name to lock in your predictions before the tournament starts.
          No password required — just a name.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label style={{
              display: "block", marginBottom: "0.4rem",
              fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "var(--text-400)",
            }}>
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. TacticMaster99"
              autoFocus
              maxLength={32}
              style={{
                width: "100%", padding: "0.75rem 1rem",
                background: "var(--surface-2)",
                border: `1px solid ${error ? "var(--rose-vivid)" : "var(--border-default)"}`,
                color: "var(--text-100)", fontSize: "1rem", fontWeight: 700,
                outline: "none", fontFamily: "var(--font-sans)",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--cyan-vivid)"; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = error ? "var(--rose-vivid)" : "var(--border-default)"; }}
            />
            {error && (
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.7rem", color: "var(--rose-vivid)", fontFamily: "var(--font-mono)" }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{
              padding: "0.85rem 2rem",
              background: name.trim() && !loading ? "var(--cyan-vivid)" : "var(--surface-3)",
              border: `1px solid ${name.trim() && !loading ? "var(--cyan-vivid)" : "var(--border-default)"}`,
              color: name.trim() && !loading ? "var(--surface-0)" : "var(--text-500)",
              fontSize: "0.82rem", fontWeight: 900, fontStyle: "italic",
              letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: name.trim() && !loading ? "pointer" : "not-allowed",
              transform: "skewX(-8deg)",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ transform: "skewX(8deg)", display: "inline-block" }}>
              {loading ? "Entering…" : "Start Predicting →"}
            </span>
          </button>
        </form>

        {/* Fine print */}
        <p style={{ marginTop: "1.5rem", fontSize: "0.65rem", color: "var(--text-500)", lineHeight: 1.7 }}>
          Your picks are stored locally in your browser. No account or email needed.
          If you clear your browser data your picks will be lost — note your display name
          to restore access on another device in future updates.
        </p>

      </div>
    </div>
  );
}
