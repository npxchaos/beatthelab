"use client";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SelectOption = {
  value:     string;
  label:     string;
  sublabel?: string;
  flagCode?: string;
  photoUrl?: string;
};

// ─── Flag image ───────────────────────────────────────────────────────────────

const Flag = ({ code, size = 20 }: { code: string; size?: number }) => (
  <img
    src={`https://flagcdn.com/w40/${code}.png`}
    alt=""
    width={size}
    height={Math.round(size * 0.67)}
    style={{ objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)" }}
  />
);

// ─── Player avatar ────────────────────────────────────────────────────────────

const PlayerAvatar = ({
  photoUrl,
  flagCode,
  name,
}: {
  photoUrl?: string;
  flagCode?: string;
  name: string;
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {/* Main photo */}
      <div style={{
        width: "32px", height: "32px",
        background: "var(--surface-3)",
        border: "1px solid var(--border-subtle)",
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {photoUrl && !imgFailed ? (
          <img
            src={photoUrl}
            alt={name}
            width={32}
            height={32}
            onError={() => setImgFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <circle cx="12" cy="8" r="4" fill="#3f3f46" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#3f3f46" />
          </svg>
        )}
      </div>
      {/* Flag overlay bottom-right */}
      {flagCode && (
        <div style={{
          position: "absolute", bottom: "-3px", right: "-4px",
          border: "1px solid var(--surface-0)",
          lineHeight: 0,
        }}>
          <Flag code={flagCode} size={13} />
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "— Select —",
  disabled = false,
  mode = "text",
}: {
  options:     SelectOption[];
  value:       string;
  onChange:    (v: string) => void;
  placeholder?: string;
  disabled?:   boolean;
  mode?:       "text" | "flag" | "player";
}) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);
  const listRef      = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        o.sublabel?.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 10);
    }
  }, [open]);

  // Close on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); setSearch(""); }
  };

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
    setSearch("");
  };

  // Flip upward if near bottom of viewport
  const [flipUp, setFlipUp] = useState(false);
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setFlipUp(window.innerHeight - rect.bottom < 320);
  }, [open]);

  // ── Render selected item inline ──────────────────────────────────────────
  const renderTriggerContent = () => {
    if (!selected) {
      return (
        <span style={{ color: "var(--text-500)", fontSize: "0.82rem", fontWeight: 500 }}>
          {placeholder}
        </span>
      );
    }
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
        {mode === "player" && (
          <PlayerAvatar
            photoUrl={selected.photoUrl}
            flagCode={selected.flagCode}
            name={selected.label}
          />
        )}
        {mode === "flag" && selected.flagCode && (
          <Flag code={selected.flagCode} size={20} />
        )}
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-100)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected.label}
          </span>
          {selected.sublabel && (
            <span style={{ fontSize: "0.68rem", color: "var(--text-400)", display: "block" }}>
              {selected.sublabel}
            </span>
          )}
        </div>
      </div>
    );
  };

  // ── Render each list item ────────────────────────────────────────────────
  const renderOption = (o: SelectOption) => (
    <button
      key={o.value}
      onMouseDown={() => handleSelect(o.value)}
      style={{
        width: "100%",
        display: "flex", alignItems: "center", gap: "0.6rem",
        padding: "0.55rem 0.75rem",
        background: o.value === value ? "rgba(0,212,255,0.08)" : "transparent",
        border: "none",
        borderLeft: o.value === value ? "2px solid var(--cyan-vivid)" : "2px solid transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.1s ease",
      }}
      onMouseEnter={(e) => {
        if (o.value !== value) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
      }}
      onMouseLeave={(e) => {
        if (o.value !== value) (e.currentTarget as HTMLElement).style.background = "var(--overlay-bg)";
      }}
    >
      {mode === "player" && (
        <PlayerAvatar photoUrl={o.photoUrl} flagCode={o.flagCode} name={o.label} />
      )}
      {mode === "flag" && o.flagCode && (
        <Flag code={o.flagCode} size={18} />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <span style={{
          fontSize: "0.82rem", fontWeight: o.value === value ? 700 : 500,
          color: o.value === value ? "var(--cyan-vivid)" : "var(--text-200)",
          display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {o.label}
        </span>
        {o.sublabel && (
          <span style={{ fontSize: "0.68rem", color: "var(--text-500)", display: "block" }}>
            {o.sublabel}
          </span>
        )}
      </div>
    </button>
  );

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      style={{ position: "relative", width: "100%" }}
    >
      {/* ── Trigger button ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "0.5rem",
          padding: "0.55rem 0.75rem",
          background: disabled ? "#0f0320" : open ? "#1a0535" : "#160430",
          border: `1px solid ${open ? "var(--overlay-border)" : "var(--border-default)"}`,
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          transition: "border-color 0.15s ease, background 0.15s ease",
          minHeight: "42px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderTriggerContent()}
        </div>
        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: "var(--text-500)",
          }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── Dropdown panel ──────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "absolute",
            [flipUp ? "bottom" : "top"]: "calc(100% + 4px)",
            left: 0, right: 0,
            zIndex: 200,
            background: "var(--overlay-bg)",
            border: "1px solid var(--overlay-border)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Search input */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "#0e0320",
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: "var(--text-400)" }}>
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search…"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "var(--text-100)", fontSize: "0.82rem",
                fontFamily: "var(--font-sans)",
              }}
            />
            {search && (
              <button
                onMouseDown={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-500)", padding: "0 2px", fontSize: "0.8rem" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Options list */}
          <div
            ref={listRef}
            style={{ maxHeight: "280px", overflowY: "auto", overflowX: "hidden" }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: "0.85rem 0.75rem", fontSize: "0.78rem", color: "var(--text-500)", textAlign: "center" }}>
                No results for &ldquo;{search}&rdquo;
              </div>
            ) : (
              filtered.map(renderOption)
            )}
          </div>

          {/* Count hint */}
          {filtered.length > 0 && (
            <div style={{
              padding: "0.35rem 0.75rem",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              background: "#0e0320",
            }}>
              <span style={{ fontSize: "0.62rem", color: "var(--text-500)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}{search ? ` for "${search}"` : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
